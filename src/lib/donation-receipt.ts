type DonationConfirmation = {
  receiptId: string;
  amount: number;
  date: string;
  campaign: string;
  organization: string;
  receiptUrl?: string | null;
};

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ?? character);

export function downloadDonationConfirmation(details: DonationConfirmation) {
  if (details.receiptUrl) {
    window.open(details.receiptUrl, "_blank", "noopener,noreferrer");
    return;
  }

  const content = `<!doctype html><html lang="he" dir="rtl"><meta charset="utf-8"><title>אישור תרומה</title><body style="font-family:Arial,sans-serif;padding:36px;color:#162033"><h1>אישור תרומה</h1><p>מספר אישור: <strong>${escapeHtml(details.receiptId)}</strong></p><p>עמותה: ${escapeHtml(details.organization)}</p><p>קמפיין: ${escapeHtml(details.campaign)}</p><p>סכום: ₪${details.amount.toLocaleString("he-IL")}</p><p>תאריך: ${escapeHtml(details.date)}</p><hr><p style="color:#667085">מסמך זה הוא אישור תרומה מהפלטפורמה. קבלה חשבונאית רשמית זמינה לאחר חיבור ספק סליקה.</p></body></html>`;
  const url = URL.createObjectURL(new Blob([content], { type: "text/html;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `donation-confirmation-${details.receiptId}.html`;
  anchor.click();
  URL.revokeObjectURL(url);
}
