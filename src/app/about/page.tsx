import LegalPage from "@/components/legal/LegalPage";

export default function AboutPage() {
  return <LegalPage
    he={{ title: "אודות Impactify", updated: "30.08.2026", intro: "Impactify מחברת בין אנשים, קהילות ועמותות סביב עשייה חברתית. מטרת הפלטפורמה היא לאפשר גילוי של קמפיינים, תרומה פשוטה ושקיפות טובה יותר לגבי פעילות העמותות והקהילות.", sections: [
      { title: "איך זה עובד", body: "עמותות מציגות קמפיינים ומוצרים, קהילות יכולות להתחבר לקמפיינים באישור העמותה, ותורמים יכולים לבחור מטרה ולעקוב אחר התרומות שלהם. פרטי כל קמפיין, לרבות העמותה המקבלת, מופיעים בעמוד הקמפיין." },
      { title: "שקיפות ואחריות", body: "אנחנו מעודדים הצגת מידע ברור, אך העמותה היא האחראית המלאה למידע שהיא מפרסמת, לקבלת התרומות ולשימוש בכספים. לשאלות על קמפיין מסוים יש לפנות לעמותה המופיעה בו; לשאלות על השימוש בפלטפורמה — אלינו דרך טופס צור קשר." },
    ] }}
    en={{ title: "About Impactify", updated: "30 August 2026", intro: "Impactify connects people, communities and nonprofits around social impact. The platform is designed to make campaigns discoverable, donations simple and nonprofit and community activity more transparent.", sections: [
      { title: "How it works", body: "Nonprofits present campaigns and products; communities can connect to campaigns with nonprofit approval; and donors can choose a cause and follow their donations. Each campaign page identifies the receiving nonprofit." },
      { title: "Transparency and responsibility", body: "We encourage clear information, but each nonprofit remains fully responsible for the information it publishes, receiving donations and using funds. For a question about a specific campaign, contact the nonprofit shown on it; for questions about using the platform, contact us through the Contact us form." },
    ] }}
  />;
}
