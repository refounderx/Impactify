"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MoreVertical, Search, SlidersHorizontal } from "lucide-react";
import EditableText from "@/components/admin/EditableText";
import AdminDataStatus from "@/components/nonprofit-admin/AdminDataStatus";
import { useLang } from "@/contexts/LanguageContext";
import { useNgoAdminView } from "@/hooks/useNgoAdminView";
import { formatNIS } from "@/lib/mock-data";

const AS_OF = "12/08/23";

export default function CommunitiesPage() {
  const { lang, t } = useLang();
  const { data, loading, error, reload } = useNgoAdminView();
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("all");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const allCommunities = useMemo(() => data?.adminCommunityRows ?? [], [data?.adminCommunityRows]);
  const areas = useMemo(() => [...new Set(allCommunities.map((row) => lang === "en" ? row.activityAreaEn : row.activityArea).filter((value) => value && value !== "—"))], [allCommunities, lang]);
  const communities = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase(lang === "en" ? "en" : "he");
    return allCommunities.filter((row) => {
      const rowArea = lang === "en" ? row.activityAreaEn : row.activityArea;
      const contact = `${row.contactName} ${row.contactPhone}`.toLocaleLowerCase();
      const name = `${row.name} ${row.nameEn}`.toLocaleLowerCase();
      return (area === "all" || rowArea === area) && (!normalized || `${name} ${contact}`.includes(normalized));
    });
  }, [allCommunities, area, lang, query]);

  if (loading || error) return <AdminDataStatus loading={loading} error={error} reload={reload} />;

  return (
    <div className="mx-auto w-full max-w-[1500px] pb-10">
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <EditableText tKey="adm.communitiesTitle" as="h1" className="block text-4xl font-extrabold tracking-tight text-gray-950 lg:text-5xl" />
        <Link href="/nonprofit/updates" className="inline-flex min-h-11 items-center justify-center rounded-full bg-raz-teal px-7 py-3 text-sm font-bold text-white transition-transform hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-raz-teal">
          <EditableText tKey="adm.sendUpdateToManagers" as="span" />
        </Link>
      </div>

      <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.06)]" aria-label={lang === "en" ? "My communities" : "הקהילות שלי"}>
        <div className="flex flex-col border-b border-slate-200 lg:flex-row lg:items-stretch lg:justify-between">
          <div className="flex flex-1 items-center px-6 py-5 lg:px-8">
            <div className="relative w-full max-w-md">
              <Search size={19} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={lang === "en" ? "Search communities or contacts" : "חיפוש קהילה או איש קשר"} className="min-h-11 w-full rounded-full border border-slate-200 bg-slate-50 ps-12 pe-4 text-sm outline-none transition focus:border-raz-teal focus:bg-white focus:ring-2 focus:ring-raz-teal/10" />
            </div>
            <label className="ms-3 flex min-h-11 items-center gap-2 rounded-full border border-slate-200 px-4 text-sm text-slate-600">
              <SlidersHorizontal size={16} className="text-raz-teal" aria-hidden="true" />
              <span className="sr-only">{lang === "en" ? "Activity area" : "אזור פעילות"}</span>
              <select value={area} onChange={(event) => setArea(event.target.value)} className="max-w-40 bg-transparent font-bold outline-none">
                <option value="all">{lang === "en" ? "All activity areas" : "כל אזורי הפעילות"}</option>
                {areas.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
          </div>
          <div className="grid w-full grid-cols-2 border-t border-slate-200 lg:w-auto lg:min-w-[24rem] lg:border-s lg:border-t-0">
            <Metric label={t("adm.affiliatedCommunities")} value={String(data?.adminCommunitiesCount ?? 0)} />
            <Metric label={`${t("adm.communitiesRaisedToDate")} ${AS_OF})`} value={formatNIS(data?.adminCommunitiesTotalRaised ?? 0)} bordered />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-sm" dir={lang === "en" ? "ltr" : "rtl"}>
            <thead className="text-raz-teal">
              <tr className="border-b border-slate-200">
                <Header>{lang === "en" ? "Community name" : "שם הקהילה"}</Header>
                <Header>{lang === "en" ? "Activity area" : "אזור פעילות"}</Header>
                <Header>{lang === "en" ? "Joined" : "תאריך שיוך"}</Header>
                <Header>{lang === "en" ? "Active campaigns" : "קמפיינים פעילים"}</Header>
                <Header>{lang === "en" ? "Products donated" : "מוצרים שנתרמו"}</Header>
                <Header>{lang === "en" ? "Total raised" : "סה״כ גיוסים"}</Header>
                <Header>{lang === "en" ? "Contact" : "איש קשר"}</Header>
                <Header>{lang === "en" ? "Actions" : "פעולות"}</Header>
              </tr>
            </thead>
            <tbody>
              {communities.map((row) => (
                <tr key={row.id} className="border-b border-slate-200 text-slate-700 transition-colors hover:bg-slate-50/80">
                  <td className="whitespace-nowrap px-5 py-5 font-bold text-slate-900">{lang === "en" ? row.nameEn : row.name}</td>
                  <Cell>{lang === "en" ? row.activityAreaEn : row.activityArea}</Cell>
                  <Cell numeric>{row.joinedDate}</Cell><Cell numeric>{row.activeCampaigns}</Cell><Cell numeric>{row.productsSold}</Cell>
                  <td className="whitespace-nowrap px-5 py-5 font-numeric font-bold text-slate-900">{formatNIS(row.totalRaised)}</td>
                  <td className="whitespace-nowrap px-5 py-5" dir="ltr">{row.contactPhone} – {row.contactName}</td>
                  <td className="relative px-5 py-3">
                    <button type="button" onClick={() => setOpenMenu(openMenu === row.id ? null : row.id)} className="micro-hint inline-flex h-11 w-11 items-center justify-center rounded-full bg-raz-teal text-white transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-raz-teal" aria-expanded={openMenu === row.id} aria-label={t("hint.actions")}><MoreVertical size={17} /></button>
                    {openMenu === row.id && <ActionMenu lang={lang} onClose={() => setOpenMenu(null)} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {communities.length === 0 && <p className="px-6 py-14 text-center text-slate-500">{lang === "en" ? "No communities match the current search." : "לא נמצאו קהילות שמתאימות לחיפוש."}</p>}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value, bordered = false }: { label: string; value: string; bordered?: boolean }) {
  return <div className={`flex min-h-28 flex-col justify-center px-6 ${bordered ? "border-s border-slate-200" : ""}`}><span className="text-xs font-bold text-slate-800">{label}</span><span className="mt-1 whitespace-nowrap font-numeric text-4xl font-extrabold text-raz-teal">{value}</span></div>;
}
function Header({ children }: { children: React.ReactNode }) { return <th className="whitespace-nowrap px-5 py-4 text-start text-xs font-bold">{children}</th>; }
function Cell({ children, numeric = false }: { children: React.ReactNode; numeric?: boolean }) { return <td className={`whitespace-nowrap px-5 py-5 ${numeric ? "font-numeric" : ""}`}>{children}</td>; }
function ActionMenu({ lang, onClose }: { lang: "he" | "en"; onClose: () => void }) {
  return <div className="absolute end-14 top-3 z-20 w-44 overflow-hidden rounded-xl border border-slate-100 bg-white py-1 shadow-xl"><Link href="/nonprofit/campaigns" onClick={onClose} className="block px-4 py-2.5 text-start text-sm hover:bg-slate-50">{lang === "en" ? "View campaigns" : "צפייה בקמפיינים"}</Link><Link href="/nonprofit/updates" onClick={onClose} className="block px-4 py-2.5 text-start text-sm hover:bg-slate-50">{lang === "en" ? "Send an update" : "שליחת עדכון"}</Link></div>;
}
