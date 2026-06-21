import { ReactNode, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";
import { applyLocale } from "@/lib/i18n";
import { useAuth } from "@/stores/auth";

export function I18nBoot({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const hydrate = useAuth((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  useEffect(() => {
    applyLocale((i18n.language as "fr" | "ar") || "fr");
  }, [i18n.language]);
  return <>{children}</>;
}

