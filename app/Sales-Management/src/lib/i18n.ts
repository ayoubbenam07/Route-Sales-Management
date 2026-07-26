import i18n from "i18next";
import { initReactI18next } from "node_modules/react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

const resources = {
  fr: {
    translation: {
      brand: "RouteSales",
      nav: {
        dashboard: "Tableau de bord",
        products: "Produits",
        supermarkets: "Supermarchés",
        deals: "Ventes",
        team: "Équipe",
        clients: "Clients",
        myDeals: "Mes ventes",
        logout: "Déconnexion",
      },
      auth: {
        signIn: "Se connecter",
        phone: "Téléphone",
        password: "Mot de passe",
        adminTab: "Admin",
        buyerTab: "Vendeur",
        welcome: "Bienvenue",
        subtitle: "Plateforme de gestion commerciale itinérante.",
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
        debt: "Dette",
      },
    },
  },
  ar: {
    translation: {
      brand: "روت سيلز",
      nav: {
        dashboard: "لوحة التحكم",
        products: "المنتجات",
        supermarkets: "المتاجر",
        deals: "المبيعات",
        team: "الفريق",
        clients: "العملاء",
        myDeals: "مبيعاتي",
        logout: "تسجيل الخروج",
      },
      auth: {
        signIn: "تسجيل الدخول",
        phone: "الهاتف",
        password: "كلمة المرور",
        adminTab: "مسؤول",
        buyerTab: "بائع",
        welcome: "مرحباً",
        subtitle: "منصة إدارة المبيعات الميدانية.",
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
        debt: "الدين",
      },
    },
  },
};

const LANG_KEY = "rs-lang";

export async function initI18n() {
  if (i18n.isInitialized) return i18n;
  const saved = await AsyncStorage.getItem(LANG_KEY);
  await i18n.use(initReactI18next).init({
    resources,
    lng: saved === "ar" || saved === "fr" ? saved : "fr",
    fallbackLng: "fr",
    supportedLngs: ["fr", "ar"],
    interpolation: { escapeValue: false },
  });
  return i18n;
}

export async function applyLocale(lang: "fr" | "ar") {
  await AsyncStorage.setItem(LANG_KEY, lang);
  await i18n.changeLanguage(lang);
}

export function formatMoney(value: number, lang: string = i18n.language) {
  const locale = lang === "ar" ? "ar-DZ" : "fr-DZ";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "DZD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default i18n;
