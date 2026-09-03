const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, LevelFormat, WidthType,
  ShadingType, BorderStyle, ExternalHyperlink, PageNumber,
} = require('C:\\Users\\ofern\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules\\docx');

const out = 'C:\\Users\\ofern\\Documents\\learncode\\donation-platform\\docs\\impactify-ngo-donor-onboarding-guide.docx';
fs.mkdirSync('C:\\Users\\ofern\\Documents\\learncode\\donation-platform\\docs', { recursive: true });

const navy = '101828';
const teal = '10B7B2';
const lightTeal = 'E7FAF8';
const lightGray = 'F4F6F8';
const border = { style: BorderStyle.SINGLE, size: 1, color: 'D8DEE6' };
const borders = { top: border, bottom: border, left: border, right: border };
const width = 9360;

const rtl = (children, options = {}) => new Paragraph({
  bidirectional: true,
  alignment: AlignmentType.RIGHT,
  ...options,
  children,
});
const text = (value, options = {}) => new TextRun({ text: value, font: 'Arial', ...options });
const p = (value, options = {}) => rtl([text(value, options)]);
const bullet = (value) => new Paragraph({
  bidirectional: true,
  alignment: AlignmentType.RIGHT,
  numbering: { reference: 'bullets', level: 0 },
  children: [text(value)],
});
const number = (value) => new Paragraph({
  bidirectional: true,
  alignment: AlignmentType.RIGHT,
  numbering: { reference: 'numbers', level: 0 },
  children: [text(value)],
});
const h1 = (value) => new Paragraph({ heading: HeadingLevel.HEADING_1, bidirectional: true, alignment: AlignmentType.RIGHT, children: [text(value, { bold: true, color: teal })] });
const h2 = (value) => new Paragraph({ heading: HeadingLevel.HEADING_2, bidirectional: true, alignment: AlignmentType.RIGHT, children: [text(value, { bold: true, color: navy })] });
const cell = (value, fill = undefined, bold = false) => new TableCell({
  borders,
  width: { size: 3120, type: WidthType.DXA },
  shading: fill ? { fill, type: ShadingType.CLEAR } : undefined,
  margins: { top: 100, bottom: 100, left: 140, right: 140 },
  children: [rtl([text(value, { bold })])],
});
const row = (a, b, c, header = false) => new TableRow({
  children: [cell(a, header ? teal : undefined, header), cell(b, header ? teal : undefined, header), cell(c, header ? teal : undefined, header)],
});
const table = (headers, rows) => new Table({
  width: { size: width, type: WidthType.DXA },
  columnWidths: [3120, 3120, 3120],
  rows: [row(...headers, true), ...rows.map((r, i) => new TableRow({ children: r.map((v) => new TableCell({
    borders,
    width: { size: 3120, type: WidthType.DXA },
    shading: i % 2 ? { fill: lightGray, type: ShadingType.CLEAR } : undefined,
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    children: [rtl([text(v)])],
  })) }))],
});
const link = (label, url) => new Paragraph({
  bidirectional: true,
  alignment: AlignmentType.RIGHT,
  children: [new ExternalHyperlink({ link: url, children: [text(label, { color: '0563C1', underline: {} })] })],
});

const children = [];
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 900, after: 240 },
  children: [text('Impactify', { bold: true, size: 44, color: teal })],
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  bidirectional: true,
  spacing: { after: 180 },
  children: [text('מדריך הצטרפות, סליקה והסכמות', { bold: true, size: 34, color: navy })],
}));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [text('מסמך עבודה לעמותות ולתורמים', { size: 22, color: '667085' })] }));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 550, after: 550 }, children: [text('גרסה 1.0  |  30 באוגוסט 2026', { size: 20, color: '667085' })] }));
children.push(rtl([text('מטרת המסמך', { bold: true, color: teal })], { shading: { fill: lightTeal, type: ShadingType.CLEAR }, spacing: { before: 250, after: 120 }, indent: { left: 320, right: 320 } }));
children.push(p('המסמך מרכז את הדרישות המעשיות לפני חיבור עמותה ל־Impactify, את פעולות ההפעלה לאחר החיבור, ואת חבילת ההסכמות והגילויים שתורם צריך לקבל. הוא מיועד לתכנון מוצר, תפעול, אבטחה ומשפט. הוא אינו חוות דעת משפטית ואינו מחליף בדיקה של עורך דין ישראלי ושל ספק הסליקה.'));
children.push(new Paragraph({ children: [] }));
children.push(new Paragraph({ children: [] }));
children.push(new Paragraph({ children: [new TextRun({ break: 1 })] }));

