import { t as useAuth } from "./auth-Dgc-H9Jh.js";
import { t as cn } from "./utils-C_uf36nf.js";
import { u as logout } from "./api-Bc9u_B1E.js";
import { t as LanguageToggle } from "./LanguageToggle-Cg9Rvf1b.js";
import { useEffect } from "react";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, LogOut, Package, Receipt, Store, Users } from "lucide-react";
//#region src/routes/admin.tsx?tsr-split=component
function AdminLayout() {
	const { t } = useTranslation();
	const user = useAuth((s) => s.user);
	const hydrated = useAuth((s) => s.hydrated);
	const logout$1 = useAuth((s) => s.logout);
	const navigate = useNavigate();
	const pathname = useRouterState({ select: (r) => r.location.pathname });
	useEffect(() => {
		if (!hydrated) return;
		if (!user) navigate({ to: "/auth/login" });
		else if (user.role !== "ADMIN") navigate({ to: "/buyer/dashboard" });
	}, [
		user,
		hydrated,
		navigate
	]);
	const nav = [
		{
			to: "/admin/dashboard",
			label: t("nav.dashboard"),
			icon: LayoutDashboard
		},
		{
			to: "/admin/products",
			label: t("nav.products"),
			icon: Package
		},
		{
			to: "/admin/supermarkets",
			label: t("nav.supermarkets"),
			icon: Store
		},
		{
			to: "/admin/deals",
			label: t("nav.deals"),
			icon: Receipt
		},
		{
			to: "/admin/team",
			label: t("nav.team"),
			icon: Users
		}
	];
	return /* @__PURE__ */ jsxs("div", {
		className: "flex min-h-screen w-full",
		children: [/* @__PURE__ */ jsxs("aside", {
			className: "fixed inset-y-0 start-0 hidden w-64 flex-col border-e border-border bg-surface lg:flex",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "flex h-16 items-center gap-3 px-6",
					children: [/* @__PURE__ */ jsx("div", {
						className: "flex size-9 items-center justify-center rounded-xl bg-brand text-brand-foreground font-bold",
						children: "R"
					}), /* @__PURE__ */ jsx("span", {
						className: "text-lg font-semibold text-foreground",
						children: t("brand")
					})]
				}),
				/* @__PURE__ */ jsx("nav", {
					className: "flex-1 space-y-1 px-3 py-4",
					children: nav.map((item) => {
						const active = pathname.startsWith(item.to);
						return /* @__PURE__ */ jsxs(Link, {
							to: item.to,
							className: cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors", active ? "bg-brand-soft text-brand font-semibold" : "text-muted-foreground hover:bg-muted hover:text-foreground"),
							children: [/* @__PURE__ */ jsx(item.icon, { className: "size-4" }), item.label]
						}, item.to);
					})
				}),
				/* @__PURE__ */ jsx("div", {
					className: "border-t border-border p-3",
					children: /* @__PURE__ */ jsxs("button", {
						onClick: async () => {
							await logout();
							logout$1();
							navigate({ to: "/auth/login" });
						},
						className: "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
						children: [/* @__PURE__ */ jsx(LogOut, { className: "size-4" }), t("nav.logout")]
					})
				})
			]
		}), /* @__PURE__ */ jsxs("div", {
			className: "flex w-full flex-col lg:ms-64",
			children: [/* @__PURE__ */ jsxs("header", {
				className: "sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur lg:px-8",
				children: [/* @__PURE__ */ jsx("div", {
					className: "text-sm text-muted-foreground",
					children: nav.find((n) => pathname.startsWith(n.to))?.label
				}), /* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ jsx(LanguageToggle, {}), /* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2 rounded-full border border-border bg-surface ps-3 pe-1 py-1",
						children: [/* @__PURE__ */ jsx("span", {
							className: "text-xs text-muted-foreground",
							children: user?.name
						}), /* @__PURE__ */ jsx("div", {
							className: "flex size-7 items-center justify-center rounded-full bg-brand text-xs font-semibold text-brand-foreground",
							children: user?.name?.[0] ?? "A"
						})]
					})]
				})]
			}), /* @__PURE__ */ jsx("main", {
				className: "flex-1 px-4 py-6 lg:px-8 lg:py-8",
				children: /* @__PURE__ */ jsx(Outlet, {})
			})]
		})]
	});
}
//#endregion
export { AdminLayout as component };
