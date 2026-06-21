import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n, { applyLocale } from "@/lib/i18n";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LanguageToggle({ className }: { className?: string }) {
  const { i18n: i } = useTranslation();
  const [lang, setLang] = useState<"fr" | "ar">((i.language as "fr" | "ar") || "fr");

  useEffect(() => {
    applyLocale(lang);
  }, [lang]);

  const toggle = () => {
    const next = lang === "fr" ? "ar" : "fr";
    setLang(next);
    i18n.changeLanguage(next);
    applyLocale(next);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={toggle}
      className={className}
    >
      <Languages className="size-4" />
      <span className="ms-2 text-xs font-medium uppercase tracking-wider">
        {lang === "fr" ? "FR" : "AR"}
      </span>
    </Button>
  );
}
