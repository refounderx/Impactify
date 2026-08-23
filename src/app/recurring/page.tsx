"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import BottomNav from "@/components/layout/BottomNav";
import { recurringDonations as mockRecurring, formatNIS } from "@/lib/mock-data";
import { getMyRecurring, updateRecurringStatus, cancelRecurring } from "@/lib/supabase/queries-donations";
import { RotateCcw, PauseCircle, XCircle, Plus, ArrowRight, Calendar, CreditCard } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import EditableText from "@/components/admin/EditableText";

export default function RecurringPage() {
  const { lang } = useLang();
  const { user } = useAuth();
  const [orders, setOrders] = useState(mockRecurring as typeof mockRecurring);
  const [canceling, setCanceling] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getMyRecurring(user.id).then((data) => {
      if (data.length) setOrders(data as typeof mockRecurring);
    });
  }, [user]);

  const totalMonthly = orders
    .filter((o) => o.status === "active")
    .reduce((sum, o) => sum + o.amount, 0);

  async function toggleStatus(id: string) {
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    const newStatus = order.status === "active" ? "paused" as const : "active" as const;
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: newStatus } : o));
    if (user) await updateRecurringStatus(id, newStatus);
  }

  async function cancelOrder(id: string) {
    setOrders((prev) => prev.filter((o) => o.id !== id));
    setCanceling(null);
    if (user) await cancelRecurring(id);
  }

  return (
    <div className="flex flex-col min-h-screen bg-raz-surface">
      {/* Header */}
      <div className="bg-raz-teal px-6 pt-6 pb-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/profile" className="text-white/70 hover:text-white">
              <ArrowRight size={22} />
            </Link>
            <h1 className="text-white font-bold text-2xl"><EditableText tKey="rec.title" /></h1>
          </div>
          <p className="text-teal-100 text-sm"><EditableText tKey="rec.subtitle" /></p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto w-full px-6 -mt-4">

        {/* Monthly summary card */}
        <div className="bg-raz-dark text-white rounded-2xl p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1"><EditableText tKey="rec.total" /></p>
              <p className="text-4xl font-bold font-numeric text-raz-teal">{formatNIS(totalMonthly)}</p>
              <p className="text-gray-400 text-sm mt-1">{orders.filter(o => o.status === "active").length} <EditableText tKey="rec.activeCount" /></p>
            </div>
            <div className="w-16 h-16 bg-raz-teal/20 rounded-2xl flex items-center justify-center">
              <RotateCcw size={32} className="text-raz-teal" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2 text-sm text-gray-400">
            <Calendar size={15} />
            <span><EditableText tKey="rec.nextCharge" /> 01.07.2026</span>
            <span className="mx-2">·</span>
            <CreditCard size={15} />
            <span>Visa •••• 4242</span>
          </div>
        </div>

        {/* Orders list */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center">
            <p className="text-5xl mb-4">🔁</p>
            <p className="font-bold text-gray-700 text-lg mb-1"><EditableText tKey="rec.empty" /></p>
            <p className="text-gray-500 text-sm mb-5"><EditableText tKey="rec.emptySub" /></p>
            <Link href="/" className="bg-raz-teal text-white px-6 py-3 rounded-xl font-medium inline-block">
              <EditableText tKey="donate" />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4 mb-6">
            {orders.map((o) => (
              <div key={o.id} className={`bg-white rounded-2xl overflow-hidden shadow-sm ${o.status === "paused" ? "opacity-60" : ""}`}>
                {/* Campaign header strip */}
                <div className={`bg-gradient-to-r ${o.gradient} h-2`} />

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-gray-50">
                        {o.emoji}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{lang === "en" ? (o.campaignTitleEn ?? o.campaignTitle) : o.campaignTitle}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div
                            className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold"
                            style={{ backgroundColor: o.orgColor }}
                          >
                            {o.orgInitials}
                          </div>
                          <span className="text-sm text-gray-500">{o.orgName}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-end flex-shrink-0">
                      <p className="text-2xl font-bold text-raz-teal font-numeric">{formatNIS(o.amount)}</p>
                      <p className="text-xs text-gray-400"><EditableText tKey="perMonth" /></p>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-3 mb-4 bg-gray-50 rounded-xl p-3 text-sm">
                    <div>
                      <p className="text-gray-400 text-xs mb-0.5"><EditableText tKey="rec.started" /></p>
                      <p className="font-medium text-gray-700">{o.startDate}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-0.5"><EditableText tKey="rec.next" /></p>
                      <p className={`font-medium ${o.status === "active" ? "text-gray-700" : "text-gray-400 line-through"}`}>
                        {o.nextCharge}
                      </p>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      o.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {o.status === "active" ? <EditableText tKey="rec.statusActive" /> : <EditableText tKey="rec.statusPaused" />}
                    </span>

                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleStatus(o.id)}
                        className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                      >
                        <PauseCircle size={15} />
                        {o.status === "active" ? <EditableText tKey="rec.pause" /> : <EditableText tKey="rec.resume" />}
                      </button>
                      <button
                        onClick={() => setCanceling(o.id)}
                        className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50"
                      >
                        <XCircle size={15} /> <EditableText tKey="rec.cancel" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Cancel confirmation inline */}
                {canceling === o.id && (
                  <div className="border-t border-red-100 bg-red-50 px-5 py-4">
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      <EditableText tKey="rec.confirmMsg" /> {formatNIS(o.amount)}/<EditableText tKey="perMonth" /> {lang === "en" ? "for" : "ל"}{lang === "en" ? (o.campaignTitleEn ?? o.campaignTitle) : o.campaignTitle}?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => cancelOrder(o.id)}
                        className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm font-medium"
                      >
                        <EditableText tKey="rec.confirmYes" />
                      </button>
                      <button
                        onClick={() => setCanceling(null)}
                        className="flex-1 bg-white border border-gray-200 text-gray-600 py-2 rounded-lg text-sm"
                      >
                        <EditableText tKey="rec.confirmNo" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add new */}
        <Link
          href="/"
          className="flex items-center justify-center gap-2 border-2 border-dashed border-raz-teal/30 text-raz-teal rounded-2xl py-4 font-medium mb-8 hover:bg-raz-teal/5 transition-colors"
        >
          <Plus size={20} /> <EditableText tKey="rec.add" />
        </Link>
      </div>

      <BottomNav variant="donor" />
    </div>
  );
}
