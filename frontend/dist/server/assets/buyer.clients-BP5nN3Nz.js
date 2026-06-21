import { n as formatMoney } from "./i18n-C_8wfDly.js";
import { t as cn } from "./utils-C_uf36nf.js";
import { c as getSupermarkets } from "./api-Bc9u_B1E.js";
import { t as Button } from "./button-Bq5vK6RO.js";
import { Link } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { HandCoins, Loader2, MapPin, Phone, Plus } from "lucide-react";
//#region src/routes/buyer.clients.tsx?tsr-split=component
function BuyerClients() {
	const { t, i18n } = useTranslation();
	const { data: supermarkets = [], isLoading } = useQuery({
		queryKey: ["supermarkets"],
		queryFn: getSupermarkets
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
				className: "text-xl font-bold text-foreground",
				children: t("nav.clients")
			}), /* @__PURE__ */ jsxs("p", {
				className: "mt-1 text-xs text-muted-foreground",
				children: [supermarkets.length, " clients sur votre tournée"]
			})] }),
			isLoading && /* @__PURE__ */ jsx("div", {
				className: "flex justify-center p-8 text-muted-foreground",
				children: /* @__PURE__ */ jsx(Loader2, { className: "size-6 animate-spin" })
			}),
			/* @__PURE__ */ jsx("div", {
				className: "space-y-3",
				children: supermarkets.map((s) => /* @__PURE__ */ jsxs("div", {
					className: "surface-card p-5",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-start justify-between gap-3",
						children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", {
							className: "text-base font-semibold text-foreground",
							children: s.name
						}), /* @__PURE__ */ jsxs("div", {
							className: "mt-2 space-y-1 text-xs text-muted-foreground",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ jsx(Phone, { className: "size-3.5" }), s.phone]
							}), /* @__PURE__ */ jsxs("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ jsx(MapPin, { className: "size-3.5" }), s.address]
							})]
						})] }), /* @__PURE__ */ jsx("div", {
							className: cn("rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", s.totalDebt === 0 ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-blue-50 text-blue-700 ring-blue-200"),
							children: formatMoney(s.totalDebt, i18n.language)
						})]
					}), /* @__PURE__ */ jsxs("div", {
						className: "mt-4 grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ jsx(Link, {
							to: "/buyer/deals/new",
							search: { supermarketId: s.id },
							className: "contents",
							children: /* @__PURE__ */ jsxs(Button, {
								className: "w-full",
								children: [/* @__PURE__ */ jsx(Plus, { className: "size-4 me-2" }), t("common.newDeal")]
							})
						}), /* @__PURE__ */ jsxs(Button, {
							variant: "outline",
							disabled: s.totalDebt === 0,
							onClick: () => toast.success(`Paiement enregistré pour ${s.name}`),
							children: [/* @__PURE__ */ jsx(HandCoins, { className: "size-4 me-2" }), t("common.collect")]
						})]
					})]
				}, s.id))
			})
		]
	});
}
//#endregion
export { BuyerClients as component };
