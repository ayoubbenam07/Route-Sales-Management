import React, { useState } from "react";
import { View, Text, Modal, TouchableOpacity, Pressable, Alert } from "react-native";
import { useTranslation } from "node_modules/react-i18next";
import { useNavigation } from "@react-navigation/native";
import { Check, ChevronDown, LogOut, Plus, User as UserIcon } from "lucide-react-native";
import { useAuth } from "@/stores/auth";
import { logout as apiLogout } from "@/api/auth";

export function AccountSwitcher() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { user, accounts, switchAccount, logout, logoutAll } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    setOpen(false);
    try {
      await apiLogout();
    } catch {
      // ignore
    }
    await logout();
  };

  const handleLogoutAll = async () => {
    setOpen(false);
    try {
      await apiLogout();
    } catch {
      // ignore
    }
    await logoutAll();
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        className="mr-2 flex-row items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1.5"
        hitSlop={8}
      >
        <View className="h-6 w-6 items-center justify-center rounded-full bg-blue-100">
          <UserIcon size={14} color="#1d4ed8" />
        </View>
        <Text className="max-w-[90px] text-sm font-semibold text-blue-700" numberOfLines={1}>
          {user.name}
        </Text>
        <ChevronDown size={14} color="#3b82f6" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-black/40" onPress={() => setOpen(false)}>
          <View className="mt-16 mx-4 self-start min-w-[240px] rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
            <Text className="px-3 py-2 text-xs text-slate-500">Comptes connectés</Text>

            {accounts.map((acc) => {
              const isActive = acc.user.id === user.id;
              return (
                <TouchableOpacity
                  key={acc.user.id}
                  className="flex-row items-center justify-between rounded-xl px-3 py-3"
                  onPress={async () => {
                    if (!isActive) {
                      await switchAccount(acc.user.id);
                      Alert.alert("Compte", `Connecté: ${acc.user.name}`);
                    }
                    setOpen(false);
                  }}
                >
                  <View>
                    <Text className="font-medium text-slate-900">{acc.user.name}</Text>
                    <Text className="text-xs text-slate-500">{acc.user.phone}</Text>
                  </View>
                  {isActive ? <Check size={16} color="#4f46e5" /> : null}
                </TouchableOpacity>
              );
            })}

            <View className="my-1 h-px bg-slate-100" />

            <TouchableOpacity
              className="flex-row items-center gap-2 rounded-xl px-3 py-3"
              onPress={() => {
                setOpen(false);
                navigation.navigate("Login", { addAccount: true });
              }}
            >
              <Plus size={16} color="#4f46e5" />
              <Text className="font-medium text-indigo-600">Ajouter un compte</Text>
            </TouchableOpacity>

            <View className="my-1 h-px bg-slate-100" />

            <TouchableOpacity
              className="flex-row items-center gap-2 rounded-xl px-3 py-3"
              onPress={handleLogout}
            >
              <LogOut size={16} color="#e11d48" />
              <Text className="font-medium text-rose-600">
                {t("nav.logout")} {user.name}
              </Text>
            </TouchableOpacity>

            {accounts.length > 1 ? (
              <TouchableOpacity
                className="flex-row items-center gap-2 rounded-xl px-3 py-3"
                onPress={handleLogoutAll}
              >
                <LogOut size={16} color="#e11d48" />
                <Text className="font-medium text-rose-600">Déconnecter tous</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
