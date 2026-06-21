import { n as formatMoney } from "./i18n-C_8wfDly.js";
import { t as useAuth } from "./auth-Dgc-H9Jh.js";
import { t as cn } from "./utils-C_uf36nf.js";
import { a as getBuyerDashboard, u as logout } from "./api-Bc9u_B1E.js";
import { t as LanguageToggle } from "./LanguageToggle-Cg9Rvf1b.js";
import { useEffect } from "react";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, LogOut, Receipt, Users } from "lucide-react";
//#region src/routes/buyer.tsx?tsr-split=component
function BuyerLayout() {
	const { t, i18n } = useTranslation();
	const user = useAuth((s) => s.user);
	const hydrated = useAuth((s) => s.hydrated);
	const logout$1 = useAuth((s) => s.logout);
	const navigate = useNavigate();
	const pathname = useRouterState({ select: (r) => r.location.pathname });
	useEffect(() => {
		if (!hydrated) return;
		if (!user) navigate({ to: "/auth/login" });
		else if (user.role !== "BUYER") navigate({ to: "/admin/dashboard" });
	}, [
		user,
		hydrated,
		navigate
	]);
	const { data: dashboard } = useQuery({
		queryKey: ["buyerDashboard"],
		queryFn: getBuyerDashboard,
		enabled: !!user && user.role === "BUYER"
	});
	const cash = dashboard?.totalSalesThisMonth ?? 0;
	const nav = [
		{
			to: "/buyer/dashboard",
			label: t("nav.dashboard"),
			icon: LayoutDashboard
		},
		{
			to: "/buyer/clients",
			label: t("nav.clients"),
			icon: Users
		},
		{
			to: "/buyer/deals",
			label: t("nav.myDeals"),
			icon: Receipt
		}
	];
	return /* @__PURE__ */ jsxs("div", {
		className: "min-h-screen w-full bg-background pb-24",
		children: [
			/* @__PURE__ */ jsx("header", {
				className: "sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur",
				children: /* @__PURE__ */ jsxs("div", {
					className: "mx-auto flex max-w-md items-center justify-between px-4 py-3",
					children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
						className: "text-xs text-muted-foreground",
						children: t("auth.welcome")
					}), /* @__PURE__ */ jsx("div", {
						className: "text-sm font-semibold text-foreground",
						children: user?.name ?? "—"
					})] }), /* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand",
								children: formatMoney(cash, i18n.language)
							}),
							/* @__PURE__ */ jsx(LanguageToggle, {}),
							/* @__PURE__ */ jsx("button", {
								onClick: async () => {
									await logout();
									logout$1();
									navigate({ to: "/auth/login" });
								},
								className: "rounded-full p-2 text-muted-foreground hover:bg-muted",
								"aria-label": t("nav.logout"),
								children: /* @__PURE__ */ jsx(LogOut, { className: "size-4" })
							})
						]
					})]
				})
			}),
			/* @__PURE__ */ jsx("main", {
				className: "mx-auto max-w-md px-4 py-5",
				children: /* @__PURE__ */ jsx(Outlet, {})
			}),
			/* @__PURE__ */ jsx("nav", {
				className: "fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur",
				children: /* @__PURE__ */ jsx("div", {
					className: "mx-auto grid max-w-md grid-cols-3",
					children: nav.map((item) => {
						const active = pathname.startsWith(item.to);
						return /* @__PURE__ */ jsxs(Link, {
							to: item.to,
							className: cn("flex flex-col items-center gap-1 py-3 text-xs", active ? "text-brand font-semibold" : "text-muted-foreground"),
							children: [/* @__PURE__ */ jsx(item.icon, { className: cn("size-6", active && "stroke-[2.4]") }), item.label]
						}, item.to);
					})
				})
			})
		]
	});
}
//#endregion
export { BuyerLayout as component };
