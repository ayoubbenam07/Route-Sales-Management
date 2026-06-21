import { n as formatMoney } from "./i18n-C_8wfDly.js";
import { t as cn } from "./utils-C_uf36nf.js";
import { t as BentoCard } from "./Bento-Bq0mey4A.js";
import { c as getSupermarkets } from "./api-Bc9u_B1E.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Loader2, MapPin, Phone } from "lucide-react";
//#region src/routes/admin.supermarkets.tsx?tsr-split=component
function SupermarketsPage() {
	const { t, i18n } = useTranslation();
	const { data: supermarkets = [], isLoading } = useQuery({
		queryKey: ["supermarkets"],
		queryFn: getSupermarkets
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-6",
		children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
			className: "text-2xl font-bold text-foreground",
			children: t("nav.supermarkets")
		}), /* @__PURE__ */ jsx("p", {
			className: "mt-1 text-sm text-muted-foreground",
			children: "Annuaire des points de vente."
		})] }), isLoading ? /* @__PURE__ */ jsx("div", {
			className: "flex justify-center p-8 text-muted-foreground",
			children: /* @__PURE__ */ jsx(Loader2, { className: "size-6 animate-spin" })
		}) : /* @__PURE__ */ jsx("div", {
			className: "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3",
			children: supermarkets.map((s) => /* @__PURE__ */ jsxs(BentoCard, { children: [/* @__PURE__ */ jsxs("div", {
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
				})] }), /* @__PURE__ */ jsx("span", {
					className: cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", s.totalDebt === 0 ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : s.totalDebt > 3e3 ? "bg-rose-50 text-rose-700 ring-rose-200" : "bg-blue-50 text-blue-700 ring-blue-200"),
					children: formatMoney(s.totalDebt, i18n.language)
				})]
			}), /* @__PURE__ */ jsxs("div", {
				className: "mt-6 border-t border-border pt-4 text-xs text-muted-foreground",
				children: [
					t("common.debt"),
					" — ",
					s.totalDebt === 0 ? "À jour" : "En cours"
				]
			})] }, s.id))
		})]
	});
}
//#endregion
export { SupermarketsPage as component };
