import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "node_modules/react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { fetchDeals } from "@/api/deals";
import { queryKeys } from "@/api/queryKeys";
import type { Deal, DealStatus } from "@/lib/types";
import { formatMoney } from "@/lib/i18n";
import { StatusPill } from "@/components/Bento";
import { cn } from "@/lib/utils";

export function DealsScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [statusFilter, setStatusFilter] = useState<DealStatus | "ALL">("ALL");

  const { data: allDeals, isLoading, refetch, isRefetching } = useQuery({
    queryKey: queryKeys.deals(),
    queryFn: () => fetchDeals(),
  });

  const filteredDeals = useMemo(() => {
    if (!allDeals) return [];
    if (statusFilter === "ALL") return allDeals;
    return allDeals.filter((d) => d.status === statusFilter);
  }, [allDeals, statusFilter]);

  const filters: Array<{ key: DealStatus | "ALL"; label: string }> = [
    { key: "ALL", label: i18n.language?.startsWith("ar") ? "الكل" : "Tout" },
    { key: "PAID", label: i18n.language?.startsWith("ar") ? "مدفوع" : "Payé" },
    { key: "PARTIAL", label: i18n.language?.startsWith("ar") ? "جزئي" : "Partiel" },
    { key: "UNPAID", label: i18n.language?.startsWith("ar") ? "غير مدفوع" : "Impayé" },
  ];

  return (
    <View className="flex-1 bg-slate-50">
      <View className="px-4 pt-4">
        <Text className="text-xl font-bold text-slate-900">{t("nav.myDeals")}</Text>
        <Text className="mt-1 text-xs text-slate-500">Historique de vos ventes</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4 mb-2">
          {filters.map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setStatusFilter(f.key)}
              className={cn(
                "mr-2 rounded-full px-4 py-2",
                statusFilter === f.key ? "bg-indigo-600" : "bg-slate-200",
              )}
            >
              <Text
                className={cn(
                  "text-sm font-medium",
                  statusFilter === f.key ? "text-white" : "text-slate-700",
                )}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <FlatList
          data={filteredDeals}
          keyExtractor={(item) => item.id}
          refreshing={isRefetching}
          onRefresh={refetch}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 12 }}
          ListEmptyComponent={
            <Text className="mt-8 text-center text-slate-500">Aucune vente</Text>
          }
          renderItem={({ item }: { item: Deal }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate("DealDetail", { dealId: item.id })}
              className="rounded-2xl border border-slate-200 bg-white p-4"
              activeOpacity={0.7}
            >
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-slate-900">
                    {item.supermarketName}
                  </Text>
                  <Text className="mt-0.5 font-mono text-xs text-slate-500">
                    {item.reference}
                  </Text>
                  <Text className="mt-1 text-xs text-slate-500">
                    {new Date(item.createdAt).toLocaleDateString(
                      i18n.language?.startsWith("ar") ? "ar-MA" : "fr-FR",
                    )}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-base font-bold text-slate-900">
                    {formatMoney(item.total, i18n.language)}
                  </Text>
                  <View className="mt-1">
                    <StatusPill status={item.status} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
