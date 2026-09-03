import LegalPage from "@/components/legal/LegalPage";

export default function CancellationsPage() {
  return <LegalPage
    he={{ title: "ביטול תרומה והחזרים", updated: "30.08.2026", intro: "תרומה שבוצעה באמצעות Impactify מועברת לעמותה שנבחרה. בקשת ביטול או החזר נבדקת בהתאם לנסיבות, לתנאי העמותה, למצב העברת הכספים ולהוראות הדין.", sections: [
      { title: "איך מגישים בקשה", body: "ניתן להגיש בקשה מתוך ניהול התרומות או באמצעות טופס צור קשר. יש לצרף את מזהה התרומה, תאריך, סכום וכתובת דוא״ל ששימשה לתרומה. אנו נאשר את קבלת הבקשה ונעביר אותה לטיפול הגורמים הרלוונטיים." },
      { title: "טיפול בבקשה", body: "כאשר ניתן לבצע החזר, הוא יבוצע בדרך כלל לאמצעי התשלום המקורי. משך הזיכוי תלוי בספק הסליקה ובמנפיק הכרטיס. אם כבר הועברו הכספים לעמותה, ייתכן שנדרש אישור העמותה או שהבקשה לא תאושר. אין בעמוד זה התחייבות להחזר אוטומטי." },
      { title: "תרומה חוזרת וקבלות", body: "ניתן לבטל הוראת קבע לפני החיוב הבא דרך אזור המשתמש או בפנייה אלינו. אם הוצאה קבלה או דווחה תרומה, ביטול או החזר יטופלו גם מול העמותה ובהתאם לחובות הדיווח שלה. במקרה של סתירה, הוראות הדין גוברות." },
    ] }}
    en={{ title: "Donation Cancellations and Refunds", updated: "30 August 2026", intro: "A donation made through Impactify is transferred to the selected nonprofit. A cancellation or refund request is reviewed according to the circumstances, the nonprofit's terms, the status of fund transfer and applicable law.", sections: [
      { title: "How to submit a request", body: "You can submit a request from donation management or through the Contact us form. Include the donation ID, date, amount and email address used for the donation. We will confirm receipt and send the request to the relevant parties." },
      { title: "Handling a request", body: "Where a refund can be made, it will generally be returned to the original payment method. Processing time depends on the payment provider and card issuer. If funds have already been transferred to the nonprofit, its approval may be needed or the request may not be approved. This page does not promise an automatic refund." },
      { title: "Recurring donations and receipts", body: "You can cancel a recurring donation before the next charge through the user area or by contacting us. If a receipt was issued or a donation was reported, cancellation or refund will also be handled with the nonprofit and in line with its reporting obligations. In case of conflict, applicable law prevails." },
    ] }}
  />;
}
