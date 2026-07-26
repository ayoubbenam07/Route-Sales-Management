import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "node_modules/react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigation, useRoute } from "@react-navigation/native";
import { fetchDeals } from "@/api/deals";
import { createPayment } from "@/api/payments";
import { queryKeys } from "@/api/queryKeys";
import { clearApiCache } from "@/lib/api";
import { formatMoney } from "@/lib/i18n";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { cn } from "@/lib/utils";
import type { Deal } from "@/lib/types";
import { useAuth } from "@/stores/auth";

export function CollectPaymentScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const queryClient = useQueryClient();

  const supermarketId = route.params?.supermarketId as string;
  const supermarketName = route.params?.supermarketName as string | undefined;
  const presetDealId = route.params?.dealId as string | undefined;

  const [dealId, setDealId] = useState(presetDealId ?? "");
  const [amount, setAmount] = useState("");

  const { data: deals = [], isLoading } = useQuery({
    queryKey: queryKeys.deals(),
    queryFn: () => fetchDeals(),
  });

  const user = useAuth((s) => s.user);

  const openDeals = useMemo(
    () =>
      deals.filter(
        (d) =>
          d.supermarketId === supermarketId &&
          d.remaining > 0 &&
          d.status !== "PAID" &&
          (user?.role === "ADMIN" || d.buyerId === user?.id),
      ),
    [deals, supermarketId, user],
  );

  useEffect(() => {
    if (!dealId && openDeals.length === 1) {
      setDealId(openDeals[0].id);
      setAmount("0");
    } else if (presetDealId && openDeals.some((d) => d.id === presetDealId)) {
      const d = openDeals.find((x) => x.id === presetDealId);
      if (d && !amount) setAmount("0");
    }
  }, [openDeals, dealId, presetDealId, amount]);

  const selected = openDeals.find((d) => d.id === dealId);

  const paymentMutation = useMutation({
    mutationFn: async () => {
      const parsed = Math.round(Number(String(amount).replace(",", ".")) * 100) / 100;
      if (!dealId) throw new Error("Sélectionnez une vente");
      if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error("Montant invalide");
      }
      const safeRemaining = selected ? Math.round(selected.remaining * 100) / 100 : 0;
      if (selected && parsed > safeRemaining + 0.001) {
        throw new Error(`Montant trop élevé. Restant: ${selected.remaining}`);
      }
      return createPayment({
        dealId,
        amount: parsed,
        method: "CASH",
      });
    },
    onSuccess: async () => {
      await clearApiCache("/deals");
      await clearApiCache("/supermarkets");
      await clearApiCache("/payment");
      queryClient.invalidateQueries({ queryKey: queryKeys.supermarkets });
      queryClient.invalidateQueries({ queryKey: queryKeys.deals() });
      queryClient.invalidateQueries({ queryKey: queryKeys.deal(dealId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.buyerDashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.payments });
      Alert.alert("Succès", `Paiement enregistré${supermarketName ? ` pour ${supermarketName}` : ""}`);
      navigation.goBack();
    },
    onError: (err: Error) => Alert.alert("Erreur", err.message),
  });

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-50"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={insets.top + 56}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="mb-1 text-xl font-bold text-slate-900">
          {t("common.collect")}
        </Text>
        <Text className="mb-5 text-sm text-slate-500">
          {supermarketName || "Client"}
        </Text>

        {isLoading ? (
          <ActivityIndicator color="#4f46e5" />
        ) : openDeals.length === 0 ? (
          <View className="rounded-2xl border border-slate-200 bg-white p-5">
            <Text className="text-sm text-slate-500">Aucune vente impayée</Text>
          </View>
        ) : (
          <View className="gap-4">
            <Text className="text-sm font-medium text-slate-700">Vente</Text>
            {openDeals.map((d: Deal) => (
              <TouchableOpacity
                key={d.id}
                onPress={() => {
                  setDealId(d.id);
                  setAmount(String(d.remaining));
                }}
                className={cn(
                  "rounded-2xl border bg-white p-4",
                  dealId === d.id ? "border-indigo-500 bg-indigo-50" : "border-slate-200",
                )}
              >
                <Text className="font-semibold text-slate-900">{d.reference}</Text>
                <Text className="mt-1 text-sm text-slate-500">
                  Restant {formatMoney(d.remaining, i18n.language)}
                </Text>
              </TouchableOpacity>
            ))}

            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-medium text-slate-700">Montant</Text>
              <TouchableOpacity
                disabled={!selected}
                onPress={() => {
                  if (selected) setAmount(String(selected.remaining));
                }}
                hitSlop={10}
              >
                <Text className="text-sm font-semibold text-indigo-600">Tout payer</Text>
              </TouchableOpacity>
            </View>

            <Input
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
            />

            <Button
              className="bg-red-600"
              loading={paymentMutation.isPending}
              disabled={!dealId || !amount}
              onPress={() => paymentMutation.mutate()}
            >
              {t("common.collect")}
            </Button>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
