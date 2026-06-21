import { n as formatMoney } from "./i18n-C_8wfDly.js";
import { t as BentoCard } from "./Bento-Bq0mey4A.js";
import { i as getAdminDashboard, t as createBuyer } from "./api-Bc9u_B1E.js";
import { t as Button } from "./button-Bq5vK6RO.js";
import { n as Input, t as Label } from "./label-B7oQAA24.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
//#region src/routes/admin.team.tsx?tsr-split=component
var schema = z.object({
	name: z.string().min(2),
	phone: z.string().min(6),
	password: z.string().min(6, "6 caractères minimum")
});
function TeamPage() {
	const { t, i18n } = useTranslation();
	const queryClient = useQueryClient();
	const { data: analytics, isLoading } = useQuery({
		queryKey: ["adminDashboard"],
		queryFn: getAdminDashboard
	});
	const mutation = useMutation({
		mutationFn: createBuyer,
		onSuccess: () => {
			toast.success("Vendeur ajouté");
			queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
			form.reset();
		},
		onError: (err) => {
			toast.error(err.response?.data?.message || "Erreur lors de la création");
		}
	});
	const form = useForm({
		resolver: zodResolver(schema),
		defaultValues: {
			name: "",
			phone: "",
			password: ""
		}
	});
	const onSubmit = (data) => {
		mutation.mutate(data);
	};
	const buyers = analytics?.topPerformingBuyers || [];
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-6",
		children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
			className: "text-2xl font-bold text-foreground",
			children: t("nav.team")
		}), /* @__PURE__ */ jsx("p", {
			className: "mt-1 text-sm text-muted-foreground",
			children: "Gestion de l'équipe terrain."
		})] }), /* @__PURE__ */ jsxs("div", {
			className: "grid grid-cols-1 gap-4 lg:grid-cols-3",
			children: [/* @__PURE__ */ jsx(BentoCard, {
				className: "lg:col-span-2",
				children: isLoading ? /* @__PURE__ */ jsx("div", {
					className: "p-8 text-center text-muted-foreground",
					children: "Chargement..."
				}) : /* @__PURE__ */ jsxs("div", {
					className: "space-y-3",
					children: [buyers.map((b) => /* @__PURE__ */ jsxs("div", {
						className: "flex items-center justify-between rounded-xl border border-border p-4",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ jsx("div", {
								className: "flex size-10 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand",
								children: b.name.split(" ").map((p) => p[0]).join("").slice(0, 2)
							}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
								className: "text-sm font-semibold text-foreground",
								children: b.name
							}), /* @__PURE__ */ jsx("div", {
								className: "text-xs text-muted-foreground",
								children: b.phone
							})] })]
						}), /* @__PURE__ */ jsxs("div", {
							className: "text-end",
							children: [/* @__PURE__ */ jsx("div", {
								className: "text-sm font-semibold",
								children: formatMoney(b.totalSales, i18n.language)
							}), /* @__PURE__ */ jsxs("div", {
								className: "text-xs text-muted-foreground",
								children: ["Ventes: ", b.dealsCount]
							})]
						})]
					}, b.buyerId)), buyers.length === 0 && /* @__PURE__ */ jsx("div", {
						className: "p-4 text-center text-muted-foreground",
						children: "Aucun vendeur trouvé."
					})]
				})
			}), /* @__PURE__ */ jsx(BentoCard, {
				title: t("common.createBuyer"),
				icon: /* @__PURE__ */ jsx(UserPlus, { className: "size-4" }),
				children: /* @__PURE__ */ jsxs("form", {
					onSubmit: form.handleSubmit(onSubmit),
					className: "space-y-3",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "space-y-2",
							children: [
								/* @__PURE__ */ jsx(Label, { children: t("common.name") }),
								/* @__PURE__ */ jsx(Input, { ...form.register("name") }),
								form.formState.errors.name && /* @__PURE__ */ jsx("p", {
									className: "text-xs text-destructive",
									children: form.formState.errors.name.message
								})
							]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "space-y-2",
							children: [
								/* @__PURE__ */ jsx(Label, { children: t("common.phone") }),
								/* @__PURE__ */ jsx(Input, { ...form.register("phone") }),
								form.formState.errors.phone && /* @__PURE__ */ jsx("p", {
									className: "text-xs text-destructive",
									children: form.formState.errors.phone.message
								})
							]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "space-y-2",
							children: [
								/* @__PURE__ */ jsx(Label, { children: t("auth.password") }),
								/* @__PURE__ */ jsx(Input, {
									type: "password",
									...form.register("password")
								}),
								form.formState.errors.password && /* @__PURE__ */ jsx("p", {
									className: "text-xs text-destructive",
									children: form.formState.errors.password.message
								})
							]
						}),
						/* @__PURE__ */ jsxs(Button, {
							type: "submit",
							disabled: mutation.isPending,
							className: "w-full",
							children: [mutation.isPending && /* @__PURE__ */ jsx(Loader2, { className: "me-2 size-4 animate-spin" }), t("common.add")]
						})
					]
				})
			})]
		})]
	});
}
//#endregion
export { TeamPage as component };
