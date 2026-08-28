"use client";
import Link from "next/link";
import { Pencil, Eye } from "lucide-react";
import DonutChart from "@/components/nonprofit-admin/DonutChart";
import { useLang } from "@/contexts/LanguageContext";
import { formatNIS } from "@/lib/mock-data";
import { useNgoAdminView } from "@/hooks/useNgoAdminView";
import AdminDataStatus from "@/components/nonprofit-admin/AdminDataStatus";
import EditableText from "@/components/admin/EditableText";

export default function CampaignsGridPage() {
  const { lang } = useLang();
  const { data, loading, error, reload } = useNgoAdminView();

  if (loading || error) return <AdminDataStatus loading={loading} error={error} reload={reload} />;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6"><EditableText tKey="adm.campaignsGridTitle" /></h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {(data?.adminCampaignCards ?? []).map((c) => (
          <div key={c.id} className="bg-white rounded-2xl p-4 relative">
            <div className="absolute top-4 end-4 flex flex-col gap-2">
              <Link href={`/nonprofit/create-campaign?edit=${c.id}`} className="micro-hint w-11 h-11 rounded-full bg-raz-teal/10 text-raz-teal flex items-center justify-center hover:bg-raz-teal/20" aria-label={lang === "en" ? `Edit ${c.titleEn}` : `עריכת ${c.title}`}>
                <Pencil size={13} aria-hidden="true" />
              </Link>
              <Link href={`/campaign/${c.id}`} className="micro-hint w-11 h-11 rounded-full bg-raz-teal/10 text-raz-teal flex items-center justify-center hover:bg-raz-teal/20" aria-label={lang === "en" ? `View ${c.titleEn}` : `צפייה ב${c.title}`}>
                <Eye size={13} aria-hidden="true" />
              </Link>
            </div>
            <div className="w-24 h-24 rounded-xl bg-gray-50 flex items-center justify-center text-5xl mb-3">
              {c.emoji}
            </div>
            <h3 className="font-bold text-gray-800 mb-1">{lang === "en" ? c.titleEn : c.title}</h3>
            <p className="text-xs text-gray-500 mb-1">{lang === "en" ? "Total donations to this campaign:" : "סה\"כ תרומות לקמפיין זה:"}</p>
            <DonutChart
              filled={c.raised}
              total={c.goal}
              centerValue={formatNIS(c.goal)}
              filledLabel={formatNIS(c.raised)}
              remainingLabel={formatNIS(c.goal - c.raised)}
            />
            <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-2">
              <span className={`w-2 h-2 rounded-full ${c.ended ? "bg-gray-300" : "bg-raz-success"}`} />
              {c.ended
                ? (lang === "en" ? `Ended on ${c.endDate}` : `הסתיים בתאריך ${c.endDate}`)
                : (lang === "en" ? `Ends on ${c.endDate}` : `מסתיים בתאריך ${c.endDate}`)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
