import { n as formatMoney } from "./i18n-C_8wfDly.js";
import { t as Route } from "./buyer.deals.new-GPf9G4pN.js";
import { t as cn } from "./utils-C_uf36nf.js";
import { c as getSupermarkets, n as createDeal, s as getProducts } from "./api-Bc9u_B1E.js";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-Dg1urBTx.js";
import { t as Button } from "./button-Bq5vK6RO.js";
import { n as Input, t as Label } from "./label-B7oQAA24.js";
import * as React from "react";
import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { ArrowLeft, Check, ChevronsUpDown, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Command } from "cmdk";
//#region src/components/ui/popover.tsx
var Popover = PopoverPrimitive.Root;
var PopoverTrigger = PopoverPrimitive.Trigger;
var PopoverContent = React.forwardRef(({ className, align = "center", sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsx(PopoverPrimitive.Portal, { children: /* @__PURE__ */ jsx(PopoverPrimitive.Content, {
	ref,
	align,
	sideOffset,
	className: cn("z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-popover-content-transform-origin)", className),
	...props
}) }));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;
//#endregion
//#region src/components/ui/command.tsx
var Command$1 = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(Command, {
	ref,
	className: cn("flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground", className),
	...props
}));
Command$1.displayName = Command.displayName;
var CommandInput = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxs("div", {
	className: "flex items-center border-b px-3",
	"cmdk-input-wrapper": "",
	children: [/* @__PURE__ */ jsx(Search, { className: "mr-2 h-4 w-4 shrink-0 opacity-50" }), /* @__PURE__ */ jsx(Command.Input, {
		ref,
		className: cn("flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50", className),
		...props
	})]
}));
CommandInput.displayName = Command.Input.displayName;
var CommandList = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(Command.List, {
	ref,
	className: cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className),
	...props
}));
CommandList.displayName = Command.List.displayName;
var CommandEmpty = React.forwardRef((props, ref) => /* @__PURE__ */ jsx(Command.Empty, {
	ref,
	className: "py-6 text-center text-sm",
	...props
}));
CommandEmpty.displayName = Command.Empty.displayName;
var CommandGroup = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(Command.Group, {
	ref,
	className: cn("overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground", className),
	...props
}));
CommandGroup.displayName = Command.Group.displayName;
var CommandSeparator = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(Command.Separator, {
	ref,
	className: cn("-mx-1 h-px bg-border", className),
	...props
}));
CommandSeparator.displayName = Command.Separator.displayName;
var CommandItem = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(Command.Item, {
	ref,
	className: cn("relative flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", className),
	...props
}));
CommandItem.displayName = Command.Item.displayName;
var CommandShortcut = ({ className, ...props }) => {
	return /* @__PURE__ */ jsx("span", {
		className: cn("ml-auto text-xs tracking-widest text-muted-foreground", className),
		...props
	});
};
CommandShortcut.displayName = "CommandShortcut";
//#endregion
//#region src/routes/buyer.deals.new.tsx?tsr-split=component
var schema = z.object({
	supermarketId: z.string().min(1, "Sélectionnez un client"),
	items: z.array(z.object({
		productId: z.string().min(1, "Produit requis"),
		quantity: z.coerce.number().positive("Quantité > 0"),
		unitPrice: z.coerce.number().min(0, "Prix invalide")
	})).min(1, "Au moins un article"),
	initialPayment: z.coerce.number().min(0)
});
function NewDealPage() {
	const { t, i18n } = useTranslation();
	const navigate = useNavigate();
	const { supermarketId } = Route.useSearch();
	const [clientOpen, setClientOpen] = useState(false);
	const { data: supermarkets = [] } = useQuery({
		queryKey: ["supermarkets"],
		queryFn: getSupermarkets
	});
	const { data: products = [] } = useQuery({
		queryKey: ["products"],
		queryFn: getProducts
	});
	const mutation = useMutation({
		mutationFn: createDeal,
		onSuccess: () => {
			toast.success("Vente confirmée");
			navigate({ to: "/buyer/dashboard" });
		},
		onError: (err) => {
			toast.error(err.response?.data?.message || "Erreur lors de la création");
		}
	});
	const form = useForm({
		resolver: zodResolver(schema),
		defaultValues: {
			supermarketId: supermarketId || "",
			items: [{
				productId: "",
				quantity: 1,
				unitPrice: 0
			}],
			initialPayment: 0
		}
	});
	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "items"
	});
	const items = useWatch({
		control: form.control,
		name: "items"
	});
	const initialPayment = useWatch({
		control: form.control,
		name: "initialPayment"
	});
	const supermarketIdW = useWatch({
		control: form.control,
		name: "supermarketId"
	});
	const total = useMemo(() => (items ?? []).reduce((s, it) => s + (Number(it?.quantity) || 0) * (Number(it?.unitPrice) || 0), 0), [items]);
	const remaining = Math.max(0, total - (Number(initialPayment) || 0));
	const selectedClient = supermarkets.find((s) => s.id === supermarketIdW);
	const onSubmit = (data) => {
		mutation.mutate(data);
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "-mx-4 -mt-5 pb-44",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "sticky top-[57px] z-10 flex items-center gap-2 border-b border-border bg-background/85 px-4 py-3 backdrop-blur",
				children: [/* @__PURE__ */ jsx("button", {
					onClick: () => navigate({ to: "/buyer/dashboard" }),
					className: "rounded-full p-2 text-muted-foreground hover:bg-muted",
					children: /* @__PURE__ */ jsx(ArrowLeft, { className: "size-4 rtl:rotate-180" })
				}), /* @__PURE__ */ jsx("h1", {
					className: "text-base font-semibold",
					children: t("common.newDeal")
				})]
			}),
			/* @__PURE__ */ jsxs("form", {
				id: "deal-form",
				onSubmit: form.handleSubmit(onSubmit),
				className: "space-y-4 px-4 py-5",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "surface-card p-5",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "mb-3 flex items-center gap-2",
								children: [/* @__PURE__ */ jsx("span", {
									className: "flex size-6 items-center justify-center rounded-full bg-brand text-xs font-bold text-brand-foreground",
									children: "1"
								}), /* @__PURE__ */ jsx("h2", {
									className: "text-sm font-semibold",
									children: t("common.selectClient")
								})]
							}),
							/* @__PURE__ */ jsx(Controller, {
								control: form.control,
								name: "supermarketId",
								render: ({ field }) => /* @__PURE__ */ jsxs(Popover, {
									open: clientOpen,
									onOpenChange: setClientOpen,
									children: [/* @__PURE__ */ jsx(PopoverTrigger, {
										asChild: true,
										children: /* @__PURE__ */ jsxs(Button, {
											type: "button",
											variant: "outline",
											role: "combobox",
											className: "w-full justify-between",
											children: [selectedClient ? selectedClient.name : t("common.selectClient"), /* @__PURE__ */ jsx(ChevronsUpDown, { className: "ms-2 size-4 opacity-50" })]
										})
									}), /* @__PURE__ */ jsx(PopoverContent, {
										className: "w-[--radix-popover-trigger-width] p-0",
										children: /* @__PURE__ */ jsxs(Command$1, { children: [/* @__PURE__ */ jsx(CommandInput, { placeholder: t("common.search") }), /* @__PURE__ */ jsxs(CommandList, { children: [/* @__PURE__ */ jsx(CommandEmpty, { children: "Aucun client" }), /* @__PURE__ */ jsx(CommandGroup, { children: supermarkets.map((s) => /* @__PURE__ */ jsxs(CommandItem, {
											value: s.name,
											onSelect: () => {
												field.onChange(s.id);
												setClientOpen(false);
											},
											children: [/* @__PURE__ */ jsx(Check, { className: cn("me-2 size-4", field.value === s.id ? "opacity-100" : "opacity-0") }), /* @__PURE__ */ jsxs("div", {
												className: "flex-1",
												children: [/* @__PURE__ */ jsx("div", {
													className: "text-sm",
													children: s.name
												}), /* @__PURE__ */ jsx("div", {
													className: "text-xs text-muted-foreground",
													children: s.address
												})]
											})]
										}, s.id)) })] })] })
									})]
								})
							}),
							form.formState.errors.supermarketId && /* @__PURE__ */ jsx("p", {
								className: "mt-2 text-xs text-destructive",
								children: form.formState.errors.supermarketId.message
							})
						]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "surface-card p-5",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "mb-3 flex items-center gap-2",
								children: [/* @__PURE__ */ jsx("span", {
									className: "flex size-6 items-center justify-center rounded-full bg-brand text-xs font-bold text-brand-foreground",
									children: "2"
								}), /* @__PURE__ */ jsx("h2", {
									className: "text-sm font-semibold",
									children: "Articles"
								})]
							}),
							/* @__PURE__ */ jsx("div", {
								className: "space-y-3",
								children: /* @__PURE__ */ jsx(AnimatePresence, {
									initial: false,
									children: fields.map((field, idx) => /* @__PURE__ */ jsx(motion.div, {
										initial: {
											opacity: 0,
											height: 0
										},
										animate: {
											opacity: 1,
											height: "auto"
										},
										exit: {
											opacity: 0,
											height: 0
										},
										transition: { duration: .22 },
										className: "overflow-hidden",
										children: /* @__PURE__ */ jsxs("div", {
											className: "rounded-xl border border-border p-3 space-y-3",
											children: [
												/* @__PURE__ */ jsxs("div", {
													className: "flex items-center justify-between",
													children: [/* @__PURE__ */ jsxs("span", {
														className: "text-xs font-medium text-muted-foreground",
														children: ["#", idx + 1]
													}), fields.length > 1 && /* @__PURE__ */ jsx("button", {
														type: "button",
														onClick: () => remove(idx),
														className: "text-muted-foreground hover:text-destructive",
														children: /* @__PURE__ */ jsx(Trash2, { className: "size-4" })
													})]
												}),
												/* @__PURE__ */ jsx(Controller, {
													control: form.control,
													name: `items.${idx}.productId`,
													render: ({ field }) => /* @__PURE__ */ jsxs(Select, {
														value: field.value,
														onValueChange: (v) => {
															field.onChange(v);
															const p = products.find((x) => x.id === v);
															if (p) form.setValue(`items.${idx}.unitPrice`, p.basePrice);
														},
														children: [/* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: t("common.product") }) }), /* @__PURE__ */ jsx(SelectContent, { children: products.map((p) => /* @__PURE__ */ jsx(SelectItem, {
															value: p.id,
															children: p.name
														}, p.id)) })]
													})
												}),
												/* @__PURE__ */ jsxs("div", {
													className: "grid grid-cols-2 gap-2",
													children: [/* @__PURE__ */ jsxs("div", {
														className: "space-y-1",
														children: [/* @__PURE__ */ jsx(Label, {
															className: "text-xs",
															children: t("common.quantity")
														}), /* @__PURE__ */ jsx(Input, {
															type: "number",
															min: 1,
															...form.register(`items.${idx}.quantity`)
														})]
													}), /* @__PURE__ */ jsxs("div", {
														className: "space-y-1",
														children: [/* @__PURE__ */ jsx(Label, {
															className: "text-xs",
															children: t("common.unitPrice")
														}), /* @__PURE__ */ jsx(Input, {
															type: "number",
															step: "0.01",
															min: 0,
															...form.register(`items.${idx}.unitPrice`)
														})]
													})]
												})
											]
										})
									}, field.id))
								})
							}),
							/* @__PURE__ */ jsxs(Button, {
								type: "button",
								variant: "outline",
								className: "mt-3 w-full",
								onClick: () => append({
									productId: "",
									quantity: 1,
									unitPrice: 0
								}),
								children: [/* @__PURE__ */ jsx(Plus, { className: "size-4 me-2" }), t("common.addProduct")]
							})
						]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "surface-card p-5",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "mb-3 flex items-center gap-2",
								children: [/* @__PURE__ */ jsx("span", {
									className: "flex size-6 items-center justify-center rounded-full bg-brand text-xs font-bold text-brand-foreground",
									children: "3"
								}), /* @__PURE__ */ jsx("h2", {
									className: "text-sm font-semibold",
									children: t("common.initialPayment")
								})]
							}),
							/* @__PURE__ */ jsx(Input, {
								type: "number",
								step: "0.01",
								min: 0,
								...form.register("initialPayment")
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "mt-3 flex items-center justify-between text-xs",
								children: [/* @__PURE__ */ jsx("span", {
									className: "text-muted-foreground",
									children: "Restant après paiement"
								}), /* @__PURE__ */ jsx("span", {
									className: "font-semibold",
									children: formatMoney(remaining, i18n.language)
								})]
							})
						]
					})
				]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "fixed inset-x-0 bottom-0 z-30 border-t border-border bg-brand text-brand-foreground",
				children: /* @__PURE__ */ jsxs("div", {
					className: "mx-auto flex max-w-md items-center justify-between gap-3 px-4 py-4",
					children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
						className: "text-xs uppercase tracking-wider text-white/70",
						children: t("common.total")
					}), /* @__PURE__ */ jsx("div", {
						className: "text-2xl font-bold",
						children: formatMoney(total, i18n.language)
					})] }), /* @__PURE__ */ jsxs(Button, {
						form: "deal-form",
						type: "submit",
						size: "lg",
						disabled: mutation.isPending,
						className: "h-12 rounded-2xl bg-white text-brand hover:bg-white/90",
						children: [mutation.isPending && /* @__PURE__ */ jsx(Loader2, { className: "size-4 me-2 animate-spin" }), t("common.confirmDeal")]
					})]
				})
			})
		]
	});
}
//#endregion
export { NewDealPage as component };
