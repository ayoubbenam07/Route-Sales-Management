import { Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import type { Deal } from "./types";
import { formatMoney } from "./i18n";
import { Alert } from "@/components/CustomAlert";

function buildHtml(deal: Deal, lang: string) {
  const isAr = (lang || "fr").startsWith("ar");
  const dir = isAr ? "rtl" : "ltr";
  const locale = isAr ? "ar-DZ" : "fr-DZ";
  const fmt = (v: number) => formatMoney(v, lang);
  const date = new Date(deal.createdAt).toLocaleString(locale, {
    dateStyle: "short",
    timeStyle: "short",
  });

  const items = deal.items?.length
    ? deal.items
    : [{ productName: "–", productId: "", quantity: 0, unitPrice: 0 }];

  return `<!DOCTYPE html>
<html dir="${dir}" lang="${isAr ? "ar" : "fr"}">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${isAr ? "إيصال البيع" : "Reçu de vente"} – ${deal.reference}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; }
    body { background: #fff; color: #000; font-size: 12px; padding: 12px; width: 100%; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .row { display: flex; justify-content: space-between; margin-bottom: 6px; gap: 8px; }
    .sep { border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th, td { padding: 6px 2px; font-size: 11px; vertical-align: top; }
    th { border-bottom: 1px dashed #000; text-transform: uppercase; font-size: 10px; }
    .right { text-align: right; }
    .center-col { text-align: center; }
    .brand { font-size: 18px; font-weight: 800; letter-spacing: 0.5px; }
    .sub { font-size: 13px; font-weight: bold; margin-top: 4px; }
    .quote { font-size: 10px; margin-top: 8px; font-style: italic; line-height: 1.35; }
    .footer { text-align: center; margin-top: 14px; border-top: 1px dashed #000; padding-top: 10px; font-size: 11px; }
    .phone { direction: ltr; display: inline-block; font-weight: bold; }
  </style>
</head>
<body>
  <div class="center sep">
    <div class="brand">ANIDEM EXPORT</div>
    <div class="sub">توزيع التمور -تمنراست-</div>
    <div class="quote">"من قلب النخيل إلى قلوبكم، بتمورنا نرافق أفراحكم، ونحكي بطعمها الأصيل حكاية كرم وذوق."</div>
  </div>
  <div class="sep">
    <div class="row"><span>${isAr ? "العميل" : "Client"}:</span><span class="bold">${escapeHtml(deal.supermarketName || "–")}</span></div>
    <div class="row"><span>${isAr ? "البائع" : "Vendeur"}:</span><span class="bold">${escapeHtml(deal.buyerName || "–")}</span></div>
    <div class="row"><span>${isAr ? "التاريخ" : "Date"}:</span><span class="bold">${escapeHtml(date)}</span></div>
    <div class="row"><span>${isAr ? "رقم المرجع" : "Réf"}:</span><span class="bold">${escapeHtml(deal.reference)}</span></div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="text-align:${isAr ? "right" : "left"}">${isAr ? "المنتج" : "Produit"}</th>
        <th class="center-col">${isAr ? "الكمية" : "Qté"}</th>
        <th class="right">${isAr ? "السعر" : "P.U"}</th>
        <th class="right">${isAr ? "المجموع" : "Total"}</th>
      </tr>
    </thead>
    <tbody>
      ${items
        .map(
          (it) => `<tr>
        <td>${escapeHtml(it.productName || it.productId || "–")}</td>
        <td class="center-col">${it.quantity} Kg</td>
        <td class="right">${fmt(it.unitPrice)}</td>
        <td class="right">${fmt(it.quantity * it.unitPrice)}</td>
      </tr>`,
        )
        .join("")}
    </tbody>
  </table>
  <div class="sep">
    <div class="row"><span>${isAr ? "المجموع" : "Total"}:</span><span class="bold">${fmt(deal.total)}</span></div>
    <div class="row"><span>${isAr ? "مدفوع" : "Payé"}:</span><span class="bold">${fmt(deal.paid)}</span></div>
    <div class="row"><span class="bold">${isAr ? "المتبقي" : "Restant"}:</span><span class="bold">${fmt(deal.remaining)}</span></div>
  </div>
  <div class="footer">
    <div>${isAr ? "للتواصل معنا:" : "Pour nous contacter:"}</div>
    <div dir="rtl">علاء الدين: <span class="phone">0657.51.58.94</span></div>
    <div dir="rtl">سعيد: <span class="phone">0657.96.00.69</span></div>
  </div>
</body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Creates a PDF receipt, then opens the native share/print sheet.
 * On Android this is more reliable than printAsync alone (no printer configured).
 */
export async function printReceipt(deal: Deal, lang: string): Promise<void> {
  const isAr = (lang || "fr").startsWith("ar");
  const html = buildHtml(deal, lang);

  try {
    const file = await Print.printToFileAsync({
      html,
      width: 302, // ~80mm thermal width in CSS pixels
      base64: false,
    });

    if (!file?.uri) {
      throw new Error("PDF URI missing");
    }

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(file.uri, {
        mimeType: "application/pdf",
        UTI: "com.adobe.pdf",
        dialogTitle: isAr ? "طباعة / مشاركة الإيصال" : "Imprimer / partager le reçu",
      });
      return;
    }

    // Fallback: system print dialog
    await Print.printAsync({ html, printerUrl: undefined });
  } catch (err) {
    console.error("printReceipt error", err);

    // Last resort: system print dialog without share
    try {
      await Print.printAsync({ html });
      return;
    } catch (printErr) {
      console.error("printAsync fallback failed", printErr);
      Alert.alert(
        isAr ? "خطأ" : "Erreur",
        isAr
          ? "تعذر إنشاء الإيصال. أعد بناء التطبيق ثم حاول مرة أخرى."
          : Platform.OS === "android"
            ? "Impossible d'imprimer. Utilisez Partager depuis le dialogue, ou reconnectez une imprimante."
            : "Impossible d'imprimer le reçu.",
      );
    }
  }
}
