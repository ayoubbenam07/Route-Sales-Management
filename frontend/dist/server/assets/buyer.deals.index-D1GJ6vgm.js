import { n as formatMoney } from "./i18n-C_8wfDly.js";
import { t as cn } from "./utils-C_uf36nf.js";
import { n as StatusPill } from "./Bento-Bq0mey4A.js";
import { o as getDeals } from "./api-Bc9u_B1E.js";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Drawer } from "vaul";
//#region src/components/ui/drawer.tsx
var Drawer$1 = ({ shouldScaleBackground = true, ...props }) => /* @__PURE__ */ jsx(Drawer.Root, {
	shouldScaleBackground,
	...props
});
Drawer$1.displayName = "Drawer";
Drawer.Trigger;
var DrawerPortal = Drawer.Portal;
Drawer.Close;
var DrawerOverlay = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(Drawer.Overlay, {
	ref,
	className: cn("fixed inset-0 z-50 bg-black/80", className),
	...props
}));
DrawerOverlay.displayName = Drawer.Overlay.displayName;
var DrawerContent = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(DrawerPortal, { children: [/* @__PURE__ */ jsx(DrawerOverlay, {}), /* @__PURE__ */ jsxs(Drawer.Content, {
	ref,
	className: cn("fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background", className),
	...props,
	children: [/* @__PURE__ */ jsx("div", { className: "mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" }), children]
})] }));
DrawerContent.displayName = "DrawerContent";
var DrawerHeader = ({ className, ...props }) => /* @__PURE__ */ jsx("div", {
	className: cn("grid gap-1.5 p-4 text-center sm:text-left", className),
	...props
});
DrawerHeader.displayName = "DrawerHeader";
var DrawerFooter = ({ className, ...props }) => /* @__PURE__ */ jsx("div", {
	className: cn("mt-auto flex flex-col gap-2 p-4", className),
	...props
});
DrawerFooter.displayName = "DrawerFooter";
var DrawerTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(Drawer.Title, {
	ref,
	className: cn("text-lg font-semibold leading-none tracking-tight", className),
	...props
}));
DrawerTitle.displayName = Drawer.Title.displayName;
var DrawerDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(Drawer.Description, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
DrawerDescription.displayName = Drawer.Description.displayName;
//#endregion
//#region src/routes/buyer.deals.index.tsx?tsr-split=component
var PAGE = 8;
function BuyerDeals() {
	const { t, i18n } = useTranslation();
	const [offset, setOffset] = useState(PAGE);
	const [selected, setSelected] = useState(null);
	const sentinel = useRef(null);
	const { data: allDeals, isLoading } = useQuery({
		queryKey: ["deals"],
		queryFn: () => getDeals()
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
		className: "space-y-4",
		children: [
			/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
				className: "text-xl font-bold text-foreground",
				children: t("nav.myDeals")
			}), /* @__PURE__ */ jsx("p", {
				className: "mt-1 text-xs text-muted-foreground",
				children: "Historique de vos ventes"
			})] }),
			/* @__PURE__ */ jsx("div", {
				className: "space-y-3",
				children: /* @__PURE__ */ jsx(AnimatePresence, {
					initial: false,
					children: items.map((d) => /* @__PURE__ */ jsx(motion.button, {
						initial: {
							opacity: 0,
							y: 8
						},
						animate: {
							opacity: 1,
							y: 0
						},
						transition: { duration: .18 },
						onClick: () => setSelected(d),
						className: "surface-card w-full p-4 text-start",
						children: /* @__PURE__ */ jsxs("div", {
							className: "flex items-start justify-between gap-3",
							children: [/* @__PURE__ */ jsxs("div", { children: [
								/* @__PURE__ */ jsx("div", {
									className: "text-sm font-semibold text-foreground",
									children: d.supermarket?.name
								}),
								/* @__PURE__ */ jsx("div", {
									className: "mt-0.5 font-mono text-xs text-muted-foreground",
									children: d.id.slice(0, 8)
								}),
								/* @__PURE__ */ jsx("div", {
									className: "mt-1 text-xs text-muted-foreground",
									children: new Date(d.createdAt).toLocaleDateString(i18n.language === "ar" ? "ar-MA" : "fr-FR")
								})
							] }), /* @__PURE__ */ jsxs("div", {
								className: "text-end",
								children: [/* @__PURE__ */ jsx("div", {
									className: "text-base font-bold text-foreground",
									children: formatMoney(d.totalAmount, i18n.language)
								}), /* @__PURE__ */ jsx("div", {
									className: "mt-1",
									children: /* @__PURE__ */ jsx(StatusPill, { status: d.status })
								})]
							})]
						})
					}, d.id))
				})
			}),
			/* @__PURE__ */ jsxs("div", {
				ref: sentinel,
				className: "flex h-12 items-center justify-center text-xs text-muted-foreground",
				children: [isLoading && /* @__PURE__ */ jsx(Loader2, { className: "size-4 animate-spin" }), done && !isLoading && /* @__PURE__ */ jsx("span", { children: "Fin de l'historique" })]
			}),
			/* @__PURE__ */ jsx(Drawer$1, {
				open: !!selected,
				onOpenChange: (o) => !o && setSelected(null),
				children: /* @__PURE__ */ jsx(DrawerContent, { children: selected && /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(DrawerHeader, { children: /* @__PURE__ */ jsxs(DrawerTitle, { children: [
					t("common.receipt"),
					" · ",
					selected.id.slice(0, 8)
				] }) }), /* @__PURE__ */ jsxs("div", {
					className: "px-4 pb-8 space-y-4",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "surface-card p-4",
						children: [/* @__PURE__ */ jsx("div", {
							className: "text-xs text-muted-foreground",
							children: t("common.market")
						}), /* @__PURE__ */ jsx("div", {
							className: "text-sm font-semibold",
							children: selected.supermarket?.name
						})]
					}), /* @__PURE__ */ jsxs("div", {
						className: "surface-card p-4",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "mb-3 text-xs uppercase tracking-wider text-muted-foreground",
								children: "Articles"
							}),
							/* @__PURE__ */ jsx("div", {
								className: "space-y-2",
								children: selected.items?.map((it, idx) => /* @__PURE__ */ jsxs("div", {
									className: "flex items-center justify-between text-sm",
									children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
										className: "font-medium",
										children: it.product?.name
									}), /* @__PURE__ */ jsxs("div", {
										className: "text-xs text-muted-foreground",
										children: [
											it.quantity,
											" × ",
											formatMoney(it.unitPrice, i18n.language)
										]
									})] }), /* @__PURE__ */ jsx("div", {
										className: "font-semibold",
										children: formatMoney(it.quantity * it.unitPrice, i18n.language)
									})]
								}, idx))
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "mt-4 space-y-2 border-t border-border pt-4 text-sm",
								children: [
									/* @__PURE__ */ jsxs("div", {
										className: "flex justify-between",
										children: [/* @__PURE__ */ jsx("span", {
											className: "text-muted-foreground",
											children: t("common.total")
										}), /* @__PURE__ */ jsx("span", {
											className: "font-semibold",
											children: formatMoney(selected.totalAmount, i18n.language)
										})]
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "flex justify-between",
										children: [/* @__PURE__ */ jsx("span", {
											className: "text-muted-foreground",
											children: "Payé"
										}), /* @__PURE__ */ jsx("span", {
											className: "text-emerald-700",
											children: formatMoney(selected.paymentSummary?.totalPaid || 0, i18n.language)
										})]
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "flex justify-between",
										children: [/* @__PURE__ */ jsx("span", {
											className: "text-muted-foreground",
											children: "Restant"
										}), /* @__PURE__ */ jsx("span", {
											className: "text-rose-700",
											children: formatMoney(selected.paymentSummary?.remainingBalance || selected.totalAmount, i18n.language)
										})]
									})
								]
							})
						]
					})]
				})] }) })
			})
		]
	});
}
//#endregion
export { BuyerDeals as component };
