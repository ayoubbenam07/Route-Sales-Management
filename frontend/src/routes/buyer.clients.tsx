import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { getSupermarkets } from "@/lib/api";
import { formatMoney } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, Plus, HandCoins, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/buyer/clients")({
  component: BuyerClients,
});

function BuyerClients() {
  const { t, i18n } = useTranslation();

  const { data: supermarkets = [], isLoading } = useQuery({
    queryKey: ["supermarkets"],
    queryFn: getSupermarkets,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">{t("nav.clients")}</h1>
        <p className="mt-1 text-xs text-muted-foreground">{supermarkets.length} clients sur votre tournée</p>
      </div>

      {isLoading && (
        <div className="flex justify-center p-8 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      )}

      <div className="space-y-3">
        {supermarkets.map((s) => (
          <div key={s.id} className="surface-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-foreground">{s.name}</h3>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2"><Phone className="size-3.5" />{s.phone}</div>
                  <div className="flex items-center gap-2"><MapPin className="size-3.5" />{s.address}</div>
                </div>
              </div>
              <div
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                  s.totalDebt === 0
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    : "bg-blue-50 text-blue-700 ring-blue-200",
                )}
              >
                {formatMoney(s.totalDebt, i18n.language)}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link to="/buyer/deals/new" search={{ supermarketId: s.id }} className="contents">
                <Button className="w-full"><Plus className="size-4 me-2" />{t("common.newDeal")}</Button>
              </Link>
              <Button
                variant="outline"
                disabled={s.totalDebt === 0}
                onClick={() => toast.success(`Paiement enregistré pour ${s.name}`)}
              >
                <HandCoins className="size-4 me-2" />{t("common.collect")}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