children.push(h1('1. עמותה — מה להכין לפני החיבור'));
children.push(p('עמותה צריכה להגיע לחיבור כשהיא יכולה להוכיח מי היא, מי מוסמך לפעול בשמה, לאיזה חשבון מתקבלים הכספים, ואיזה ספק סליקה היא מפעילה.'));
['אישור רישום ופרטי ישות: שם משפטי, מספר עמותה/ח״פ, כתובת, איש קשר ומורשי חתימה.', 'חשבון בנק על שם העמותה והסכם התקשרות עם Cardcom או Grow לקבלת סליקה באינטרנט.', 'מזהה מסוף פעיל, סביבת production, והרשאות API שיימסרו רק לערוץ שרת מאובטח — לא לדפדפן ולא למסד נתונים שנגיש למשתמשים.', 'החלטה מי מפיק קבלות, מי מטפל בהחזרים, מי עונה לפניות תורמים ומהו זמן הטיפול.', 'אישור סעיף 46, אם העמותה מבקשת לאפשר לתורמים הטבת מס, וכן תהליך דיווח ל״תרומות ישראל״.', 'נוסח תקנון תרומות, מדיניות ביטול והחזר, מדיניות פרטיות, מדיניות שמירת מידע ונוסח גילוי תפקיד Impactify.', 'אישור להפעלת token charges והוראות קבע, וכן כתובות callback/webhook שספק הסליקה יאשר.', 'כללי קמפיין: מטרות, סכומי יעד, תאריכים, מוצרים, הגבלת כמות, וכללי שימוש בכספים.'].forEach((v) => children.push(bullet(v)));

children.push(h2('שער יציאה לפני חיבור'));
children.push(table(['בדיקה', 'תוצאה נדרשת', 'בעל אחריות'], [
  ['זהות העמותה', 'מסמכים תואמים וגורם מורשה מזוהה', 'העמותה + Impactify'],
  ['חשבון סליקה', 'המסוף פעיל ומקבל חיוב בדיקה', 'העמותה + הסולק'],
  ['קבלות', 'מספר קבלה, פרטי תורם ודיווח מוגדרים', 'העמותה'],
  ['Webhook', 'אירועי הצלחה, כשל, החזר וביטול מגיעים ונחתמים', 'Impactify + הסולק'],
  ['אבטחה', 'אין PAN/CVV במערכת; נשמר reference/token בלבד', 'Impactify'],
]));

children.push(h1('2. עמותה — מה לבצע בזמן ואחרי החיבור'));
children.push(h2('בזמן החיבור'));
['להיכנס לפרופיל מנהל העמותה ולבחור Cardcom או Grow.', 'להזין מזהה מסוף בלבד ולשמור את הרשומה במצב “נדרש אימות”.', 'להגדיר בצד הספק את כתובות ה־callback וה־webhook של Impactify.', 'להעביר credentials וחתימות webhook למנגנון server-side מאובטח, מחוץ לקוד ולדפדפן.', 'להפעיל, בכפוף להסכם הספק, חיוב token עבור תרומה חוזרת ולתאם את כללי 3DS, כשל וחיוב חוזר.'].forEach((v) => children.push(number(v)));
children.push(h2('אחרי החיבור'));
['לבצע עסקה בסביבת בדיקה ולאמת שסכום, עמותה, קמפיין, תורם וקבלה נקלטו נכון.', 'לאמת webhook מול API של הסולק באופן עצמאי; לא לסמוך על redirect בדפדפן בלבד.', 'להפיק קבלה עבור כל חיוב מוצלח ולשמור מזהה עסקה, סטטוס ואסמכתא.', 'להפעיל את המסוף רק לאחר שכל בדיקות האבטחה, הקבלות, ההחזרים וההתראות עברו.', 'לנטר חיובים שנכשלו, retries, ביטולים והחזרים, ולתעד מי טיפל בכל אירוע.', 'להפיק דוחות לעמותה לפי קמפיין, קהילה, תאריך ואמצעי תשלום; הכספים עצמם מסולקים ישירות לעמותה לפי הסכם הספק.'].forEach((v) => children.push(bullet(v)));
children.push(p('במודל המתוכנן, Impactify מנהלת את חוויית התרומה ואת תזמון החיובים החוזרים, אך אינה מחזיקה כספי עמותות ואינה שומרת פרטי כרטיס. כל חיוב חודשי נשלח בנפרד לספק הסליקה; לא נוצרת התחייבות שנתית מראש, אך כל חיוב כפוף לאישור חברת האשראי.'));

