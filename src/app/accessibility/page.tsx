import LegalPage from "@/components/legal/LegalPage";

export default function AccessibilityPage() {
  return <LegalPage
    he={{ title: "הצהרת נגישות", updated: "30.08.2026", intro: "Impactify פועלת לשיפור נגישות השירות לאנשים עם מוגבלות, ובהתאם לעקרונות תקן ישראלי 5568 ברמת AA ככל שהדבר ישים בנסיבות השירות.", sections: [
      { title: "התאמות באתר", body: "האתר כולל תפריט נגישות וכלים כגון שינוי גודל טקסט, ניגודיות והדגשת קישורים. אנו שואפים לאפשר ניווט במקלדת, מבנה כותרות ברור, טקסט חלופי לתמונות משמעותיות ונראות טובה במכשירים שונים." },
      { title: "סיוע ומשוב", body: "ייתכן שחלק מהתוכן שמקורו בעמותות או בצדדים שלישיים עדיין אינו נגיש במלואו. אם נתקלת בקושי, יש לפנות באמצעות טופס „צור קשר” ולציין את כתובת העמוד, סוג הדפדפן ואופי הבעיה. נעשה מאמץ סביר לתת מענה ולהציע חלופה נגישה." },
    ] }}
    en={{ title: "Accessibility Statement", updated: "30 August 2026", intro: "Impactify works to improve accessibility of the service for people with disabilities, in line with the principles of Israeli Standard 5568 at AA level where practicable in the circumstances of the service.", sections: [
      { title: "Website accommodations", body: "The website includes an accessibility menu and tools such as text-size adjustment, high contrast and link highlighting. We aim to support keyboard navigation, clear heading structure, alternative text for meaningful images and usable display across devices." },
      { title: "Help and feedback", body: "Some content originating from nonprofits or third parties may not yet be fully accessible. If you encounter a difficulty, please use the Contact us form and include the page address, browser type and nature of the issue. We will make reasonable efforts to respond and offer an accessible alternative." },
    ] }}
  />;
}
