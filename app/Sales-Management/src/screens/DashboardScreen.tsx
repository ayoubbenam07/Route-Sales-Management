import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "node_modules/react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Wallet,
  Plus,
  Phone,
  MapPin,
  HandCoins,
  Pencil,
  Store,
  Star,
  Search,
} from "lucide-react-native";
import { fetchBuyerDashboard } from "@/api/analytics";
import { fetchSupermarkets, createSupermarket, updateSupermarket } from "@/api/supermarkets";
import { queryKeys } from "@/api/queryKeys";
import { formatMoney } from "@/lib/i18n";
import { useAuth } from "@/stores/auth";
import { BentoCard } from "@/components/Bento";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import type { Supermarket } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Alert } from "@/components/CustomAlert";

export function DashboardScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const user = useAuth((s) => s.user);

  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [formOpen, setFormOpen] = useState<"create" | Supermarket | null>(null);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formAddress, setFormAddress] = useState("");

  useEffect(() => {
    if (!user?.id) return;
    AsyncStorage.getItem(`rs-favorites-${user.id}`).then((stored) => {
      if (!stored) return;
      try {
        setFavorites(JSON.parse(stored));
      } catch {
        // ignore
      }
    });
  }, [user?.id]);

  const toggleFavorite = (supermarketId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(supermarketId)
        ? prev.filter((id) => id !== supermarketId)
        : [...prev, supermarketId];
      if (user?.id) {
        AsyncStorage.setItem(`rs-favorites-${user.id}`, JSON.stringify(next));
      }
      return next;
    });
  };

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: queryKeys.buyerDashboard,
    queryFn: fetchBuyerDashboard,
  });

  const { data: supermarkets = [], isLoading: supermarketsLoading } = useQuery({
    queryKey: queryKeys.supermarkets,
    queryFn: fetchSupermarkets,
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: queryKeys.buyerDashboard });
    await queryClient.invalidateQueries({ queryKey: queryKeys.supermarkets });
    setRefreshing(false);
  }, [queryClient]);

  const filteredAndSorted = useMemo(() => {
    let result = [...supermarkets];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) => s.name.toLowerCase().includes(q) || s.phone.includes(q),
      );
    }
    result.sort((a, b) => {
      const aFav = favorites.includes(a.id);
      const bFav = favorites.includes(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return a.name.localeCompare(b.name);
    });
    return result;
  }, [supermarkets, favorites, searchQuery]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = {
        name: formName.trim(),
        phone: formPhone.trim(),
        address: formAddress.trim(),
      };
      if (!body.name || body.name.length < 2) throw new Error("Nom requis");
      if (!body.phone || body.phone.length < 6) throw new Error("Téléphone requis");
      if (formOpen === "create") return createSupermarket(body);
      if (formOpen && typeof formOpen === "object") return updateSupermarket(formOpen.id, body);
      throw new Error("Invalid form state");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.supermarkets });
      setFormOpen(null);
      Alert.alert(
        "Succès",
        formOpen === "create" ? "Supermarché créé" : "Supermarché mis à jour",
      );
    },
    onError: (err: Error) => Alert.alert("Erreur", err.message),
  });

  if (analyticsLoading || supermarketsLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <BentoCard title={t("common.debtToCollect")} icon={<Wallet size={16} color="#4f46e5" />}>
          <Text className="text-2xl font-bold text-slate-900">
            {formatMoney(analytics?.totalDebtResponsible ?? 0, i18n.language)}
          </Text>
          <Text className="mt-2 text-xs text-slate-500">À recouvrer auprès des clients</Text>
        </BentoCard>

        <View className="mt-4">
          <Button
            variant="outline"
            size="lg"
            className="border-blue-200 bg-blue-50"
            onPress={() => navigation.navigate("NewDeal")}
          >
            <Plus size={18} color="#2563eb" />
            <Text className="font-semibold text-blue-600">{t("common.newDeal")}</Text>
          </Button>
        </View>

        <View className="mt-5 flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-xl font-bold text-slate-900">{t("nav.clients")}</Text>
            <Text className="mt-1 text-xs text-slate-500">
              {supermarkets.length} clients sur votre tournée
            </Text>
          </View>
          <Button
            size="sm"
            onPress={() => {
              setFormName("");
              setFormPhone("");
              setFormAddress("");
              setFormOpen("create");
            }}
          >
            <Plus size={16} color="#fff" />
            <Text className="font-semibold text-white">Ajouter</Text>
          </Button>
        </View>

        <View className="relative mt-3">
          <View className="absolute left-3 top-3.5 z-10">
            <Search size={16} color="#94a3b8" />
          </View>
          <Input
            className="pl-9"
            placeholder={i18n.language?.startsWith("ar") ? "بحث عن عميل..." : "Rechercher un client..."}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View className="mt-3 gap-3">
          {filteredAndSorted.map((s) => {
            const hasAddress = !!s.address && s.address.trim() !== "";
            return (
              <View key={s.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <TouchableOpacity
                  onPress={() => navigation.navigate("ClientDetail", { clientId: s.id })}
                  className="flex-row items-start justify-between gap-3"
                >
                  <View className="min-w-0 flex-1 flex-row items-start gap-3">
                    {hasAddress ? (
                      <View className="h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                        <Store size={16} color="#64748b" />
                      </View>
                    ) : null}
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text
                          className="flex-1 text-base font-semibold text-slate-900"
                          numberOfLines={1}
                        >
                          {s.name}
                        </Text>
                        <TouchableOpacity
                          onPress={() => toggleFavorite(s.id)}
                          hitSlop={10}
                        >
                          <Star
                            size={18}
                            color={favorites.includes(s.id) ? "#eab308" : "#94a3b8"}
                            fill={favorites.includes(s.id) ? "#facc15" : "transparent"}
                          />
                        </TouchableOpacity>
                      </View>
                      <View className="mt-2 gap-1">
                        <View className="flex-row items-center gap-2">
                          <Phone size={12} color="#94a3b8" />
                          <Text className="text-xs text-slate-500">{s.phone}</Text>
                        </View>
                        {hasAddress ? (
                          <View className="flex-row items-center gap-2">
                            <MapPin size={12} color="#94a3b8" />
                            <Text className="flex-1 text-xs text-slate-500" numberOfLines={1}>
                              {s.address}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </View>

                  <View className="items-end gap-2">
                    <View
                      className={cn(
                        "rounded-full border px-2.5 py-0.5",
                        s.totalDebt === 0
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-blue-200 bg-blue-50",
                      )}
                    >
                      <Text
                        className={cn(
                          "text-xs font-medium",
                          s.totalDebt === 0 ? "text-emerald-700" : "text-blue-700",
                        )}
                      >
                        {formatMoney(s.totalDebt, i18n.language)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setFormName(s.name);
                        setFormPhone(s.phone);
                        setFormAddress(s.address ?? "");
                        setFormOpen(s);
                      }}
                      hitSlop={8}
                      className="p-1"
                    >
                      <Pencil size={14} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>

                <View className="mt-4 flex-row gap-2">
                  <View className="flex-1">
                    <Button
                      variant="outline"
                      className="border-blue-200 bg-blue-50"
                      onPress={() =>
                        navigation.navigate("NewDeal", { supermarketId: s.id })
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
                      disabled={s.totalDebt === 0}
                      onPress={() =>
                        navigation.navigate("CollectPayment", {
                          supermarketId: s.id,
                          supermarketName: s.name,
                        })
                      }
                    >
                      <HandCoins size={16} color="#dc2626" />
                      <Text className="font-semibold text-red-600">{t("common.collect")}</Text>
                    </Button>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <Modal
        visible={!!formOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setFormOpen(null)}
      >
        <KeyboardAvoidingView
          className="flex-1 bg-black/40 justify-start pt-24 px-4"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable className="absolute inset-0" onPress={() => setFormOpen(null)} />
          <View
            className="rounded-3xl bg-white p-5 shadow-lg"
          >
            <Text className="mb-4 text-lg font-bold text-slate-900">
              {formOpen === "create" ? "Nouveau supermarché" : "Modifier le supermarché"}
            </Text>
            <View className="gap-3">
              <Input label={t("common.name")} value={formName} onChangeText={setFormName} />
              <Input
                label="Téléphone"
                value={formPhone}
                onChangeText={setFormPhone}
                keyboardType="phone-pad"
              />
              <Input
                label="Adresse (optionnelle)"
                value={formAddress}
                onChangeText={setFormAddress}
              />
            </View>
            <View className="mt-4 flex-row gap-2">
              <View className="flex-1">
                <Button variant="outline" onPress={() => setFormOpen(null)}>
                  {t("common.cancel")}
                </Button>
              </View>
              <View className="flex-1">
                <Button loading={saveMutation.isPending} onPress={() => saveMutation.mutate()}>
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
