import { n as formatMoney } from "./i18n-C_8wfDly.js";
import { n as StatusPill, t as BentoCard } from "./Bento-Bq0mey4A.js";
import { i as getAdminDashboard, o as getDeals } from "./api-Bc9u_B1E.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, Receipt, TrendingUp, Wallet } from "lucide-react";
import { motion } from "framer-motion";
//#region src/routes/admin.dashboard.tsx?tsr-split=component
function AdminDashboard() {
	const { t, i18n } = useTranslation();
	const { data: analytics, isLoading: analyticsLoading } = useQuery({
		queryKey: ["adminDashboard"],
		queryFn: getAdminDashboard
	});
	const { data: deals, isLoading: dealsLoading } = useQuery({
		queryKey: ["deals"],
		queryFn: () => getDeals()
	});
	if (analyticsLoading || dealsLoading) return /* @__PURE__ */ jsx("div", {
		className: "p-8 text-center text-muted-foreground",
		children: "Chargement..."
	});
	const recent = [...deals || []].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6);
	const salesTrend = Array.from({ length: 14 }, (_, i) => {
		const d = /* @__PURE__ */ new Date();
		d.setDate(d.getDate() - (13 - i));
		d.setHours(0, 0, 0, 0);
		const dayEnd = new Date(d);
		dayEnd.setDate(dayEnd.getDate() + 1);
		const daySales = (deals || []).filter((deal) => {
			const dealDate = new Date(deal.createdAt);
			return dealDate >= d && dealDate < dayEnd;
		}).reduce((sum, deal) => sum + deal.totalAmount, 0);
		return {
			day: d.toLocaleDateString("fr-FR", {
				day: "2-digit",
				month: "short"
			}),
			sales: daySales
		};
	});
	return /* @__PURE__ */ jsxs(motion.div, {
		initial: {
			opacity: 0,
			y: 8
		},
		animate: {
			opacity: 1,
			y: 0
		},
		transition: { duration: .3 },
		className: "space-y-6",
		children: [
			/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
				className: "text-2xl font-bold text-foreground",
				children: t("nav.dashboard")
			}), /* @__PURE__ */ jsx("p", {
				className: "mt-1 text-sm text-muted-foreground",
				children: "Vue d'ensemble de l'activité commerciale."
			})] }),
			/* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4",
				children: [
					/* @__PURE__ */ jsx(BentoCard, {
						title: t("common.revenue"),
						icon: /* @__PURE__ */ jsx(TrendingUp, { className: "size-4" }),
						children: /* @__PURE__ */ jsx("div", {
							className: "text-3xl font-bold text-foreground",
							children: formatMoney(analytics?.totalSalesRevenue || 0, i18n.language)
						})
					}),
					/* @__PURE__ */ jsxs(BentoCard, {
						title: t("common.outstandingDebt"),
						icon: /* @__PURE__ */ jsx(Wallet, { className: "size-4" }),
						children: [/* @__PURE__ */ jsx("div", {
							className: "text-3xl font-bold text-foreground",
							children: formatMoney(analytics?.totalGlobalOutstandingMarketDebt || 0, i18n.language)
						}), /* @__PURE__ */ jsxs("div", {
							className: "mt-2 text-xs text-muted-foreground",
							children: [
								"Sur ",
								deals?.length || 0,
								" ventes"
							]
						})]
					}),
					/* @__PURE__ */ jsxs(BentoCard, {
						title: "Ventes totales",
						icon: /* @__PURE__ */ jsx(Receipt, { className: "size-4" }),
						children: [/* @__PURE__ */ jsx("div", {
							className: "text-3xl font-bold text-foreground",
							children: deals?.length || 0
						}), /* @__PURE__ */ jsx("div", {
							className: "mt-2 text-xs text-muted-foreground",
							children: "Toutes périodes confondues"
						})]
					}),
					/* @__PURE__ */ jsxs(BentoCard, {
						title: "Alerte Stock",
						icon: /* @__PURE__ */ jsx(AlertTriangle, { className: "size-4" }),
						children: [/* @__PURE__ */ jsx("div", {
							className: "text-3xl font-bold text-foreground",
							children: analytics?.stockWarnings?.length || 0
						}), /* @__PURE__ */ jsx("div", {
							className: "mt-2 text-xs text-muted-foreground",
							children: "Produits en rupture ou bas"
						})]
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-1 gap-4 lg:grid-cols-3",
				children: [/* @__PURE__ */ jsx(BentoCard, {
					className: "lg:col-span-2",
					title: "Tendance des ventes (14 jours)",
					children: /* @__PURE__ */ jsx("div", {
						className: "h-72 w-full",
						children: /* @__PURE__ */ jsx(ResponsiveContainer, {
							width: "100%",
							height: "100%",
							children: /* @__PURE__ */ jsxs(AreaChart, {
								data: salesTrend,
								children: [
									/* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", {
										id: "g",
										x1: "0",
										y1: "0",
										x2: "0",
										y2: "1",
										children: [/* @__PURE__ */ jsx("stop", {
											offset: "0%",
											stopColor: "oklch(0.48 0.16 258)",
											stopOpacity: .35
										}), /* @__PURE__ */ jsx("stop", {
											offset: "100%",
											stopColor: "oklch(0.48 0.16 258)",
											stopOpacity: 0
										})]
									}) }),
									/* @__PURE__ */ jsx(CartesianGrid, {
										strokeDasharray: "3 3",
										stroke: "oklch(0.92 0.01 255)"
									}),
									/* @__PURE__ */ jsx(XAxis, {
										dataKey: "day",
										tick: { fontSize: 11 },
										stroke: "oklch(0.5 0.03 256)"
									}),
									/* @__PURE__ */ jsx(YAxis, {
										tick: { fontSize: 11 },
										stroke: "oklch(0.5 0.03 256)"
									}),
									/* @__PURE__ */ jsx(Tooltip, { contentStyle: {
										borderRadius: 12,
										border: "1px solid oklch(0.92 0.01 255)",
										fontSize: 12
									} }),
									/* @__PURE__ */ jsx(Area, {
										type: "monotone",
										dataKey: "sales",
										stroke: "oklch(0.48 0.16 258)",
										strokeWidth: 2,
										fill: "url(#g)"
									})
								]
							})
						})
					})
				}), /* @__PURE__ */ jsx(BentoCard, {
					title: "Top vendeurs",
					children: /* @__PURE__ */ jsx("div", {
						className: "space-y-3",
						children: (analytics?.topPerformingBuyers || []).map((b) => /* @__PURE__ */ jsxs("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "flex items-center gap-3",
								children: [/* @__PURE__ */ jsx("div", {
									className: "flex size-9 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand",
									children: b.name.split(" ").map((p) => p[0]).join("").slice(0, 2)
								}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
									className: "text-sm font-medium text-foreground",
									children: b.name
								}), /* @__PURE__ */ jsx("div", {
									className: "text-xs text-muted-foreground",
									children: b.phone
								})] })]
							}), /* @__PURE__ */ jsx("div", {
								className: "text-sm font-semibold text-foreground",
								children: formatMoney(b.totalSales, i18n.language)
							})]
						}, b.buyerId))
					})
				})]
			}),
			/* @__PURE__ */ jsx(BentoCard, {
				title: "Ventes récentes",
				children: /* @__PURE__ */ jsx("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ jsxs("table", {
						className: "w-full text-sm",
						children: [/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", {
							className: "text-start text-xs uppercase tracking-wider text-muted-foreground",
							children: [
								/* @__PURE__ */ jsx("th", {
									className: "pb-3 text-start font-medium",
									children: "Date"
								}),
								/* @__PURE__ */ jsx("th", {
									className: "pb-3 text-start font-medium",
									children: "Supermarché"
								}),
								/* @__PURE__ */ jsx("th", {
									className: "pb-3 text-start font-medium",
									children: "Vendeur"
								}),
								/* @__PURE__ */ jsx("th", {
									className: "pb-3 text-end font-medium",
									children: "Total"
								}),
								/* @__PURE__ */ jsx("th", {
									className: "pb-3 text-end font-medium",
									children: "Statut"
								})
							]
						}) }), /* @__PURE__ */ jsx("tbody", {
							className: "divide-y divide-border",
							children: recent.map((d) => /* @__PURE__ */ jsxs("tr", {
								className: "hover:bg-muted/40",
								children: [
									/* @__PURE__ */ jsx("td", {
										className: "py-3 font-mono text-xs text-muted-foreground",
										children: new Date(d.createdAt).toLocaleDateString()
									}),
									/* @__PURE__ */ jsx("td", {
										className: "py-3 font-medium",
										children: d.supermarket?.name
									}),
									/* @__PURE__ */ jsx("td", {
										className: "py-3 text-muted-foreground",
										children: d.buyer?.name
									}),
									/* @__PURE__ */ jsx("td", {
										className: "py-3 text-end font-semibold",
										children: formatMoney(d.totalAmount, i18n.language)
									}),
									/* @__PURE__ */ jsx("td", {
										className: "py-3 text-end",
										children: /* @__PURE__ */ jsx(StatusPill, { status: d.status })
									})
								]
							}, d.id))
						})]
					})
				})
			})
		]
	});
}
//#endregion
export { AdminDashboard as component };
