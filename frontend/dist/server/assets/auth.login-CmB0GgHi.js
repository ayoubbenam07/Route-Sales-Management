import { t as useAuth } from "./auth-Dgc-H9Jh.js";
import { l as login } from "./api-Bc9u_B1E.js";
import { t as Button } from "./button-Bq5vK6RO.js";
import { n as Input, t as Label } from "./label-B7oQAA24.js";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
//#region src/routes/auth.login.tsx?tsr-split=component
var schema = z.object({
	phone: z.string().min(6),
	password: z.string().min(6)
});
function LoginPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const login$1 = useAuth((s) => s.login);
	const [role, setRole] = useState("ADMIN");
	const [submitting, setSubmitting] = useState(false);
	const form = useForm({
		resolver: zodResolver(schema),
		defaultValues: {
			phone: "",
			password: ""
		}
	});
	const onSubmit = async (data) => {
		setSubmitting(true);
		try {
			const user = await login({
				phone: data.phone,
				password: data.password
			});
			login$1(user);
			navigate({ to: user.role === "ADMIN" ? "/admin/dashboard" : "/buyer/dashboard" });
		} catch (err) {
			toast.error(err.response?.data?.message || "Erreur de connexion");
		} finally {
			setSubmitting(false);
		}
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "surface-card p-8",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "mb-6 text-center",
			children: [
				/* @__PURE__ */ jsx("div", {
					className: "mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-brand text-brand-foreground font-bold",
					children: "R"
				}),
				/* @__PURE__ */ jsx("h1", {
					className: "text-2xl font-bold text-foreground",
					children: t("brand")
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: t("auth.subtitle")
				})
			]
		}), /* @__PURE__ */ jsxs("form", {
			onSubmit: form.handleSubmit(onSubmit),
			className: "space-y-4",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "space-y-2",
					children: [
						/* @__PURE__ */ jsx(Label, {
							htmlFor: "phone",
							children: t("auth.phone")
						}),
						/* @__PURE__ */ jsx(Input, {
							id: "phone",
							placeholder: "0612-345-678",
							...form.register("phone")
						}),
						form.formState.errors.phone && /* @__PURE__ */ jsx("p", {
							className: "text-xs text-destructive",
							children: form.formState.errors.phone.message
						})
					]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "space-y-2",
					children: [
						/* @__PURE__ */ jsx(Label, {
							htmlFor: "password",
							children: t("auth.password")
						}),
						/* @__PURE__ */ jsx(Input, {
							id: "password",
							type: "password",
							placeholder: "••••••",
							...form.register("password")
						}),
						form.formState.errors.password && /* @__PURE__ */ jsx("p", {
							className: "text-xs text-destructive",
							children: form.formState.errors.password.message
						})
					]
				}),
				/* @__PURE__ */ jsxs(Button, {
					type: "submit",
					disabled: submitting,
					className: "w-full",
					size: "lg",
					children: [submitting && /* @__PURE__ */ jsx(Loader2, { className: "me-2 size-4 animate-spin" }), t("auth.signIn")]
				})
			]
		})]
	});
}
//#endregion
export { LoginPage as component };
