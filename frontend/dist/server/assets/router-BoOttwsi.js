import { t as applyLocale } from "./i18n-C_8wfDly.js";
import { t as useAuth } from "./auth-Dgc-H9Jh.js";
import { t as Route$15 } from "./buyer.deals.new-GPf9G4pN.js";
import { useEffect } from "react";
import { HeadContent, Link, Outlet, Scripts, createFileRoute, createRootRouteWithContext, createRouter, lazyRouteComponent, redirect, useRouter } from "@tanstack/react-router";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Toaster } from "sonner";
import { z } from "zod";
//#region src/styles.css?url
var styles_default = "/assets/styles-MEWjlXrL.css";
//#endregion
//#region src/lib/lovable-error-reporting.ts
function reportLovableError(error, context = {}) {
	if (typeof window === "undefined") return;
	window.__lovableEvents?.captureException?.(error, {
		source: "react_error_boundary",
		route: window.location.pathname,
		...context
	}, {
		mechanism: "react_error_boundary",
		handled: false,
		severity: "error"
	});
}
//#endregion
//#region src/components/I18nBoot.tsx
function I18nBoot({ children }) {
	const { i18n } = useTranslation();
	const hydrate = useAuth((s) => s.hydrate);
	useEffect(() => {
		hydrate();
	}, [hydrate]);
	useEffect(() => {
		applyLocale(i18n.language || "fr");
	}, [i18n.language]);
	return /* @__PURE__ */ jsx(Fragment, { children });
}
//#endregion
//#region src/components/ui/sonner.tsx
var Toaster$1 = ({ ...props }) => {
	return /* @__PURE__ */ jsx(Toaster, {
		className: "toaster group",
		toastOptions: { classNames: {
			toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
			description: "group-[.toast]:text-muted-foreground",
			actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
			cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
		} },
		...props
	});
};
//#endregion
//#region src/routes/__root.tsx
function NotFoundComponent() {
	return /* @__PURE__ */ jsx("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ jsxs("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ jsx("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ jsx("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page introuvable"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Cette page n'existe pas ou a été déplacée."
				}),
				/* @__PURE__ */ jsx("div", {
					className: "mt-6",
					children: /* @__PURE__ */ jsx(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Accueil"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	useEffect(() => {
		reportLovableError(error, { boundary: "tanstack_root_error_component" });
	}, [error]);
	return /* @__PURE__ */ jsx("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ jsxs("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ jsx("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "Erreur"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: error.message
				}),
				/* @__PURE__ */ jsx("button", {
					onClick: () => {
						router.invalidate();
						reset();
					},
					className: "mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
					children: "Réessayer"
				})
			]
		})
	});
}
var Route$14 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "RouteSales — Plateforme de gestion commerciale" },
			{
				name: "description",
				content: "Plateforme de gestion des ventes itinérantes."
			}
		],
		links: [
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Cairo:wght@400;500;600;700&display=swap"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ jsxs("html", {
		lang: "fr",
		children: [/* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }), /* @__PURE__ */ jsxs("body", { children: [children, /* @__PURE__ */ jsx(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$14.useRouteContext();
	return /* @__PURE__ */ jsx(QueryClientProvider, {
		client: queryClient,
		children: /* @__PURE__ */ jsxs(I18nBoot, { children: [/* @__PURE__ */ jsx(Outlet, {}), /* @__PURE__ */ jsx(Toaster$1, { position: "top-center" })] })
	});
}
//#endregion
//#region src/routes/buyer.tsx
var $$splitComponentImporter$12 = () => import("./buyer-ECkeLFVr.js");
var Route$13 = createFileRoute("/buyer")({ component: lazyRouteComponent($$splitComponentImporter$12, "component") });
//#endregion
//#region src/routes/auth.tsx
var $$splitComponentImporter$11 = () => import("./auth-CMZczW-x.js");
var Route$12 = createFileRoute("/auth")({ component: lazyRouteComponent($$splitComponentImporter$11, "component") });
//#endregion
//#region src/routes/admin.tsx
var $$splitComponentImporter$10 = () => import("./admin-DYggxTqI.js");
var Route$11 = createFileRoute("/admin")({ component: lazyRouteComponent($$splitComponentImporter$10, "component") });
//#endregion
//#region src/routes/index.tsx
var Route$10 = createFileRoute("/")({ beforeLoad: () => {
	throw redirect({ to: "/auth/login" });
} });
//#endregion
//#region src/routes/buyer.deals.tsx
var $$splitComponentImporter$9 = () => import("./buyer.deals-DO1t2pWB.js");
var Route$9 = createFileRoute("/buyer/deals")({ component: lazyRouteComponent($$splitComponentImporter$9, "component") });
//#endregion
//#region src/routes/buyer.dashboard.tsx
var $$splitComponentImporter$8 = () => import("./buyer.dashboard-W6T1alDM.js");
var Route$8 = createFileRoute("/buyer/dashboard")({ component: lazyRouteComponent($$splitComponentImporter$8, "component") });
//#endregion
//#region src/routes/buyer.clients.tsx
var $$splitComponentImporter$7 = () => import("./buyer.clients-BP5nN3Nz.js");
var Route$7 = createFileRoute("/buyer/clients")({ component: lazyRouteComponent($$splitComponentImporter$7, "component") });
//#endregion
//#region src/routes/auth.login.tsx
var $$splitComponentImporter$6 = () => import("./auth.login-CmB0GgHi.js");
z.object({
	phone: z.string().min(6),
	password: z.string().min(6)
});
var Route$6 = createFileRoute("/auth/login")({ component: lazyRouteComponent($$splitComponentImporter$6, "component") });
//#endregion
//#region src/routes/admin.team.tsx
var $$splitComponentImporter$5 = () => import("./admin.team-CK45VWuN.js");
z.object({
	name: z.string().min(2),
	phone: z.string().min(6),
	password: z.string().min(6, "6 caractères minimum")
});
var Route$5 = createFileRoute("/admin/team")({ component: lazyRouteComponent($$splitComponentImporter$5, "component") });
//#endregion
//#region src/routes/admin.supermarkets.tsx
var $$splitComponentImporter$4 = () => import("./admin.supermarkets-CvwANsef.js");
var Route$4 = createFileRoute("/admin/supermarkets")({ component: lazyRouteComponent($$splitComponentImporter$4, "component") });
//#endregion
//#region src/routes/admin.products.tsx
var $$splitComponentImporter$3 = () => import("./admin.products-CFHUamX4.js");
z.object({
	name: z.string().min(2, "Nom requis"),
	basePrice: z.coerce.number().min(0, "Prix invalide"),
	stockQty: z.coerce.number().int().min(0, "Stock invalide")
});
var Route$3 = createFileRoute("/admin/products")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
//#endregion
//#region src/routes/admin.deals.tsx
var $$splitComponentImporter$2 = () => import("./admin.deals-BUy4ZX7y.js");
var Route$2 = createFileRoute("/admin/deals")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
//#endregion
//#region src/routes/admin.dashboard.tsx
var $$splitComponentImporter$1 = () => import("./admin.dashboard-D5AiduRq.js");
var Route$1 = createFileRoute("/admin/dashboard")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
//#endregion
//#region src/routes/buyer.deals.index.tsx
var $$splitComponentImporter = () => import("./buyer.deals.index-D1GJ6vgm.js");
var Route = createFileRoute("/buyer/deals/")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
//#endregion
//#region src/routeTree.gen.ts
var BuyerRoute = Route$13.update({
	id: "/buyer",
	path: "/buyer",
	getParentRoute: () => Route$14
});
var AuthRoute = Route$12.update({
	id: "/auth",
	path: "/auth",
	getParentRoute: () => Route$14
});
var AdminRoute = Route$11.update({
	id: "/admin",
	path: "/admin",
	getParentRoute: () => Route$14
});
var IndexRoute = Route$10.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$14
});
var BuyerDealsRoute = Route$9.update({
	id: "/deals",
	path: "/deals",
	getParentRoute: () => BuyerRoute
});
var BuyerDashboardRoute = Route$8.update({
	id: "/dashboard",
	path: "/dashboard",
	getParentRoute: () => BuyerRoute
});
var BuyerClientsRoute = Route$7.update({
	id: "/clients",
	path: "/clients",
	getParentRoute: () => BuyerRoute
});
var AuthLoginRoute = Route$6.update({
	id: "/login",
	path: "/login",
	getParentRoute: () => AuthRoute
});
var AdminTeamRoute = Route$5.update({
	id: "/team",
	path: "/team",
	getParentRoute: () => AdminRoute
});
var AdminSupermarketsRoute = Route$4.update({
	id: "/supermarkets",
	path: "/supermarkets",
	getParentRoute: () => AdminRoute
});
var AdminProductsRoute = Route$3.update({
	id: "/products",
	path: "/products",
	getParentRoute: () => AdminRoute
});
var AdminDealsRoute = Route$2.update({
	id: "/deals",
	path: "/deals",
	getParentRoute: () => AdminRoute
});
var AdminDashboardRoute = Route$1.update({
	id: "/dashboard",
	path: "/dashboard",
	getParentRoute: () => AdminRoute
});
var BuyerDealsIndexRoute = Route.update({
	id: "/",
	path: "/",
	getParentRoute: () => BuyerDealsRoute
});
var BuyerDealsNewRoute = Route$15.update({
	id: "/new",
	path: "/new",
	getParentRoute: () => BuyerDealsRoute
});
var AdminRouteChildren = {
	AdminDashboardRoute,
	AdminDealsRoute,
	AdminProductsRoute,
	AdminSupermarketsRoute,
	AdminTeamRoute
};
var AdminRouteWithChildren = AdminRoute._addFileChildren(AdminRouteChildren);
var AuthRouteChildren = { AuthLoginRoute };
var AuthRouteWithChildren = AuthRoute._addFileChildren(AuthRouteChildren);
var BuyerDealsRouteChildren = {
	BuyerDealsNewRoute,
	BuyerDealsIndexRoute
};
var BuyerRouteChildren = {
	BuyerClientsRoute,
	BuyerDashboardRoute,
	BuyerDealsRoute: BuyerDealsRoute._addFileChildren(BuyerDealsRouteChildren)
};
var rootRouteChildren = {
	IndexRoute,
	AdminRoute: AdminRouteWithChildren,
	AuthRoute: AuthRouteWithChildren,
	BuyerRoute: BuyerRoute._addFileChildren(BuyerRouteChildren)
};
var routeTree = Route$14._addFileChildren(rootRouteChildren)._addFileTypes();
//#endregion
//#region src/router.tsx
var getRouter = () => {
	return createRouter({
		routeTree,
		context: { queryClient: new QueryClient() },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
