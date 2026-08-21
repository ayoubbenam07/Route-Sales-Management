import { Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
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
    @page { margin: 0; padding: 0; size: auto; }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; }
    html, body { background: #fff; color: #000; font-size: 16px; padding: 6px; width: 100%; height: max-content; margin: 0; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .row { display: flex; justify-content: space-between; margin-bottom: 4px; gap: 4px; font-size: 15px; }
    .sep { border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; margin: 6px 0; }
    th, td { padding: 4px 2px; font-size: 14px; vertical-align: top; }
    th { border-bottom: 1px dashed #000; text-transform: uppercase; font-size: 12px; font-weight: 800; }
    .right { text-align: right; }
    .center-col { text-align: center; }
    .brand { font-size: 22px; font-weight: 800; letter-spacing: 0.5px; }
    .sub { font-size: 16px; font-weight: bold; margin-top: 3px; }
    .quote { font-size: 13px; margin-top: 5px; font-style: italic; line-height: 1.3; }
    .footer { text-align: center; margin-top: 8px; border-top: 1px dashed #000; padding-top: 6px; font-size: 14px; }
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

/**
 * Estimate the PDF page height in CSS pixels based on content.
 * This avoids a full blank page of whitespace below the receipt.
 */
function estimateHeight(itemCount: number): number {
  const headerBlock = 90;   // brand + subtitle + quote + separator
  const infoBlock = 100;    // 4 info rows + separator
  const tableHeader = 35;   // thead row
  const tableRow = 30;      // each product row
  const totalsBlock = 80;   // total + paid + remaining + separator
  const footerBlock = 70;   // contact info
  const padding = 30;       // body padding + safety margin

  return headerBlock + infoBlock + tableHeader + (itemCount * tableRow) + totalsBlock + footerBlock + padding;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Sanitize a string for use in a filename:
 * remove special chars, replace spaces with underscores.
 */
function sanitizeFilename(str: string): string {
  return str
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "_")
    .substring(0, 40);
}

/**
 * Creates a PDF receipt, then opens the native share/print sheet.
 * On Android this is more reliable than printAsync alone (no printer configured).
 */
export async function printReceipt(deal: Deal, lang: string): Promise<void> {
  const isAr = (lang || "fr").startsWith("ar");
  const html = buildHtml(deal, lang);
  const itemCount = deal.items?.length || 1;
  const pageHeight = estimateHeight(itemCount);

  try {
    const file = await Print.printToFileAsync({
      html,
      width: 220,        // ~58mm thermal paper width in CSS pixels
      height: pageHeight, // dynamic height to fit content snugly
      base64: false,
    });

    if (!file?.uri) {
      throw new Error("PDF URI missing");
    }

    // Rename the PDF to a readable filename
    const clientName = sanitizeFilename(deal.supermarketName || "Client");
    const ref = sanitizeFilename(deal.reference || "");
    const readableName = `Recu_${clientName}_${ref}.pdf`;
    const dir = file.uri.substring(0, file.uri.lastIndexOf("/") + 1);
    const newUri = dir + readableName;

    try {
      // Rename to readable filename
      await FileSystem.moveAsync({ from: file.uri, to: newUri });
      file.uri = newUri;
    } catch {
      // Keep original URI if rename fails
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
