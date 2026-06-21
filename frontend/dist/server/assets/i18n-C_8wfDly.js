import { initReactI18next } from "react-i18next";
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
//#region src/lib/i18n.ts
var resources = {
	fr: { translation: {
		brand: "RouteSales",
		nav: {
			dashboard: "Tableau de bord",
			products: "Produits",
			supermarkets: "Supermarchés",
			deals: "Ventes",
			team: "Équipe",
			clients: "Clients",
			myDeals: "Mes ventes",
			logout: "Déconnexion"
		},
		auth: {
			signIn: "Se connecter",
			phone: "Téléphone",
			password: "Mot de passe",
			adminTab: "Admin",
			buyerTab: "Vendeur",
			welcome: "Bienvenue",
			subtitle: "Plateforme de gestion commerciale itinérante."
		},
		common: {
			total: "Total",
			revenue: "Chiffre d'affaires",
			outstandingDebt: "Dette globale",
			salesThisMonth: "Ventes ce mois",
			debtToCollect: "Dette à recouvrer",
			search: "Rechercher…",
			add: "Ajouter",
			save: "Enregistrer",
			cancel: "Annuler",
			confirm: "Confirmer",
			status: "Statut",
			paid: "Payé",
			partial: "Partiel",
			unpaid: "Impayé",
			newDeal: "Nouvelle vente",
			collect: "Encaisser",
			loading: "Chargement…",
			product: "Produit",
			quantity: "Quantité",
			unitPrice: "Prix unitaire",
			initialPayment: "Paiement initial",
			confirmDeal: "Confirmer la vente",
			addProduct: "Ajouter un produit",
			selectClient: "Sélectionner un client",
			receipt: "Reçu",
			stock: "Stock",
			basePrice: "Prix de base",
			createProduct: "Créer un produit",
			createBuyer: "Créer un vendeur",
			name: "Nom",
			phone: "Téléphone",
			market: "Marché",
			debt: "Dette"
		}
	} },
	ar: { translation: {
		brand: "روت سيلز",
		nav: {
			dashboard: "لوحة التحكم",
			products: "المنتجات",
			supermarkets: "المتاجر",
			deals: "المبيعات",
			team: "الفريق",
			clients: "العملاء",
			myDeals: "مبيعاتي",
			logout: "تسجيل الخروج"
		},
		auth: {
			signIn: "تسجيل الدخول",
			phone: "الهاتف",
			password: "كلمة المرور",
			adminTab: "مسؤول",
			buyerTab: "بائع",
			welcome: "مرحباً",
			subtitle: "منصة إدارة المبيعات الميدانية."
		},
		common: {
			total: "المجموع",
			revenue: "إجمالي الإيرادات",
			outstandingDebt: "إجمالي الديون",
			salesThisMonth: "مبيعات هذا الشهر",
			debtToCollect: "ديون للتحصيل",
			search: "بحث…",
			add: "إضافة",
			save: "حفظ",
			cancel: "إلغاء",
			confirm: "تأكيد",
			status: "الحالة",
			paid: "مدفوع",
			partial: "جزئي",
			unpaid: "غير مدفوع",
			newDeal: "بيع جديد",
			collect: "تحصيل",
			loading: "جارٍ التحميل…",
			product: "المنتج",
			quantity: "الكمية",
			unitPrice: "سعر الوحدة",
			initialPayment: "دفعة أولية",
			confirmDeal: "تأكيد البيع",
			addProduct: "إضافة منتج",
			selectClient: "اختر العميل",
			receipt: "إيصال",
			stock: "المخزون",
			basePrice: "السعر الأساسي",
			createProduct: "إنشاء منتج",
			createBuyer: "إنشاء بائع",
			name: "الاسم",
			phone: "الهاتف",
			market: "المتجر",
			debt: "الدين"
		}
	} }
};
if (!i18n.isInitialized) i18n.use(LanguageDetector).use(initReactI18next).init({
	resources,
	fallbackLng: "fr",
	supportedLngs: ["fr", "ar"],
	interpolation: { escapeValue: false },
	detection: {
		order: ["localStorage", "navigator"],
		caches: ["localStorage"]
	}
});
function applyLocale(lang) {
	if (typeof document === "undefined") return;
	document.documentElement.lang = lang;
	document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
}
function formatMoney(value, lang = i18n.language) {
	const locale = lang === "ar" ? "ar-MA" : "fr-FR";
	return new Intl.NumberFormat(locale, {
		style: "currency",
		currency: "MAD",
		maximumFractionDigits: 2
	}).format(value);
}
var i18n_default = i18n;
//#endregion
export { formatMoney as n, i18n_default as r, applyLocale as t };
