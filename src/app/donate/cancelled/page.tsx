import Link from "next/link";

export default function CancelledDonationPage() {
  return <main className="min-h-screen bg-raz-surface px-6 py-20 text-center">
    <div className="mx-auto max-w-md rounded-2xl bg-white p-8">
      <h1 className="text-2xl font-bold text-gray-800">התשלום לא הושלם</h1>
      <p className="mt-3 text-gray-500">לא נרשמה תרומה ב־Impactify. אם מופיע חיוב בחשבון, אין לנסות שוב לפני בדיקה מול העמותה.</p>
      <Link href="/" className="mt-6 block rounded-xl bg-raz-teal py-3 font-bold text-white">חזרה לאתר</Link>
    </div>
  </main>;
}
