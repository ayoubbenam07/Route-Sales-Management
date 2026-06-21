import { n as formatMoney } from "./i18n-C_8wfDly.js";
import { n as StatusPill, t as BentoCard } from "./Bento-Bq0mey4A.js";
import { o as getDeals } from "./api-Bc9u_B1E.js";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-Dg1urBTx.js";
import { useEffect, useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
//#region src/routes/admin.deals.tsx?tsr-split=component
var PAGE = 12;
function DealsPage() {
	const { t, i18n } = useTranslation();
	const [offset, setOffset] = useState(PAGE);
	const [status, setStatus] = useState("ALL");
	const sentinel = useRef(null);
	const { data: allDeals, isLoading } = useQuery({
		queryKey: ["deals", status],
		queryFn: () => getDeals(status)
	});
	const sortedDeals = [...allDeals || []].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
	const items = sortedDeals.slice(0, offset);
	const done = items.length >= sortedDeals.length;
	const fetchNext = () => {
		if (done) return;
		setOffset((prev) => prev + PAGE);
	};
	useEffect(() => {
		const el = sentinel.current;
		if (!el) return;
		const obs = new IntersectionObserver((entries) => {
			if (entries[0].isIntersecting) fetchNext();
		});
		obs.observe(el);
		return () => obs.disconnect();
	}, [offset, done]);
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-6",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex flex-wrap items-end justify-between gap-3",
			children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
				className: "text-2xl font-bold text-foreground",
				children: t("nav.deals")
			}), /* @__PURE__ */ jsx("p", {
				className: "mt-1 text-sm text-muted-foreground",
				children: "Grand livre des transactions."
			})] }), /* @__PURE__ */ jsxs(Select, {
				value: status,
				onValueChange: (v) => setStatus(v),
				children: [/* @__PURE__ */ jsx(SelectTrigger, {
					className: "w-48",
					children: /* @__PURE__ */ jsx(SelectValue, { placeholder: t("common.status") })
				}), /* @__PURE__ */ jsxs(SelectContent, { children: [
					/* @__PURE__ */ jsx(SelectItem, {
						value: "ALL",
						children: "Tous"
					}),
					/* @__PURE__ */ jsx(SelectItem, {
						value: "PAID",
						children: t("common.paid")
					}),
					/* @__PURE__ */ jsx(SelectItem, {
						value: "PARTIAL",
						children: t("common.partial")
					}),
					/* @__PURE__ */ jsx(SelectItem, {
						value: "UNPAID",
						children: t("common.unpaid")
					})
				] })]
			})]
		}), /* @__PURE__ */ jsxs(BentoCard, {
			className: "p-0 overflow-hidden",
			children: [/* @__PURE__ */ jsx("div", {
				className: "overflow-x-auto",
				children: /* @__PURE__ */ jsxs("table", {
					className: "w-full text-sm",
					children: [/* @__PURE__ */ jsx("thead", {
						className: "bg-muted/40",
						children: /* @__PURE__ */ jsxs("tr", {
							className: "text-xs uppercase tracking-wider text-muted-foreground",
							children: [
								/* @__PURE__ */ jsx("th", {
									className: "px-6 py-3 text-start font-medium",
									children: "Référence"
								}),
								/* @__PURE__ */ jsx("th", {
									className: "px-6 py-3 text-start font-medium",
									children: "Supermarché"
								}),
								/* @__PURE__ */ jsx("th", {
									className: "px-6 py-3 text-start font-medium",
									children: "Vendeur"
								}),
								/* @__PURE__ */ jsx("th", {
									className: "px-6 py-3 text-end font-medium",
									children: "Total"
								}),
								/* @__PURE__ */ jsx("th", {
									className: "px-6 py-3 text-end font-medium",
									children: "Payé"
								}),
								/* @__PURE__ */ jsx("th", {
									className: "px-6 py-3 text-end font-medium",
									children: "Restant"
								}),
								/* @__PURE__ */ jsx("th", {
									className: "px-6 py-3 text-end font-medium",
									children: t("common.status")
								}),
								/* @__PURE__ */ jsx("th", {
									className: "px-6 py-3 text-end font-medium",
									children: "Date"
								})
							]
						})
					}), /* @__PURE__ */ jsx("tbody", {
						className: "divide-y divide-border",
						children: /* @__PURE__ */ jsx(AnimatePresence, {
							initial: false,
							children: items.map((d) => {
								const paid = d.paymentSummary?.totalPaid || 0;
								const remaining = d.paymentSummary?.remainingBalance || d.totalAmount;
								return /* @__PURE__ */ jsxs(motion.tr, {
									initial: {
										opacity: 0,
										y: 6
									},
									animate: {
										opacity: 1,
										y: 0
									},
									transition: { duration: .18 },
									className: "hover:bg-muted/40",
									children: [
										/* @__PURE__ */ jsx("td", {
											className: "px-6 py-3 font-mono text-xs text-muted-foreground",
											children: d.id.slice(0, 8)
										}),
										/* @__PURE__ */ jsx("td", {
											className: "px-6 py-3 font-medium",
											children: d.supermarket?.name
										}),
										/* @__PURE__ */ jsx("td", {
											className: "px-6 py-3 text-muted-foreground",
											children: d.buyer?.name
										}),
										/* @__PURE__ */ jsx("td", {
											className: "px-6 py-3 text-end font-semibold",
											children: formatMoney(d.totalAmount, i18n.language)
										}),
										/* @__PURE__ */ jsx("td", {
											className: "px-6 py-3 text-end text-emerald-700",
											children: formatMoney(paid, i18n.language)
										}),
										/* @__PURE__ */ jsx("td", {
											className: "px-6 py-3 text-end text-rose-700",
											children: formatMoney(remaining, i18n.language)
										}),
										/* @__PURE__ */ jsx("td", {
											className: "px-6 py-3 text-end",
											children: /* @__PURE__ */ jsx(StatusPill, { status: d.status })
										}),
										/* @__PURE__ */ jsx("td", {
											className: "px-6 py-3 text-end text-xs text-muted-foreground",
											children: new Date(d.createdAt).toLocaleDateString(i18n.language === "ar" ? "ar-MA" : "fr-FR")
										})
									]
								}, d.id);
							})
						})
					})]
				})
			}), /* @__PURE__ */ jsxs("div", {
				ref: sentinel,
				className: "flex h-12 items-center justify-center text-xs text-muted-foreground",
				children: [isLoading && /* @__PURE__ */ jsx(Loader2, { className: "size-4 animate-spin" }), done && !isLoading && /* @__PURE__ */ jsx("span", { children: "Fin de l'historique" })]
			})]
		})]
	});
}
//#endregion
export { DealsPage as component };
