import { n as formatMoney } from "./i18n-C_8wfDly.js";
import { t as cn } from "./utils-C_uf36nf.js";
import { t as BentoCard } from "./Bento-Bq0mey4A.js";
import { r as createProduct, s as getProducts } from "./api-Bc9u_B1E.js";
import { t as Button } from "./button-Bq5vK6RO.js";
import { n as Input, t as Label } from "./label-B7oQAA24.js";
import * as React from "react";
import { useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, Plus, Search, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cva } from "class-variance-authority";
import * as SheetPrimitive from "@radix-ui/react-dialog";
//#region src/components/ui/sheet.tsx
var Sheet = SheetPrimitive.Root;
var SheetTrigger = SheetPrimitive.Trigger;
var SheetPortal = SheetPrimitive.Portal;
var SheetOverlay = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(SheetPrimitive.Overlay, {
	className: cn("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props,
	ref
}));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;
var sheetVariants = cva("fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out", {
	variants: { side: {
		top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
		bottom: "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
		left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
		right: "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm"
	} },
	defaultVariants: { side: "right" }
});
var SheetContent = React.forwardRef(({ side = "right", className, children, ...props }, ref) => /* @__PURE__ */ jsxs(SheetPortal, { children: [/* @__PURE__ */ jsx(SheetOverlay, {}), /* @__PURE__ */ jsxs(SheetPrimitive.Content, {
	ref,
	className: cn(sheetVariants({ side }), className),
	...props,
	children: [/* @__PURE__ */ jsxs(SheetPrimitive.Close, {
		className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary",
		children: [/* @__PURE__ */ jsx(X, { className: "h-4 w-4" }), /* @__PURE__ */ jsx("span", {
			className: "sr-only",
			children: "Close"
		})]
	}), children]
})] }));
SheetContent.displayName = SheetPrimitive.Content.displayName;
var SheetHeader = ({ className, ...props }) => /* @__PURE__ */ jsx("div", {
	className: cn("flex flex-col space-y-2 text-center sm:text-left", className),
	...props
});
SheetHeader.displayName = "SheetHeader";
var SheetFooter = ({ className, ...props }) => /* @__PURE__ */ jsx("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
SheetFooter.displayName = "SheetFooter";
var SheetTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(SheetPrimitive.Title, {
	ref,
	className: cn("text-lg font-semibold text-foreground", className),
	...props
}));
SheetTitle.displayName = SheetPrimitive.Title.displayName;
var SheetDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(SheetPrimitive.Description, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
SheetDescription.displayName = SheetPrimitive.Description.displayName;
//#endregion
//#region src/routes/admin.products.tsx?tsr-split=component
var schema = z.object({
	name: z.string().min(2, "Nom requis"),
	basePrice: z.coerce.number().min(0, "Prix invalide"),
	stockQty: z.coerce.number().int().min(0, "Stock invalide")
});
function ProductsPage() {
	const { t, i18n } = useTranslation();
	const queryClient = useQueryClient();
	const [query, setQuery] = useState("");
	const [open, setOpen] = useState(false);
	const { data: items = [], isLoading } = useQuery({
		queryKey: ["products"],
		queryFn: getProducts
	});
	const mutation = useMutation({
		mutationFn: createProduct,
		onSuccess: () => {
			toast.success("Produit créé");
			queryClient.invalidateQueries({ queryKey: ["products"] });
			form.reset();
			setOpen(false);
		},
		onError: (err) => {
			toast.error(err.response?.data?.message || "Erreur de création");
		}
	});
	const form = useForm({
		resolver: zodResolver(schema),
		defaultValues: {
			name: "",
			basePrice: 0,
			stockQty: 0
		}
	});
	const onSubmit = (data) => {
		mutation.mutate(data);
	};
	const filtered = items.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-6",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex items-center justify-between",
			children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
				className: "text-2xl font-bold text-foreground",
				children: t("nav.products")
			}), /* @__PURE__ */ jsx("p", {
				className: "mt-1 text-sm text-muted-foreground",
				children: "Catalogue d'inventaire."
			})] }), /* @__PURE__ */ jsxs(Sheet, {
				open,
				onOpenChange: setOpen,
				children: [/* @__PURE__ */ jsx(SheetTrigger, {
					asChild: true,
					children: /* @__PURE__ */ jsxs(Button, { children: [
						/* @__PURE__ */ jsx(Plus, { className: "size-4 me-2" }),
						" ",
						t("common.createProduct")
					] })
				}), /* @__PURE__ */ jsxs(SheetContent, {
					className: "sm:max-w-md",
					children: [/* @__PURE__ */ jsx(SheetHeader, { children: /* @__PURE__ */ jsx(SheetTitle, { children: t("common.createProduct") }) }), /* @__PURE__ */ jsxs("form", {
						onSubmit: form.handleSubmit(onSubmit),
						className: "mt-6 space-y-4 px-4",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "space-y-2",
								children: [
									/* @__PURE__ */ jsx(Label, { children: t("common.name") }),
									/* @__PURE__ */ jsx(Input, {
										...form.register("name"),
										placeholder: "Lait Centrale 1L"
									}),
									form.formState.errors.name && /* @__PURE__ */ jsx("p", {
										className: "text-xs text-destructive",
										children: form.formState.errors.name.message
									})
								]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "grid grid-cols-2 gap-3",
								children: [/* @__PURE__ */ jsxs("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ jsx(Label, { children: t("common.basePrice") }), /* @__PURE__ */ jsx(Input, {
										type: "number",
										step: "0.01",
										...form.register("basePrice")
									})]
								}), /* @__PURE__ */ jsxs("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ jsx(Label, { children: t("common.stock") }), /* @__PURE__ */ jsx(Input, {
										type: "number",
										...form.register("stockQty")
									})]
								})]
							}),
							/* @__PURE__ */ jsx(SheetFooter, {
								className: "mt-6",
								children: /* @__PURE__ */ jsxs(Button, {
									type: "submit",
									disabled: mutation.isPending,
									className: "w-full",
									children: [mutation.isPending && /* @__PURE__ */ jsx(Loader2, { className: "me-2 size-4 animate-spin" }), t("common.save")]
								})
							})
						]
					})]
				})]
			})]
		}), /* @__PURE__ */ jsxs(BentoCard, { children: [/* @__PURE__ */ jsx("div", {
			className: "mb-4 flex items-center gap-2",
			children: /* @__PURE__ */ jsxs("div", {
				className: "relative flex-1 max-w-xs",
				children: [/* @__PURE__ */ jsx(Search, { className: "absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" }), /* @__PURE__ */ jsx(Input, {
					value: query,
					onChange: (e) => setQuery(e.target.value),
					placeholder: t("common.search"),
					className: "ps-9"
				})]
			})
		}), /* @__PURE__ */ jsx("div", {
			className: "overflow-x-auto",
			children: /* @__PURE__ */ jsxs("table", {
				className: "w-full text-sm",
				children: [/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", {
					className: "text-xs uppercase tracking-wider text-muted-foreground",
					children: [
						/* @__PURE__ */ jsx("th", {
							className: "pb-3 text-start font-medium",
							children: t("common.name")
						}),
						/* @__PURE__ */ jsx("th", {
							className: "pb-3 text-end font-medium",
							children: t("common.basePrice")
						}),
						/* @__PURE__ */ jsx("th", {
							className: "pb-3 text-end font-medium",
							children: t("common.stock")
						})
					]
				}) }), /* @__PURE__ */ jsxs("tbody", {
					className: "divide-y divide-border",
					children: [isLoading && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", {
						colSpan: 3,
						className: "py-8 text-center text-muted-foreground",
						children: "Chargement..."
					}) }), filtered.map((p) => /* @__PURE__ */ jsxs("tr", {
						className: "hover:bg-muted/40",
						children: [
							/* @__PURE__ */ jsx("td", {
								className: "py-3 font-medium",
								children: p.name
							}),
							/* @__PURE__ */ jsx("td", {
								className: "py-3 text-end",
								children: formatMoney(p.basePrice, i18n.language)
							}),
							/* @__PURE__ */ jsx("td", {
								className: "py-3 text-end text-muted-foreground",
								children: p.stockQty
							})
						]
					}, p.id))]
				})]
			})
		})] })]
	});
}
//#endregion
export { ProductsPage as component };
