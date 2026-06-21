import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getAdminDashboard, createBuyer } from "@/lib/api";
import { formatMoney } from "@/lib/i18n";
import { BentoCard } from "@/components/Bento";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UserPlus, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const schema = z.object({
  name: z.string().min(2),
  phone: z.string().min(6),
  password: z.string().min(6, "6 caractères minimum"),
});
type FormVals = z.infer<typeof schema>;

export const Route = createFileRoute("/admin/team")({
  component: TeamPage,
});

function TeamPage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["adminDashboard"],
    queryFn: getAdminDashboard,
  });

  const mutation = useMutation({
    mutationFn: createBuyer,
    onSuccess: () => {
      toast.success("Vendeur ajouté");
      queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
      form.reset();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erreur lors de la création");
    },
  });

  const form = useForm<FormVals>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", password: "" },
  });

  const onSubmit = (data: FormVals) => {
    mutation.mutate(data);
  };

  const buyers = analytics?.topPerformingBuyers || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("nav.team")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Gestion de l'équipe terrain.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <BentoCard className="lg:col-span-2">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Chargement...</div>
          ) : (
            <div className="space-y-3">
              {buyers.map((b) => (
                <div key={b.buyerId} className="flex items-center justify-between rounded-xl border border-border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand">
                      {b.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">{b.name}</div>
                      <div className="text-xs text-muted-foreground">{b.phone}</div>
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="text-sm font-semibold">{formatMoney(b.totalSales, i18n.language)}</div>
                    <div className="text-xs text-muted-foreground">Ventes: {b.dealsCount}</div>
                  </div>
                </div>
              ))}
              {buyers.length === 0 && (
                <div className="p-4 text-center text-muted-foreground">Aucun vendeur trouvé.</div>
              )}
            </div>
          )}
        </BentoCard>

        <BentoCard title={t("common.createBuyer")} icon={<UserPlus className="size-4" />}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-2">
              <Label>{t("common.name")}</Label>
              <Input {...form.register("name")} />
              {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>{t("common.phone")}</Label>
              <Input {...form.register("phone")} />
              {form.formState.errors.phone && <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>{t("auth.password")}</Label>
              <Input type="password" {...form.register("password")} />
              {form.formState.errors.password && <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>}
            </div>
            <Button type="submit" disabled={mutation.isPending} className="w-full">
              {mutation.isPending && <Loader2 className="me-2 size-4 animate-spin" />}
              {t("common.add")}
            </Button>
          </form>
        </BentoCard>
      </div>
    </div>
  );
}
