import React, { useState } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useTranslation } from "node_modules/react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { login as apiLogin } from "@/api/auth";
import { useAuth, type Role } from "@/stores/auth";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { LanguageToggle } from "@/components/LanguageToggle";

export function LoginScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const addAccount = Boolean(route.params?.addAccount);
  const login = useAuth((s) => s.login);
  const user = useAuth((s) => s.user);

  const role: Role = "BUYER";
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (phone.trim().length < 6 || password.length < 6) {
      Alert.alert("Erreur", "Téléphone et mot de passe requis (min 6 caractères)");
      return;
    }
    setSubmitting(true);
    try {
      const loggedIn = await apiLogin(phone.trim(), password);
      if (loggedIn.role !== role) {
        Alert.alert(
          "Info",
          loggedIn.role === "ADMIN"
            ? "Connexion en tant qu'administrateur"
            : "Connexion en tant que vendeur",
        );
      }
      await login(loggedIn);
      if (addAccount && navigation.canGoBack()) {
        navigation.goBack();
      }
    } catch (err) {
      Alert.alert("Échec", err instanceof Error ? err.message : "Échec de connexion");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-4 flex-row items-center justify-between">
            {addAccount && user ? (
              <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
                <Text className="font-semibold text-indigo-600">Annuler</Text>
              </TouchableOpacity>
            ) : (
              <View />
            )}
            <LanguageToggle />
          </View>

          <View className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
            <View className="mb-6 items-center">
              <View className="mb-4 h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600">
                <Text className="text-lg font-bold text-white">R</Text>
              </View>
              <Text className="text-2xl font-bold text-slate-900">{t("brand")}</Text>
              <Text className="mt-1 text-center text-sm text-slate-500">
                {addAccount ? "Ajouter un compte vendeur" : t("auth.subtitle")}
              </Text>
            </View>

            <View className="gap-4">
              <Input
                label={t("auth.phone")}
                placeholder="0612-345-678"
                keyboardType="phone-pad"
                autoCapitalize="none"
                value={phone}
                onChangeText={setPhone}
              />
              <Input
                label={t("auth.password")}
                placeholder="••••••"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              <Button onPress={onSubmit} loading={submitting} size="lg">
                {addAccount ? "Ajouter le compte" : t("auth.signIn")}
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
