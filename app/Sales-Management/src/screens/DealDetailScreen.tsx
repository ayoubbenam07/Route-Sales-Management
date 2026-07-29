import React, { useRef, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "node_modules/react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Printer, Trash2 } from "lucide-react-native";
import { fetchDeal, deleteDeal } from "@/api/deals";
import { fetchPaymentsByDeal, deletePayment as deletePaymentApi } from "@/api/payments";
import { queryKeys } from "@/api/queryKeys";

import { formatMoney } from "@/lib/i18n";
import { printReceipt } from "@/lib/receipt";
import { StatusPill } from "@/components/Bento";
import { Button } from "@/components/Button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/stores/auth";
import { Alert } from "@/components/CustomAlert";

export function DealDetailScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const queryClient = useQueryClient();
  const dealId = route.params?.dealId as string;
  const user = useAuth((s) => s.user);
  const [printing, setPrinting] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);

  const lang = i18n.language;
  const isAr = lang?.startsWith("ar");

  const { data: deal, isLoading, error } = useQuery({
    queryKey: queryKeys.deal(dealId),
    queryFn: () => fetchDeal(dealId),
    enabled: !!dealId,
  });

  const { data: payments } = useQuery({
    queryKey: queryKeys.paymentsByDeal(dealId),
    queryFn: () => fetchPaymentsByDeal(dealId),
    enabled: !!dealId,
  });

  // Track how many delete mutations are in-flight to prevent race conditions.
  // Without this, deleting A then B quickly causes A's onSettled refetch to
  // overwrite B's optimistic removal, making B "flash back" briefly.
  const pendingDeletesRef = useRef(0);

  const deletePaymentMutation = useMutation({
    mutationFn: async (id: string) => {
      setDeletingPaymentId(id);
      pendingDeletesRef.current++;
      return deletePaymentApi(id);
    },
    onMutate: async (id: string) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.paymentsByDeal(dealId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.deal(dealId) });

      // Snapshot the previous values for rollback
      const previousPayments = queryClient.getQueryData(queryKeys.paymentsByDeal(dealId));
      const previousDeal = queryClient.getQueryData(queryKeys.deal(dealId));

      // Find the payment being deleted to get its amount
      const deletedPayment = (previousPayments as any[] | undefined)?.find((p: any) => p.id === id);
      const deletedAmount = deletedPayment?.amount || 0;

      // Optimistically remove the payment from the cached list
      queryClient.setQueryData(queryKeys.paymentsByDeal(dealId), (old: any[] | undefined) =>
        old ? old.filter((p: any) => p.id !== id) : []
      );

      // Optimistically update the deal summary (Payé / Restant / status)
      if (deletedAmount > 0) {
        queryClient.setQueryData(queryKeys.deal(dealId), (old: any) => {
          if (!old) return old;
          const newPaid = Math.max(0, (old.paid || 0) - deletedAmount);
          const newRemaining = (old.total || old.totalAmount || 0) - newPaid;
          let newStatus = 'UNPAID';
          if (newRemaining <= 0) newStatus = 'PAID';
          else if (newPaid > 0) newStatus = 'PARTIAL';
          return { ...old, paid: newPaid, remaining: Math.max(0, newRemaining), status: newStatus };
        });
      }

      return { previousPayments, previousDeal };
    },
    onError: (err: Error, _id, context) => {
      // Rollback to the previous values on error
      if (context?.previousPayments) {
        queryClient.setQueryData(queryKeys.paymentsByDeal(dealId), context.previousPayments);
      }
      if (context?.previousDeal) {
        queryClient.setQueryData(queryKeys.deal(dealId), context.previousDeal);
      }
      Alert.alert("Erreur", err.message);
    },
    onSettled: async () => {
      pendingDeletesRef.current = Math.max(0, pendingDeletesRef.current - 1);
      setDeletingPaymentId(null);

      // Only refetch from SQLite when ALL in-flight deletes have completed.
      // This prevents mutation A's refetch from overwriting mutation B's
      // optimistic removal (which caused the "flash back" bug).
      if (pendingDeletesRef.current === 0) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.paymentsByDeal(dealId) });
        await queryClient.invalidateQueries({ queryKey: queryKeys.deal(dealId) });
        await queryClient.invalidateQueries({ queryKey: queryKeys.deals() });
        queryClient.invalidateQueries({ queryKey: queryKeys.supermarkets });
        queryClient.invalidateQueries({ queryKey: queryKeys.buyerDashboard });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteDeal(dealId),
    onSuccess: async () => {

      queryClient.invalidateQueries({ queryKey: queryKeys.deals() });
      queryClient.invalidateQueries({ queryKey: queryKeys.supermarkets });
      queryClient.invalidateQueries({ queryKey: queryKeys.buyerDashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
      Alert.alert(
        "Succès",
        isAr ? "تم حذف المعاملة بنجاح" : "La vente a été supprimée avec succès",
      );
      navigation.goBack();
    },
    onError: (err: Error) => {
      Alert.alert(
        "Erreur",
        err.message ||
        (isAr
          ? "حدث خطأ أثناء حذف المعاملة"
          : "Erreur lors de la suppression de la vente"),
      );
    },
  });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (error || !deal) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-6">
        <Text className="text-center text-slate-600">
          {(error as Error)?.message || "Vente introuvable"}
        </Text>
        <View className="mt-4 w-full">
          <Button variant="outline" onPress={() => navigation.goBack()}>
            Retour
          </Button>
        </View>
      </View>
    );
  }

  const fmt = (v: number) => formatMoney(v, lang);
  const date = new Date(deal.createdAt).toLocaleString(isAr ? "ar-MA" : "fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}
    >
      <View className="mb-4 flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-lg font-bold text-slate-900">
            {t("common.receipt")} · {deal.reference}
          </Text>
          <Text className="mt-1 text-xs text-slate-500">{date}</Text>
        </View>
        <StatusPill status={deal.status} />
      </View>

      <View className="mb-3 flex-row items-center justify-between rounded-xl bg-white border border-slate-200 px-4 py-3">
        <View>
          <Text className="text-[10px] uppercase tracking-wider text-slate-500">
            {isAr ? "العميل" : "Client"}
          </Text>
          <Text className="text-sm font-semibold">{deal.supermarketName || "–"}</Text>
        </View>
      </View>

      {deal.buyerName ? (
        <View className="mb-3 flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
          <Text className="text-[10px] uppercase tracking-wider text-slate-500">
            {isAr ? "البائع" : "Vendeur"}
          </Text>
          <Text className="text-sm font-semibold">{deal.buyerName}</Text>
        </View>
      ) : null}

      <View className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <View className="flex-row bg-slate-50 px-3 py-2">
          <Text className="flex-1 text-[11px] font-medium uppercase text-slate-500">
            {isAr ? "المنتج" : "Produit"}
          </Text>
          <Text className="w-16 text-center text-[11px] font-medium uppercase text-slate-500">
            {isAr ? "الكمية" : "Qté"}
          </Text>
          <Text className="w-20 text-right text-[11px] font-medium uppercase text-slate-500">
            {isAr ? "المجموع" : "Total"}
          </Text>
        </View>
        {deal.items.map((it, i) => (
          <View key={i} className="flex-row border-t border-slate-100 px-3 py-2.5">
            <Text className="flex-1 text-sm text-slate-800" numberOfLines={2}>
              {it.productName || it.productId}
            </Text>
            <Text className="w-16 text-center text-sm text-slate-500">{it.quantity} Kg</Text>
            <Text className="w-20 text-right text-sm font-medium">
              {fmt(it.quantity * it.unitPrice)}
            </Text>
          </View>
        ))}
      </View>

      <View className="mb-6 gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <View className="flex-row justify-between">
          <Text className="text-sm text-slate-500">{t("common.total")}</Text>
          <Text className="text-sm font-medium">{fmt(deal.total)}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-sm text-slate-500">{isAr ? "مدفوع" : "Payé"}</Text>
          <Text className="text-sm font-medium text-green-600">{fmt(deal.paid)}</Text>
        </View>
        <View className="mt-1 flex-row justify-between border-t border-slate-100 pt-2">
          <Text className="font-semibold">{isAr ? "المتبقي" : "Restant"}</Text>
          <Text
            className={cn(
              "font-bold",
              deal.remaining > 0 ? "text-rose-600" : "text-green-600",
            )}
          >
            {fmt(deal.remaining)}
          </Text>
        </View>
      </View>

      {payments && payments.length > 0 ? (
        <View className="mb-6 rounded-xl border border-slate-200 bg-white">
          <View className="bg-slate-50 px-4 py-3 border-b border-slate-200 rounded-t-xl">
            <Text className="font-semibold text-slate-800">
              {isAr ? "سجل المدفوعات" : "Historique des paiements"}
            </Text>
          </View>
          {payments.map((p, i) => (
            <View key={p.id} className={cn("px-4 py-3 border-slate-100", i > 0 && "border-t")}>
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="font-semibold text-slate-800">{fmt(p.amount)}</Text>
                  <Text className="text-xs text-slate-500 mt-0.5">
                    {new Date(p.paymentDate).toLocaleString(isAr ? "ar-MA" : "fr-FR", { dateStyle: "medium", timeStyle: "short" })}
                    {" · "}{p.method}
                  </Text>
                </View>
                {user?.role === "ADMIN" || deal.buyerId === user?.id ? (
                  <View className="flex-row gap-3">
                    <Button
                      variant="destructive"
                      className="px-4 py-2.5 h-auto bg-red-50 border border-red-200 rounded-lg min-w-[44px] min-h-[44px] items-center justify-center"
                      loading={deletingPaymentId === p.id}
                      disabled={deletingPaymentId !== null}
                      onPress={() => {
                        Alert.alert(
                          isAr ? "تأكيد" : "Confirmer",
                          isAr ? "حذف هذه الدفعة؟" : "Supprimer ce paiement ?",
                          [
                            { text: t("common.cancel"), style: "cancel" },
                            {
                              text: isAr ? "حذف" : "Supprimer",
                              style: "destructive",
                              onPress: () => deletePaymentMutation.mutate(p.id)
                            }
                          ]
                        );
                      }}
                    >
                      <Trash2 size={18} color="#dc2626" />
                    </Button>
                  </View>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <View className="gap-3">
        <Button
          loading={printing}
          onPress={async () => {
            setPrinting(true);
            try {
              await printReceipt(deal, lang);
            } finally {
              setPrinting(false);
            }
          }}
          className="bg-indigo-600"
        >
          <Printer size={16} color="#fff" />
          <Text className="font-semibold text-white">
            {isAr ? "طباعة الإيصال" : "Imprimer le reçu"}
          </Text>
        </Button>

        {deal.remaining > 0 && (user?.role === "ADMIN" || deal.buyerId === user?.id) ? (
          <Button
            variant="outline"
            className="border-red-200 bg-red-50"
            onPress={() =>
              navigation.navigate("CollectPayment", {
                supermarketId: deal.supermarketId,
                supermarketName: deal.supermarketName,
                dealId: deal.id,
              })
            }
          >
            <Text className="font-semibold text-red-600">{t("common.collect")}</Text>
          </Button>
        ) : null}

        <Button
          variant="destructive"
          loading={deleteMutation.isPending}
          onPress={() => {
            Alert.alert(
              isAr ? "تأكيد" : "Confirmer",
              isAr
                ? "هل أنت متأكد من حذف هذه المعاملة؟"
                : "Êtes-vous sûr de vouloir supprimer cette vente ?",
              [
                { text: t("common.cancel"), style: "cancel" },
                {
                  text: isAr ? "حذف" : "Supprimer",
                  style: "destructive",
                  onPress: () => deleteMutation.mutate(),
                },
              ],
            );
          }}
        >
          <Trash2 size={16} color="#fff" />
          <Text className="font-semibold text-white">
            {isAr ? "حذف البيع" : "Supprimer la vente"}
          </Text>
        </Button>
      </View>
    </ScrollView>
  );
}