children.push(h1('3. תורם — חבילת ההסכמות בעת תרומה'));
children.push(p('המטרה היא לאפשר לתורם לאשר מראש את כל הפעולות הסבירות שיידרשו בהמשך, בלי להחתים אותו מחדש על כל קבלה או חיוב. עם זאת, הסכמה כללית ובלתי מוגבלת אינה תחליף להסכמה מפורשת לפעולה מהותית חדשה.'));
children.push(h2('אישורים נדרשים במסך התשלום'));
['תנאי התרומה: העמותה, הקמפיין, הסכום, מטרת התרומה והאם נבחר מוצר.', 'עיבוד התשלום: מעבר לעמוד מאובטח של Cardcom/Grow, ללא הזנת PAN או CVV ב־Impactify.', 'שמירת אמצעי תשלום באמצעות token אצל הסולק, לצורך חיובים שהוגדרו ואושרו.', 'הוראת קבע: סכום, תדירות, תאריך התחלה, תאריך סיום או “עד לביטול”, שם העמותה, דרך ביטול וכללי כשל.', 'קבלה ודיווח מס: קבלת קבלה דיגיטלית ומסירת פרטי תורם לצורך דיווח, אם התורם מבקש הטבת מס.', 'מדיניות פרטיות: מטרות השימוש, העברת מידע לעמותה ולסולק, תקופת שמירה וזכויות התורם.', 'דיוור שיווקי: checkbox נפרד, לא מסומן מראש, שאינו תנאי לתרומה.'].forEach((v) => children.push(bullet(v)));

children.push(h2('נוסח מומלץ להוראת קבע'));
children.push(rtl([text('“אני מאשר/ת ל־Impactify, בשם העמותה שנבחרה, לבצע חיוב חוזר בסך ___ ₪ בתדירות חודשית, החל מתאריך ___, עד לתאריך ___ / עד לביטול על ידי. כל חיוב יבוצע בנפרד ובכפוף לאישור חברת האשראי. ניתן לבטל בכל עת דרך האזור האישי או באמצעות שירות הלקוחות.”', { italic: true, color: navy })], { shading: { fill: lightTeal, type: ShadingType.CLEAR }, indent: { left: 320, right: 320 }, spacing: { before: 120, after: 180 } }));
children.push(p('אין להשתמש בנוסח שמאפשר ל־Impactify לחייב “כל סכום בעתיד” או להעביר את התרומה לעמותה אחרת ללא אישור. שינוי משמעותי בסכום, בתדירות, במטרה או בזהות העמותה דורש אישור חדש.'));

children.push(h1('4. תורם — מה קורה אחרי האישור'));
['התורם מקבל אישור עסקה וקבלה עבור כל חיוב מוצלח.', 'באזור האישי מוצגים העמותה, הקמפיין, הסכום, התדירות, מועד החיוב הבא, סטטוס ודרך ביטול.', 'לפני שינוי מהותי נשלחת הודעה ומוצגת בקשת אישור חדשה.', 'בכשל חיוב נשלחת הודעת שירות, מופעל retry לפי מדיניות מתועדת, והתורם יכול לעדכן אמצעי תשלום.', 'ביטול הוראת קבע עוצר חיובים עתידיים ואינו מוחק את היסטוריית התרומות או הקבלות.', 'בקשת החזר נרשמת עם סטטוס, אסמכתא ותיעוד הטיפול; ביצוע ההחזר תלוי בספק הסליקה.'].forEach((v) => children.push(number(v)));

