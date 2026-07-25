import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Printer, Trash2 } from "lucide-react-native";
import { fetchDeal, deleteDeal } from "@/api/deals";
import { queryKeys } from "@/api/queryKeys";
import { clearApiCache } from "@/lib/api";
import { formatMoney } from "@/lib/i18n";
import { printReceipt } from "@/lib/receipt";
import { StatusPill } from "@/components/Bento";
import { Button } from "@/components/Button";
import { cn } from "@/lib/utils";

export function DealDetailScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const queryClient = useQueryClient();
  const dealId = route.params?.dealId as string;
  const [printing, setPrinting] = useState(false);

  const lang = i18n.language;
  const isAr = lang?.startsWith("ar");

  const { data: deal, isLoading, error } = useQuery({
    queryKey: queryKeys.deal(dealId),
    queryFn: () => fetchDeal(dealId),
    enabled: !!dealId,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteDeal(dealId),
    onSuccess: async () => {
      await clearApiCache("/deals");
      await clearApiCache("/supermarkets");
      await clearApiCache("/products");
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

        {deal.remaining > 0 ? (
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
