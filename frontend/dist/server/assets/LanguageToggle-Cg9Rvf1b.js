import { r as i18n_default, t as applyLocale } from "./i18n-C_8wfDly.js";
import { t as Button } from "./button-Bq5vK6RO.js";
import { useEffect, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
//#region src/components/LanguageToggle.tsx
function LanguageToggle({ className }) {
	const { i18n: i } = useTranslation();
	const [lang, setLang] = useState(i.language || "fr");
	useEffect(() => {
		applyLocale(lang);
	}, [lang]);
	const toggle = () => {
		const next = lang === "fr" ? "ar" : "fr";
		setLang(next);
		i18n_default.changeLanguage(next);
		applyLocale(next);
	};
	return /* @__PURE__ */ jsxs(Button, {
		type: "button",
		variant: "ghost",
		size: "sm",
		onClick: toggle,
		className,
		children: [/* @__PURE__ */ jsx(Languages, { className: "size-4" }), /* @__PURE__ */ jsx("span", {
			className: "ms-2 text-xs font-medium uppercase tracking-wider",
			children: lang === "fr" ? "FR" : "AR"
		})]
	});
}
//#endregion
export { LanguageToggle as t };