children.push(h1('5. תיעוד, אבטחה ובקרות'));
children.push(table(['מה מתעדים', 'איך', 'מה לא לשמור'], [
  ['הסכמה', 'נוסח, גרסה, זמן, מזהה משתמש, קמפיין ו־IP בהתאם למדיניות', 'לא לשמור צילום כרטיס'],
  ['עסקה', 'מזהה ספק, סכום, סטטוס, קבלה, עמותה וקמפיין', 'לא לשמור PAN או CVV'],
  ['הוראת קבע', 'סכום, cadence, token reference, הבא לחיוב, ביטול וכשלים', 'לא לשמור סוד API בדפדפן'],
  ['Webhook', 'אירוע גולמי מוגן, חתימה, אימות API וניסיון עיבוד', 'לא לסמוך רק על redirect'],
  ['הרשאות', 'גישה לפי תפקיד ועמותה, audit log לשינויים', 'לא להציג token למשתמש'],
]));
children.push(p('המערכת צריכה להציג בבירור מי מקבל את התרומה ומי מפעיל את הסליקה. אם Impactify תעניק שירותי תשלום בעצמה או תחזיק כספים, יש לבדוק מראש את תחולת חוק הסדרת העיסוק בשירותי תשלום והרישוי הנדרש.'));

children.push(h1('6. מקורות רשמיים להמשך בדיקה'));
children.push(link('Cardcom — תיעוד מפתחים ותשלומי token', 'https://www.cardcom.solutions/developers/'));
children.push(link('Grow — Webhooks', 'https://developers.grow.business/docs/webhooks'));
children.push(link('רשות המסים — דיווח תרומות לפי סעיף 46', 'https://www.gov.il/he/service/report-public-institution-receipt-donation'));
children.push(link('הרשות להגנת הפרטיות — עקרונות הסכמה מדעת', 'https://www.gov.il/BlobFolder/legalinfo/consent-2026/he/cpncent-2025.pdf'));
children.push(link('חוק הסדרת העיסוק בשירותי תשלום וייזום תשלום', 'https://main.knesset.gov.il/apps/legislation/main/laws/2206732'));
children.push(new Paragraph({ spacing: { before: 300 }, bidirectional: true, alignment: AlignmentType.RIGHT, children: [text('הערה משפטית: המסמך הוא בסיס דרישות ותפעול. יש לאשר את נוסחי ההסכמה, התקנון, מדיניות הביטול ומדיניות הפרטיות מול עורך דין ישראלי, העמותה וספק הסליקה לפני הפעלה מסחרית.', { bold: true, color: 'B42318' })] }));

const doc = new Document({
  styles: {
    default: { document: { run: { font: 'Arial', size: 22, color: navy } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 32, bold: true, font: 'Arial', color: teal }, paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 26, bold: true, font: 'Arial', color: navy }, paragraph: { spacing: { before: 220, after: 120 }, outlineLevel: 1 } },
    ],
  },
  numbering: {
    config: [
      { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.RIGHT, style: { paragraph: { indent: { left: 360, hanging: 180 } } } }] },
      { reference: 'numbers', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.RIGHT, style: { paragraph: { indent: { left: 360, hanging: 180 } } } }] },
    ],
  },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1200, right: 1440, bottom: 1200, left: 1440 } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [text('Impactify  |  מדריך עמותות ותורמים', { size: 18, color: teal, bold: true })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [text('Impactify  •  עמוד ', { size: 16, color: '667085' }), new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 16, color: '667085' })] })] }) },
    children,
  }],
});

Packer.toBuffer(doc).then((buffer) => fs.writeFileSync(out, buffer));
