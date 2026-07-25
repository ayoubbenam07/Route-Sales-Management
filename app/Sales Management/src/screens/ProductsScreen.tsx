import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Modal,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useTranslation } from "node_modules/react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Infinity } from "lucide-react-native";
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/api/products";
import { queryKeys } from "@/api/queryKeys";
import { formatMoney } from "@/lib/i18n";
import type { Product } from "@/lib/types";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";

const INFINITE_STOCK = 999_999_999;
const isInfinite = (n: number) => n < 0 || n >= INFINITE_STOCK;

export function ProductsScreen() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState<"create" | Product | null>(null);
  const [name, setName] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [stock, setStock] = useState("");
  const [infiniteStock, setInfiniteStock] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: queryKeys.products,
    queryFn: fetchProducts,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, search]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = {
        name: name.trim(),
        basePrice: Number(basePrice) || 0,
        stockQty: infiniteStock ? INFINITE_STOCK : Number(stock) || 0,
      };
      if (formOpen === "create") return createProduct(body);
      if (formOpen && typeof formOpen === "object") return updateProduct(formOpen.id, body);
      throw new Error("Invalid form");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
      setFormOpen(null);
      Alert.alert("Succès", formOpen === "create" ? "Produit créé" : "Produit mis à jour");
    },
    onError: (err: Error) => Alert.alert("Erreur", err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
      Alert.alert("Succès", "Produit supprimé");
    },
    onError: (err: Error) => Alert.alert("Erreur", err.message),
  });

  const openCreate = () => {
    setName("");
    setBasePrice("");
    setStock("");
    setInfiniteStock(false);
    setFormOpen("create");
  };

  const openEdit = (p: Product) => {
    setName(p.name);
    setBasePrice(String(p.basePrice));
    setInfiniteStock(isInfinite(p.stock));
    setStock(isInfinite(p.stock) ? "" : String(p.stock));
    setFormOpen(p);
  };

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center justify-between px-4 pt-4">
        <View>
          <Text className="text-xl font-bold text-slate-900">{t("nav.products")}</Text>
          <Text className="mt-1 text-xs text-slate-500">{products.length} produits</Text>
        </View>
        <Button size="sm" onPress={openCreate}>
          <Plus size={16} color="#fff" />
          <Text className="font-semibold text-white">{t("common.add")}</Text>
        </Button>
      </View>

      <View className="px-4 pt-3">
        <Input
          placeholder={t("common.search")}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 py-4 gap-3"
          renderItem={({ item }) => (
            <View className="flex-row items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
              <View className="flex-1">
                <Text className="text-base font-semibold text-slate-900">{item.name}</Text>
                <Text className="mt-1 text-sm text-slate-500">
                  {formatMoney(item.basePrice, i18n.language)}
                </Text>
                <View className="mt-1 flex-row items-center gap-1">
                  <Text className="text-xs text-slate-500">{t("common.stock")}:</Text>
                  {isInfinite(item.stock) ? (
                    <Infinity size={14} color="#4f46e5" />
                  ) : (
                    <Text
                      className={`text-xs font-semibold ${item.stock <= 10 ? "text-amber-500" : "text-slate-600"
                        }`}
                    >
                      {item.stock}
                    </Text>
                  )}
                </View>
              </View>
              <View className="flex-row gap-2">
                <TouchableOpacity onPress={() => openEdit(item)} className="rounded-lg bg-slate-100 p-2">
                  <Pencil size={16} color="#475569" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert("Supprimer", `Supprimer ${item.name} ?`, [
                      { text: t("common.cancel"), style: "cancel" },
                      {
                        text: "Supprimer",
                        style: "destructive",
                        onPress: () => deleteMutation.mutate(item.id),
                      },
                    ])
                  }
                  className="rounded-lg bg-rose-50 p-2"
                >
                  <Trash2 size={16} color="#e11d48" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={!!formOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="gap-4 rounded-t-3xl bg-white p-5">
            <Text className="text-lg font-bold text-slate-900">
              {formOpen === "create" ? t("common.createProduct") : "Modifier le produit"}
            </Text>
            <Input label={t("common.name")} value={name} onChangeText={setName} />
            <Input
              label={t("common.basePrice")}
              value={basePrice}
              onChangeText={setBasePrice}
              keyboardType="decimal-pad"
            />
            <TouchableOpacity
              onPress={() => setInfiniteStock((v) => !v)}
              className="flex-row items-center gap-2"
            >
              <View
                className={`h-5 w-5 rounded border ${infiniteStock ? "border-indigo-600 bg-indigo-600" : "border-slate-300"
                  }`}
              />
              <Text className="text-sm text-slate-700">Stock illimité</Text>
            </TouchableOpacity>
            {!infiniteStock ? (
              <Input
                label={t("common.stock")}
                value={stock}
                onChangeText={setStock}
                keyboardType="number-pad"
              />
            ) : null}
            <View className="flex-row gap-2">
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
        </View>
      </Modal>
    </View>
  );
}
