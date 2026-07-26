import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator, KeyboardAvoidingView, Platform, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "node_modules/react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  ArrowLeft,
  Phone,
  MapPin,
  Plus,
  CircleDollarSign,
  Pencil,
  Store,
} from "lucide-react-native";
import { fetchSupermarkets, updateSupermarket } from "@/api/supermarkets";
import { fetchDeals } from "@/api/deals";
import { queryKeys } from "@/api/queryKeys";
import { formatMoney } from "@/lib/i18n";
import { StatusPill } from "@/components/Bento";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import type { Deal } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Alert } from "@/components/CustomAlert";

export function ClientDetailScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const clientId = route.params?.clientId as string;
  const queryClient = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const { data: supermarkets = [], isLoading } = useQuery({
    queryKey: queryKeys.supermarkets,
    queryFn: fetchSupermarkets,
  });

  const { data: deals = [] } = useQuery({
    queryKey: queryKeys.deals(),
    queryFn: () => fetchDeals(),
  });

  const client = useMemo(
    () => supermarkets.find((s) => s.id === clientId),
    [supermarkets, clientId],
  );

  const clientDeals = useMemo(
    () => deals.filter((d) => d.supermarketId === clientId),
    [deals, clientId],
  );

  const updateMutation = useMutation({
    mutationFn: () =>
      updateSupermarket(clientId, {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.supermarkets });
      setEditOpen(false);
      Alert.alert("Succès", "Client mis à jour");
    },
    onError: (err: Error) => Alert.alert("Erreur", err.message),
  });

  if (isLoading || !client) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center gap-2 border-b border-slate-200 bg-white px-4 py-3">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2" hitSlop={8}>
          <ArrowLeft size={18} color="#64748b" />
        </TouchableOpacity>
        <Text className="flex-1 text-base font-semibold text-slate-900" numberOfLines={1}>
          {client.name}
        </Text>
        <TouchableOpacity
          onPress={() => {
            setName(client.name);
            setPhone(client.phone);
            setAddress(client.address ?? "");
            setEditOpen(true);
          }}
          className="p-2"
          hitSlop={8}
        >
          <Pencil size={16} color="#64748b" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}>
        <View className="rounded-2xl border border-slate-200 bg-white p-5">
          <View className="flex-row items-start gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
              <Store size={18} color="#64748b" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-slate-900">{client.name}</Text>
              <View className="mt-2 gap-1">
                <View className="flex-row items-center gap-2">
                  <Phone size={14} color="#94a3b8" />
                  <Text className="text-sm text-slate-500">{client.phone}</Text>
                </View>
                {client.address ? (
                  <View className="flex-row items-center gap-2">
                    <MapPin size={14} color="#94a3b8" />
                    <Text className="flex-1 text-sm text-slate-500">{client.address}</Text>
                  </View>
                ) : null}
              </View>
            </View>
            <View
              className={cn(
                "rounded-full border px-2.5 py-0.5",
                client.totalDebt === 0
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-blue-200 bg-blue-50",
              )}
            >
              <Text
                className={cn(
                  "text-xs font-medium",
                  client.totalDebt === 0 ? "text-emerald-700" : "text-blue-700",
                )}
              >
                {formatMoney(client.totalDebt, i18n.language)}
              </Text>
            </View>
          </View>

          <View className="mt-4 flex-row gap-2">
            <View className="flex-1">
              <Button
                variant="outline"
                className="border-blue-200 bg-blue-50"
                onPress={() =>
                  navigation.navigate("NewDeal", { supermarketId: client.id })
                }
              >
                <Plus size={16} color="#2563eb" />
                <Text className="font-semibold text-blue-600">{t("common.newDeal")}</Text>
              </Button>
            </View>
            <View className="flex-1">
              <Button
                variant="outline"
                className="border-red-200 bg-red-50"
                disabled={client.totalDebt === 0}
                onPress={() =>
                  navigation.navigate("CollectPayment", {
                    supermarketId: client.id,
                    supermarketName: client.name,
                  })
                }
              >
                <CircleDollarSign size={16} color="#dc2626" />
                <Text className="font-semibold text-red-600">{t("common.collect")}</Text>
              </Button>
            </View>
          </View>
        </View>

        <Text className="mb-3 mt-5 text-base font-bold text-slate-900">{t("nav.myDeals")}</Text>
        {clientDeals.length === 0 ? (
          <Text className="text-sm text-slate-500">Aucune vente pour ce client</Text>
        ) : (
          clientDeals.map((d: Deal) => (
            <TouchableOpacity
              key={d.id}
              onPress={() => navigation.navigate("DealDetail", { dealId: d.id })}
              className="mb-3 flex-row items-center justify-between rounded-2xl border border-slate-200 bg-white p-4"
            >
              <View>
                <Text className="font-mono text-xs text-slate-500">{d.reference}</Text>
                <Text className="mt-1 text-xs text-slate-500">
                  {new Date(d.createdAt).toLocaleDateString(
                    i18n.language?.startsWith("ar") ? "ar-MA" : "fr-FR",
                  )}
                </Text>
              </View>
              <View className="items-end gap-1">
                <Text className="font-bold text-slate-900">
                  {formatMoney(d.total, i18n.language)}
                </Text>
                <StatusPill status={d.status} />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal visible={editOpen} animationType="slide" transparent onRequestClose={() => setEditOpen(false)}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable className="flex-1 bg-black/40" onPress={() => setEditOpen(false)} />
          <View
            className="gap-4 rounded-t-3xl bg-white px-5 pt-5"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          >
            <Text className="text-lg font-bold">Modifier le client</Text>
            <Input label={t("common.name")} value={name} onChangeText={setName} />
            <Input
              label="Téléphone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <Input label="Adresse" value={address} onChangeText={setAddress} />
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Button variant="outline" onPress={() => setEditOpen(false)}>
                  {t("common.cancel")}
                </Button>
              </View>
              <View className="flex-1">
                <Button loading={updateMutation.isPending} onPress={() => updateMutation.mutate()}>
                  {t("common.save")}
                </Button>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
