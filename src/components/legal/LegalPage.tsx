import Link from "next/link";

type Props = {
  title: string;
  updated: string;
  children: React.ReactNode;
};

export default function LegalPage({ title, updated, children }: Props) {
  return (
    <main className="min-h-screen bg-raz-surface px-6 py-12" dir="rtl">
      <article className="mx-auto max-w-3xl rounded-3xl bg-white p-7 shadow-sm md:p-10">
        <Link href="/landing" className="text-sm font-bold text-raz-teal hover:underline">← חזרה לדף הבית</Link>
        <h1 className="mt-6 text-3xl font-black text-raz-dark md:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-gray-500">עודכן לאחרונה: {updated}</p>
        <div className="legal-content mt-8 space-y-7 text-[15px] leading-7 text-gray-700">{children}</div>
      </article>
    </main>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="mb-2 text-xl font-extrabold text-raz-dark">{title}</h2>{children}</section>;
}
