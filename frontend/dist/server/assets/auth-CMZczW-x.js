import { t as LanguageToggle } from "./LanguageToggle-Cg9Rvf1b.js";
import { Outlet } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { motion } from "framer-motion";
//#region src/routes/auth.tsx?tsr-split=component
function AuthLayout() {
	return /* @__PURE__ */ jsxs("div", {
		className: "relative min-h-screen w-full overflow-hidden bg-background",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "pointer-events-none absolute inset-0 -z-10",
				children: [/* @__PURE__ */ jsx("div", { className: "absolute -top-32 start-1/2 size-[640px] -translate-x-1/2 rounded-full bg-brand-soft blur-3xl opacity-60" }), /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 end-0 size-[420px] rounded-full bg-brand/10 blur-3xl" })]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "absolute top-4 end-4",
				children: /* @__PURE__ */ jsx(LanguageToggle, {})
			}),
			/* @__PURE__ */ jsx("div", {
				className: "flex min-h-screen items-center justify-center px-4 py-12",
				children: /* @__PURE__ */ jsx(motion.div, {
					initial: {
						opacity: 0,
						y: 16
					},
					animate: {
						opacity: 1,
						y: 0
					},
					transition: {
						duration: .4,
						ease: "easeOut"
					},
					className: "w-full max-w-md",
					children: /* @__PURE__ */ jsx(Outlet, {})
				})
			})
		]
	});
}
//#endregion
export { AuthLayout as component };
