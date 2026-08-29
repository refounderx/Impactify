"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { addProfileSpecialDay, getProfileSpecialDays, removeProfileSpecialDay } from "@/lib/supabase/queries-profile";
import type { ProfileSpecialDay } from "@/lib/supabase/queries-profile";

export default function ProfileSpecialDays({ userId }: { userId: string }) {
  const { lang } = useLang();
  const [days, setDays] = useState<ProfileSpecialDay[]>([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [emoji, setEmoji] = useState("🎉");
  const [error, setError] = useState("");

  useEffect(() => { getProfileSpecialDays(userId).then(setDays); }, [userId]);

  async function addDay() {
    if (!title.trim() || !eventDate) { setError(lang === "en" ? "Name and date are required" : "יש למלא שם ותאריך"); return; }
    const saved = await addProfileSpecialDay(userId, title, eventDate, emoji || "🎉");
    if (!saved) { setError(lang === "en" ? "Could not save the special day" : "לא ניתן לשמור את היום המיוחד"); return; }
    setDays((current) => [...current, saved].sort((a, b) => a.eventDate.localeCompare(b.eventDate)));
    setTitle(""); setEventDate(""); setEmoji("🎉"); setError(""); setOpen(false);
  }

  async function removeDay(id: string) {
    if (await removeProfileSpecialDay(userId, id)) setDays((current) => current.filter((day) => day.id !== id));
  }

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-3xl font-bold text-raz-dark md:text-5xl">{lang === "en" ? "My special days" : "הימים המיוחדים שלי"}</h2>
        <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-xl bg-raz-teal px-5 py-3 font-bold text-white hover:bg-teal-600"><Plus size={18} />{lang === "en" ? "Add a special day" : "הוספת יום מיוחד"}</button>
      </div>
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {days.length === 0 ? <div className="p-10 text-center text-gray-500">{lang === "en" ? "No special days yet. Add the first one." : "עדיין לא הוגדרו ימים מיוחדים. אפשר להוסיף את הראשון."}</div> : <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-sm"><thead className="bg-gray-50 text-raz-teal"><tr><th className="px-5 py-4 text-start">{lang === "en" ? "Date" : "תאריך"}</th><th className="px-5 py-4 text-start">{lang === "en" ? "Special day" : "יום מיוחד"}</th><th className="px-5 py-4 text-start">{lang === "en" ? "Type" : "סוג יום"}</th><th className="px-5 py-4 text-start">{lang === "en" ? "Actions" : "פעולות"}</th></tr></thead><tbody>{days.map((day) => <tr key={day.id} className="border-t border-gray-100"><td className="px-5 py-4 font-numeric">{new Date(`${day.eventDate}T00:00:00`).toLocaleDateString(lang === "en" ? "en-GB" : "he-IL")}</td><td className="px-5 py-4 font-bold">{day.title}</td><td className="px-5 py-4 text-2xl">{day.emoji}</td><td className="px-5 py-4"><button type="button" onClick={() => removeDay(day.id)} className="micro-hint text-gray-400 hover:text-red-600" aria-label={lang === "en" ? `Remove ${day.title}` : `הסרת ${day.title}`}><Trash2 size={17} /></button></td></tr>)}</tbody></table></div>}
      </div>
      {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-raz-dark/60 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"><h3 className="text-xl font-bold">{lang === "en" ? "Add a special day" : "הוספת יום מיוחד"}</h3><div className="mt-5 grid gap-4"><label className="text-sm font-medium text-gray-600">{lang === "en" ? "Name" : "שם היום"}<input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 outline-none focus:border-raz-teal" /></label><label className="text-sm font-medium text-gray-600">{lang === "en" ? "Date" : "תאריך"}<input type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 outline-none focus:border-raz-teal" /></label><label className="text-sm font-medium text-gray-600">{lang === "en" ? "Icon" : "סמל"}<input value={emoji} onChange={(event) => setEmoji(event.target.value.slice(0, 16))} className="mt-2 w-24 rounded-xl border border-gray-200 px-3 py-2.5 text-center text-2xl outline-none focus:border-raz-teal" /></label></div>{error && <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>}<div className="mt-6 flex gap-3"><button type="button" onClick={addDay} className="flex-1 rounded-xl bg-raz-teal px-4 py-3 font-bold text-white">{lang === "en" ? "Save" : "שמירה"}</button><button type="button" onClick={() => { setOpen(false); setError(""); }} className="rounded-xl border border-gray-200 px-4 py-3 font-bold text-gray-600">{lang === "en" ? "Cancel" : "ביטול"}</button></div></div></div>}
    </section>
  );
}
