import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { z } from "zod";
//#region src/routes/buyer.deals.new.tsx
var $$splitComponentImporter = () => import("./buyer.deals.new-D6Mnit7X.js");
z.object({
	supermarketId: z.string().min(1, "Sélectionnez un client"),
	items: z.array(z.object({
		productId: z.string().min(1, "Produit requis"),
		quantity: z.coerce.number().positive("Quantité > 0"),
		unitPrice: z.coerce.number().min(0, "Prix invalide")
	})).min(1, "Au moins un article"),
	initialPayment: z.coerce.number().min(0)
});
var Route = createFileRoute("/buyer/deals/new")({
	validateSearch: (s) => ({ supermarketId: typeof s.supermarketId === "string" ? s.supermarketId : "" }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
