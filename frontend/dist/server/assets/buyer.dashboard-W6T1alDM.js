import { n as formatMoney } from "./i18n-C_8wfDly.js";
import { t as useAuth } from "./auth-Dgc-H9Jh.js";
import { n as StatusPill, t as BentoCard } from "./Bento-Bq0mey4A.js";
import { a as getBuyerDashboard } from "./api-Bc9u_B1E.js";
import { t as Button } from "./button-Bq5vK6RO.js";
import { Link } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowRight, Plus, TrendingUp, Wallet } from "lucide-react";
//#region src/routes/buyer.dashboard.tsx?tsr-split=component
function BuyerDashboard() {
	const { t, i18n } = useTranslation();
	const user = useAuth((s) => s.user);
	const { data: a, isLoading } = useQuery({
		queryKey: ["buyerDashboard"],
		queryFn: getBuyerDashboard,
		enabled: !!user && user.role === "BUYER"
	});
	if (isLoading) return /* @__PURE__ */ jsx("div", {
		className: "p-8 text-center text-muted-foreground",
		children: "Chargement..."
	});
	if (!a) return null;
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ jsxs(BentoCard, {
				className: "bg-gradient-to-br from-brand to-blue-700 text-white",
				children: [
					/* @__PURE__ */ jsx("div", {
						className: "text-xs uppercase tracking-wider text-white/70",
						children: t("common.salesThisMonth")
					}),
					/* @__PURE__ */ jsx("div", {
						className: "mt-2 text-4xl font-bold",
						children: formatMoney(a.totalSalesThisMonth, i18n.language)
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mt-4 flex items-center justify-between border-t border-white/20 pt-4 text-sm",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ jsx(TrendingUp, { className: "size-4" }), "Performance"]
						}), /* @__PURE__ */ jsx("span", {
							className: "text-white/90",
							children: "+8.2%"
						})]
					})
				]
			}),
			/* @__PURE__ */ jsxs(BentoCard, {
				title: t("common.debtToCollect"),
				icon: /* @__PURE__ */ jsx(Wallet, { className: "size-4" }),
				children: [/* @__PURE__ */ jsx("div", {
					className: "text-3xl font-bold text-foreground",
					children: formatMoney(a.totalDebtResponsible, i18n.language)
				}), /* @__PURE__ */ jsx("div", {
					className: "mt-2 text-xs text-muted-foreground",
					children: "À recouvrer auprès des clients"
				})]
			}),
			/* @__PURE__ */ jsx(Link, {
				to: "/buyer/deals/new",
				children: /* @__PURE__ */ jsxs(Button, {
					size: "lg",
					className: "w-full h-14 text-base rounded-2xl",
					children: [/* @__PURE__ */ jsx(Plus, { className: "size-5 me-2" }), t("common.newDeal")]
				})
			}),
			/* @__PURE__ */ jsx(BentoCard, {
				title: "Dernières ventes",
				children: /* @__PURE__ */ jsx("div", {
					className: "space-y-3",
					children: (a.recentDeals || []).map((d) => /* @__PURE__ */ jsxs("div", {
						className: "flex items-center justify-between rounded-xl border border-border p-3",
						children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
							className: "text-sm font-medium text-foreground",
							children: d.supermarket?.name
						}), /* @__PURE__ */ jsx("div", {
							className: "text-xs text-muted-foreground",
							children: new Date(d.createdAt).toLocaleDateString()
						})] }), /* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "text-end",
								children: [/* @__PURE__ */ jsx("div", {
									className: "text-sm font-semibold",
									children: formatMoney(d.totalAmount, i18n.language)
								}), /* @__PURE__ */ jsx(StatusPill, { status: d.status })]
							}), /* @__PURE__ */ jsx(ArrowRight, { className: "size-4 text-muted-foreground rtl:rotate-180" })]
						})]
					}, d.id))
				})
			})
		]
	});
}
//#endregion
export { BuyerDashboard as component };
