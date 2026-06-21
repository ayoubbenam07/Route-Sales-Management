import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { getSupermarkets } from "@/lib/api";
import { formatMoney } from "@/lib/i18n";
import { BentoCard } from "@/components/Bento";
import { Phone, MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/admin/supermarkets")({
  component: SupermarketsPage,
});

function SupermarketsPage() {
  const { t, i18n } = useTranslation();

  const { data: supermarkets = [], isLoading } = useQuery({
    queryKey: ["supermarkets"],
    queryFn: getSupermarkets,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("nav.supermarkets")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Annuaire des points de vente.</p>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center p-8 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {supermarkets.map((s) => (
            <BentoCard key={s.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-foreground">{s.name}</h3>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2"><Phone className="size-3.5" />{s.phone}</div>
                    <div className="flex items-center gap-2"><MapPin className="size-3.5" />{s.address}</div>
                  </div>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                    s.totalDebt === 0
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                      : s.totalDebt > 3000
                      ? "bg-rose-50 text-rose-700 ring-rose-200"
                      : "bg-blue-50 text-blue-700 ring-blue-200",
                  )}
                >
                  {formatMoney(s.totalDebt, i18n.language)}
                </span>
              </div>
              <div className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
                {t("common.debt")} — {s.totalDebt === 0 ? "À jour" : "En cours"}
              </div>
            </BentoCard>
          ))}
        </div>
      )}
    </div>
  );
}
