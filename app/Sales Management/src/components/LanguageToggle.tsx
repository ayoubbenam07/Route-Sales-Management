import React from "react";
import { TouchableOpacity, Text } from "react-native";
import { useTranslation } from "node_modules/react-i18next";
import { applyLocale } from "@/lib/i18n";

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const lang = (i18n.language || "fr").startsWith("ar") ? "ar" : "fr";
  const next = lang === "ar" ? "fr" : "ar";

  return (
    <TouchableOpacity
      onPress={() => {
        void applyLocale(next);
      }}
      className="rounded-full border border-slate-200 bg-white px-3 py-2"
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityRole="button"
      accessibilityLabel="Change language"
    >
      <Text className="text-xs font-bold text-slate-800">{lang === "ar" ? "FR" : "عر"}</Text>
    </TouchableOpacity>
  );
}
