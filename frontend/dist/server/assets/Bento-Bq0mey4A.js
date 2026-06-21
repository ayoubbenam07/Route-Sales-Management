import { t as cn } from "./utils-C_uf36nf.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/Bento.tsx
function BentoCard({ className, children, title, subtitle, icon }) {
	return /* @__PURE__ */ jsxs("div", {
		className: cn("surface-card p-6 transition-shadow hover:shadow-md", className),
		children: [(title || icon) && /* @__PURE__ */ jsxs("div", {
			className: "mb-4 flex items-start justify-between gap-3",
			children: [/* @__PURE__ */ jsxs("div", { children: [title && /* @__PURE__ */ jsx("div", {
				className: "text-sm font-medium text-muted-foreground",
				children: title
			}), subtitle && /* @__PURE__ */ jsx("div", {
				className: "mt-1 text-xs text-muted-foreground/80",
				children: subtitle
			})] }), icon && /* @__PURE__ */ jsx("div", {
				className: "flex size-9 items-center justify-center rounded-xl bg-brand-soft text-brand",
				children: icon
			})]
		}), children]
	});
}
function StatusPill({ status }) {
	return /* @__PURE__ */ jsx("span", {
		className: cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", {
			PAID: "bg-emerald-50 text-emerald-700 ring-emerald-200",
			PARTIAL: "bg-blue-50 text-blue-700 ring-blue-200",
			UNPAID: "bg-rose-50 text-rose-700 ring-rose-200"
		}[status]),
		children: {
			PAID: "Payé",
			PARTIAL: "Partiel",
			UNPAID: "Impayé"
		}[status]
	});
}
//#endregion
export { StatusPill as n, BentoCard as t };
