"use client";

import { useEffect, useState } from "react";
import { Download, HeartHandshake } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { getMyDonations } from "@/lib/supabase/queries-donations";
import { formatNIS } from "@/lib/mock-data";

type Donations = Awaited<ReturnType<typeof getMyDonations>>;

export default function DonorProfileActivity({ userId }: { userId: string }) {
  const { lang } = useLang();
  const [donations, setDonations] = useState<Donations>([]);

  useEffect(() => { getMyDonations(userId).then(setDonations); }, [userId]);

  const total = donations.reduce((sum, donation) => sum + donation.amount, 0);
  const campaignCount = new Set(donations.map((donation) => donation.campaignId)).size;

  return (
    <section>
      <div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-sm font-bold text-raz-teal">{lang === "en" ? "Your giving, in one place" : "כל הנתינה שלך במקום אחד"}</p><h2 className="mt-2 text-3xl font-bold text-raz-dark md:text-5xl">{lang === "en" ? "My activity" : "הפעילות שלי"}</h2></div><HeartHandshake className="hidden text-raz-teal/30 sm:block" size={56} aria-hidden="true" /></div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[{ label: lang === "en" ? "Total donated" : "סך התרומות", value: formatNIS(total) }, { label: lang === "en" ? "Donations" : "תרומות", value: String(donations.length) }, { label: lang === "en" ? "Campaigns" : "קמפיינים", value: String(campaignCount) }].map((stat) => <div key={stat.label} className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">{stat.label}</p><p className="mt-2 text-3xl font-bold text-raz-teal font-numeric">{stat.value}</p></div>)}
      </div>
      <div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-sm">
        {donations.length === 0 ? <p className="p-8 text-center text-gray-500">{lang === "en" ? "Your completed donations will appear here." : "התרומות שהושלמו יופיעו כאן."}</p> : donations.map((donation) => <div key={donation.id} className="flex items-center gap-4 border-b border-gray-100 px-5 py-4 last:border-0"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-raz-teal/10 font-bold text-raz-teal">₪</div><div className="min-w-0 flex-1"><p className="truncate font-bold text-gray-800">{lang === "en" ? donation.campaignTitleEn ?? donation.campaignTitle : donation.campaignTitle}</p><p className="mt-0.5 text-sm text-gray-400">{donation.date} · {donation.receiptId}</p></div><p className="font-bold font-numeric">{formatNIS(donation.amount)}</p><button type="button" className="micro-hint text-raz-teal" aria-label={lang === "en" ? "Download receipt" : "הורדת קבלה"}><Download size={17} /></button></div>)}
      </div>
    </section>
  );
}
