import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getProducts, createProduct } from "@/lib/api";
import { formatMoney } from "@/lib/i18n";
import { BentoCard } from "@/components/Bento";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const schema = z.object({
  name: z.string().min(2, "Nom requis"),
  basePrice: z.coerce.number().min(0, "Prix invalide"),
  stockQty: z.coerce.number().int().min(0, "Stock invalide"),
});
type FormVals = z.infer<typeof schema>;

export const Route = createFileRoute("/admin/products")({
  component: ProductsPage,
});

function ProductsPage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  const mutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      toast.success("Produit créé");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      form.reset();
      setOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erreur de création");
    },
  });

  const form = useForm<FormVals>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", basePrice: 0, stockQty: 0 },
  });

  const onSubmit = (data: FormVals) => {
    mutation.mutate(data);
  };

  const filtered = items.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("nav.products")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Catalogue d'inventaire.</p>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button>
              <Plus className="size-4 me-2" /> {t("common.createProduct")}
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-md">
            <SheetHeader>
              <SheetTitle>{t("common.createProduct")}</SheetTitle>
            </SheetHeader>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="mt-6 space-y-4 px-4"
            >
              <div className="space-y-2">
                <Label>{t("common.name")}</Label>
                <Input {...form.register("name")} placeholder="Lait Centrale 1L" />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{t("common.basePrice")}</Label>
                  <Input type="number" step="0.01" {...form.register("basePrice")} />
                </div>
                <div className="space-y-2">
                  <Label>{t("common.stock")}</Label>
                  <Input type="number" {...form.register("stockQty")} />
                </div>
              </div>
              <SheetFooter className="mt-6">
                <Button type="submit" disabled={mutation.isPending} className="w-full">
                  {mutation.isPending && <Loader2 className="me-2 size-4 animate-spin" />}
                  {t("common.save")}
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <BentoCard>
        <div className="mb-4 flex items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("common.search")}
              className="ps-9"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                <th className="pb-3 text-start font-medium">{t("common.name")}</th>
                <th className="pb-3 text-end font-medium">{t("common.basePrice")}</th>
                <th className="pb-3 text-end font-medium">{t("common.stock")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-muted-foreground">
                    Chargement...
                  </td>
                </tr>
              )}
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-muted/40">
                  <td className="py-3 font-medium">{p.name}</td>
                  <td className="py-3 text-end">{formatMoney(p.basePrice, i18n.language)}</td>
                  <td className="py-3 text-end text-muted-foreground">{p.stockQty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </BentoCard>
    </div>
  );
}
