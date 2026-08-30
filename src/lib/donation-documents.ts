type DonationReceipt = {
  id: string;
  date: string;
  amount: number;
  type: string;
  paymentLast4: string;
};

type DonationProduct = {
  productName: string;
  productNameEn: string;
  orgName: string;
  orgCode: string;
  lastDonationAmount: number;
  lastDonationDate: string;
  receipts: DonationReceipt[];
};

export type TaxDonationRecord = {
  id: string;
  date: string;
  amount: number;
  receiptId: string;
  organization: string;
};

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
})[character] ?? character);

function downloadHtml(filename: string, title: string, body: string) {
  const content = `<!doctype html><html lang="he" dir="rtl"><meta charset="utf-8"><title>${escapeHtml(title)}</title><body style="font-family:Arial,sans-serif;padding:36px;color:#162033;line-height:1.6"><h1>${escapeHtml(title)}</h1>${body}</body></html>`;
  const url = URL.createObjectURL(new Blob([content], { type: "text/html;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

const currency = (amount: number) => `₪${amount.toLocaleString("he-IL")}`;

export function downloadDonationCertificate(product: DonationProduct) {
  downloadHtml(
    `impactify-certificate-${Date.now()}.html`,
    "תעודת הוקרה על תרומה",
    `<p>תודה על התרומה ל${escapeHtml(product.productName)}.</p><p>העמותה: <strong>${escapeHtml(product.orgName)}</strong></p><p>התרומה האחרונה: <strong>${currency(product.lastDonationAmount)}</strong> בתאריך ${escapeHtml(product.lastDonationDate)}.</p><hr><p style="color:#667085">תעודה זו היא הוקרה מטעם Impactify ואינה קבלה חשבונאית.</p>`,
  );
}

export function downloadDonationReceipt(product: DonationProduct, receipt: DonationReceipt) {
  downloadHtml(
    `impactify-receipt-${receipt.id}.html`,
    "אישור תרומה",
    `<p>מספר אישור: <strong>${escapeHtml(receipt.id)}</strong></p><p>עמותה: ${escapeHtml(product.orgName)} (${escapeHtml(product.orgCode)})</p><p>מוצר: ${escapeHtml(product.productName)}</p><p>סכום: <strong>${currency(receipt.amount)}</strong></p><p>תאריך: ${escapeHtml(receipt.date)}</p><p>אמצעי תשלום: ••••${escapeHtml(receipt.paymentLast4)}</p><hr><p style="color:#667085">מסמך זה הוא אישור תרומה מהפלטפורמה. קבלה רשמית זמינה מהעמותה או מספק הסליקה שלה.</p>`,
  );
}

export function downloadDonationReceipts(product: DonationProduct) {
  const rows = product.receipts.map((receipt) => `<tr><td>${escapeHtml(receipt.date)}</td><td>${escapeHtml(receipt.id)}</td><td>${currency(receipt.amount)}</td><td>${escapeHtml(receipt.type)}</td></tr>`).join("");
  downloadHtml(
    `impactify-receipts-${Date.now()}.html`,
    "ריכוז אישורי תרומה",
    `<p>עמותה: ${escapeHtml(product.orgName)}</p><p>מוצר: ${escapeHtml(product.productName)}</p><table style="border-collapse:collapse;width:100%"><thead><tr><th>תאריך</th><th>מספר אישור</th><th>סכום</th><th>סוג</th></tr></thead><tbody>${rows}</tbody></table><style>th,td{border:1px solid #d9dee6;padding:8px;text-align:right}th{background:#f4f7f9}</style>`,
  );
}

export function downloadTaxDonationReport(year: string, donations: TaxDonationRecord[]) {
  const records = donations.filter((donation) => !year || donation.date.includes(year));
  const total = records.reduce((sum, donation) => sum + donation.amount, 0);
  const rows = records.map((donation) => `<tr><td>${escapeHtml(donation.date)}</td><td>${escapeHtml(donation.organization)}</td><td>${escapeHtml(donation.receiptId)}</td><td>${currency(donation.amount)}</td></tr>`).join("");

  downloadHtml(
    `impactify-tax-donations-${year || "all"}.html`,
    `ריכוז תרומות לשנת ${year || "כל השנים"}`,
    `<p>סך התרומות שנמצאו: <strong>${currency(total)}</strong></p><table style="border-collapse:collapse;width:100%"><thead><tr><th>תאריך</th><th>עמותה</th><th>מספר אישור</th><th>סכום</th></tr></thead><tbody>${rows || "<tr><td colspan='4'>לא נמצאו תרומות לשנה שנבחרה.</td></tr>"}</tbody></table><style>th,td{border:1px solid #d9dee6;padding:8px;text-align:right}th{background:#f4f7f9}</style><p style="color:#667085">הזכאות לזיכוי מס תלויה, בין היתר, באישור סעיף 46 של העמותה ובנתונים האישיים של התורם.</p>`,
  );
}
