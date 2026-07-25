import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  FlatList,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Check, Plus, Trash2, ChevronsUpDown, Printer } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchProducts } from "@/api/products";
import { fetchSupermarkets } from "@/api/supermarkets";
import { createDeal } from "@/api/deals";
import { queryKeys } from "@/api/queryKeys";
import { formatMoney } from "@/lib/i18n";
import { printReceipt } from "@/lib/receipt";
import type { Deal } from "@/lib/types";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { cn } from "@/lib/utils";

type LineItem = { productId: string; quantity: string; unitPrice: string };

export function NewDealScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const queryClient = useQueryClient();
  const initialSupermarketId = route.params?.supermarketId ?? "";

  const [supermarketId, setSupermarketId] = useState(initialSupermarketId);
  const [clientOpen, setClientOpen] = useState(false);
  const [items, setItems] = useState<LineItem[]>([
    { productId: "", quantity: "1", unitPrice: "0" },
  ]);
  const [initialPayment, setInitialPayment] = useState("0");
  const [createdDeal, setCreatedDeal] = useState<Deal | null>(null);
  const [printing, setPrinting] = useState(false);

  const { data: products = [] } = useQuery({
    queryKey: queryKeys.products,
    queryFn: fetchProducts,
  });

  const { data: supermarkets = [] } = useQuery({
    queryKey: queryKeys.supermarkets,
    queryFn: fetchSupermarkets,
  });

  const createMutation = useMutation({
    mutationFn: createDeal,
    onSuccess: (deal) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.deals() });
      queryClient.invalidateQueries({ queryKey: queryKeys.supermarkets });
      queryClient.invalidateQueries({ queryKey: queryKeys.buyerDashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
      setCreatedDeal(deal);
    },
    onError: (err: Error) => Alert.alert("Erreur", err.message),
  });

  const total = useMemo(
    () =>
      items.reduce(
        (s, it) => s + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
        0,
      ),
    [items],
  );
  const remaining = Math.max(0, total - (Number(initialPayment) || 0));
  const selectedClient = supermarkets.find((s) => s.id === supermarketId);

  const updateItem = (idx: number, patch: Partial<LineItem>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const onSubmit = () => {
    if (!supermarketId) {
      Alert.alert("Erreur", "Sélectionnez un client");
      return;
    }
    const parsed = items
      .filter((it) => it.productId)
      .map((it) => ({
        productId: it.productId,
        quantity: Number(it.quantity) || 0,
        unitPrice: Number(it.unitPrice) || 0,
      }));
    if (parsed.length === 0 || parsed.some((it) => it.quantity <= 0)) {
      Alert.alert("Erreur", "Ajoutez au moins un article valide");
      return;
    }
    createMutation.mutate({
      supermarketId,
      items: parsed,
      initialPayment: Number(initialPayment) || 0,
    });
  };

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 140 + insets.bottom, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="rounded-2xl border border-slate-200 bg-white p-5">
          <View className="mb-3 flex-row items-center gap-2">
            <View className="h-6 w-6 items-center justify-center rounded-full bg-indigo-600">
              <Text className="text-xs font-bold text-white">1</Text>
            </View>
            <Text className="text-sm font-semibold text-slate-900">
              {t("common.selectClient")}
            </Text>
          </View>
          <Button variant="outline" onPress={() => setClientOpen(true)}>
            <Text className="flex-1 text-left text-slate-800">
              {selectedClient ? selectedClient.name : t("common.selectClient")}
            </Text>
            <ChevronsUpDown size={16} color="#94a3b8" />
          </Button>
        </View>

        <View className="rounded-2xl border border-slate-200 bg-white p-5">
          <View className="mb-3 flex-row items-center gap-2">
            <View className="h-6 w-6 items-center justify-center rounded-full bg-indigo-600">
              <Text className="text-xs font-bold text-white">2</Text>
            </View>
            <Text className="text-sm font-semibold text-slate-900">Articles</Text>
          </View>

          {items.map((item, idx) => {
            const product = products.find((p) => p.id === item.productId);
            return (
              <View key={idx} className="mb-3 rounded-xl border border-slate-200 p-3 gap-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs font-medium text-slate-500">#{idx + 1}</Text>
                  {items.length > 1 ? (
                    <TouchableOpacity
                      onPress={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      <Trash2 size={16} color="#94a3b8" />
                    </TouchableOpacity>
                  ) : null}
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {products.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() =>
                        updateItem(idx, {
                          productId: p.id,
                          unitPrice: String(p.basePrice),
                        })
                      }
                      className={cn(
                        "mr-2 rounded-xl border px-3 py-2",
                        item.productId === p.id
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-slate-200",
                      )}
                    >
                      <Text className="text-sm text-slate-800">{p.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {product ? (
                  <Text className="text-xs text-slate-500">
                    {product.name} · {formatMoney(product.basePrice, i18n.language)}
                  </Text>
                ) : null}

                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Input
                      label={`${t("common.quantity")} (Kg)`}
                      keyboardType="decimal-pad"
                      value={item.quantity}
                      onChangeText={(v) => updateItem(idx, { quantity: v })}
                    />
                  </View>
                  <View className="flex-1">
                    <Input
                      label={t("common.unitPrice")}
                      keyboardType="decimal-pad"
                      value={item.unitPrice}
                      onChangeText={(v) => updateItem(idx, { unitPrice: v })}
                    />
                  </View>
                </View>
              </View>
            );
          })}

          <Button
            variant="outline"
            onPress={() =>
              setItems((prev) => [...prev, { productId: "", quantity: "1", unitPrice: "0" }])
            }
          >
            <Plus size={16} color="#334155" />
            <Text className="font-semibold text-slate-700">{t("common.addProduct")}</Text>
          </Button>
        </View>

        <View className="rounded-2xl border border-slate-200 bg-white p-5">
          <View className="mb-3 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="h-6 w-6 items-center justify-center rounded-full bg-indigo-600">
                <Text className="text-xs font-bold text-white">3</Text>
              </View>
              <Text className="text-sm font-semibold text-slate-900">
                {t("common.initialPayment")}
              </Text>
            </View>
            <TouchableOpacity
              disabled={total <= 0}
              onPress={() => setInitialPayment(String(total))}
            >
              <Text className="text-xs font-medium text-indigo-600">Tout payer</Text>
            </TouchableOpacity>
          </View>
          <Input
            keyboardType="decimal-pad"
            value={initialPayment}
            onChangeText={setInitialPayment}
          />
          <View className="mt-3 flex-row items-center justify-between">
            <Text className="text-xs text-slate-500">Restant après paiement</Text>
            <Text className="text-xs font-semibold">
              {formatMoney(remaining, i18n.language)}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View
        className="absolute inset-x-0 bottom-0 border-t border-indigo-700 bg-indigo-600 px-4 pt-4"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <View className="flex-row items-center justify-between gap-3">
          <View>
            <Text className="text-xs uppercase tracking-wider text-white/70">
              {t("common.total")}
            </Text>
            <Text className="text-2xl font-bold text-white">
              {formatMoney(total, i18n.language)}
            </Text>
          </View>
          <Button
            className="rounded-2xl bg-white px-6"
            textClassName="text-indigo-600"
            loading={createMutation.isPending}
            onPress={onSubmit}
          >
            {t("common.confirmDeal")}
          </Button>
        </View>
      </View>

      <Modal visible={clientOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[70%] rounded-t-3xl bg-white p-5">
            <Text className="mb-3 text-lg font-bold">{t("common.selectClient")}</Text>
            <FlatList
              data={supermarkets}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="flex-row items-center border-b border-slate-100 py-3"
                  onPress={() => {
                    setSupermarketId(item.id);
                    setClientOpen(false);
                  }}
                >
                  <Check
                    size={16}
                    color={supermarketId === item.id ? "#4f46e5" : "transparent"}
                  />
                  <View className="ml-2 flex-1">
                    <Text className="text-sm font-medium text-slate-900">{item.name}</Text>
                    <Text className="text-xs text-slate-500">{item.address}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
            <Button variant="outline" className="mt-3" onPress={() => setClientOpen(false)}>
              Fermer
            </Button>
          </View>
        </View>
      </Modal>

      <Modal visible={!!createdDeal} animationType="fade" transparent>
        <View className="flex-1 justify-end bg-black/50 sm:justify-center">
          <View className="rounded-t-3xl bg-white">
            <View className="bg-indigo-600 px-5 py-4">
              <Text className="text-[11px] font-medium uppercase tracking-widest text-white/70">
                {t("common.receipt")}
              </Text>
              <Text className="text-lg font-bold text-white">{createdDeal?.reference}</Text>
            </View>
            <View className="flex-row items-center gap-3 border-b border-slate-200 bg-green-50 px-5 py-3">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-green-500">
                <Check size={16} color="#fff" />
              </View>
              <Text className="text-sm font-semibold text-green-700">
                Vente enregistrée avec succès
              </Text>
            </View>
            <View className="gap-3 px-5 py-4">
              <View className="flex-row justify-between rounded-xl bg-slate-50 px-4 py-3">
                <Text className="text-xs uppercase text-slate-500">Client</Text>
                <Text className="text-sm font-semibold">
                  {createdDeal?.supermarketName || "–"}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-slate-500">{t("common.total")}</Text>
                <Text className="font-medium">
                  {formatMoney(createdDeal?.total ?? 0, i18n.language)}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-slate-500">Payé</Text>
                <Text className="font-medium text-green-600">
                  {formatMoney(createdDeal?.paid ?? 0, i18n.language)}
                </Text>
              </View>
              <View className="flex-row justify-between border-t border-slate-200 pt-2">
                <Text className="font-semibold">Restant</Text>
                <Text className="font-bold">
                  {formatMoney(createdDeal?.remaining ?? 0, i18n.language)}
                </Text>
              </View>
            </View>
            <View
              className="gap-3 border-t border-slate-200 px-5 pt-4"
              style={{ paddingBottom: Math.max(insets.bottom, 16) }}
            >
              <Button
                loading={printing}
                onPress={async () => {
                  if (!createdDeal) return;
                  setPrinting(true);
                  try {
                    await printReceipt(createdDeal, i18n.language);
                  } finally {
                    setPrinting(false);
                  }
                }}
              >
                <Printer size={16} color="#fff" />
                <Text className="font-semibold text-white">
                  {i18n.language?.startsWith("ar") ? "طباعة الإيصال" : "Imprimer le reçu"}
                </Text>
              </Button>
              <Button
                variant="outline"
                onPress={() => {
                  setCreatedDeal(null);
                  navigation.goBack();
                }}
              >
                Retour
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
