"use client";
import { useLang } from "@/contexts/LanguageContext";

export default function NgoUpdatesPage() {
  const { lang } = useLang();
  return <div><h1 className="text-3xl font-bold text-gray-800 mb-6">{lang === "en" ? "Updates" : "עדכונים"}</h1>
    <div className="bg-white rounded-2xl p-10 text-center"><p className="font-bold text-gray-800 mb-2">{lang === "en" ? "No persisted updates yet" : "אין עדכונים שמורים עדיין"}</p>
      <p className="text-sm text-gray-500">{lang === "en" ? "Update automation will be enabled after its database model is added." : "אוטומציית עדכונים תופעל לאחר הוספת מודל הנתונים שלה."}</p></div></div>;
}
