"use client";
import { useEffect, useState } from "react";
import { CreditCard, Plus, X, Pencil } from "lucide-react";
import {
  getDonorProfile, updateDonorProfile,
  getPaymentMethods, addPaymentMethod, removePaymentMethod,
  type DonorProfile,
} from "@/lib/supabase/queries-profile";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  t: (k: string) => string;
}

const MOCK_PROFILE: DonorProfile = {
  fullName: "", phone: "", email: "", idNumber: "", joinDate: "",
};

const CARD_BRANDS = ["Visa", "Mastercard", "Isracard", "Amex"];

export default function ProfilePanel({ t }: Props) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<DonorProfile>(MOCK_PROFILE);
  const [paymentMethods, setPaymentMethods] = useState<Awaited<ReturnType<typeof getPaymentMethods>>>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(MOCK_PROFILE);
  const [addingCard, setAddingCard] = useState(false);
  const [newBrand, setNewBrand] = useState(CARD_BRANDS[0]);
  const [newLast4, setNewLast4] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    getDonorProfile(user.id).then((p) => { setProfile(p); setForm(p); });
    getPaymentMethods(user.id).then(setPaymentMethods);
  }, [user]);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    const ok = await updateDonorProfile(user.id, {
      fullName: form.fullName, phone: form.phone, idNumber: form.idNumber,
    });
    setSaving(false);
    if (ok) {
      setProfile(form);
      setEditing(false);
    }
  }

  async function handleAddCard() {
    if (!user || newLast4.length !== 4) return;
    const added = await addPaymentMethod(user.id, newBrand, newLast4);
    if (added) setPaymentMethods((pms) => [added, ...pms]);
    setAddingCard(false);
    setNewLast4("");
  }

  async function handleRemoveCard(id: string) {
    if (!user) return;
    const ok = await removePaymentMethod(user.id, id);
    if (ok) setPaymentMethods((pms) => pms.filter((pm) => pm.id !== id));
  }

  const fields: Array<{ key: keyof DonorProfile; label: string; editable: boolean }> = [
    { key: "fullName", label: t("myProf.fullName"), editable: true },
    { key: "phone", label: t("myProf.phone"), editable: true },
    { key: "email", label: t("myProf.email"), editable: false },
    { key: "idNumber", label: t("myProf.idNumber"), editable: true },
    { key: "joinDate", label: t("myProf.joinDate"), editable: false },
  ];

  return (
    <div className="mb-24 max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-3xl font-bold text-gray-800">{t("myProf.title")}</h1>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-raz-teal text-sm font-bold hover:underline"
          >
            <Pencil size={14} />
            {t("myProf.edit")}
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl p-5 mb-5">
        <h2 className="font-bold text-gray-700 mb-4">{t("myProf.personalDetails")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map(({ key, label, editable }) => (
            <div key={key}>
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              {editing && editable ? (
                <input
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-raz-teal"
                />
              ) : (
                <p className="text-sm font-medium text-gray-800" dir={key === "email" ? "ltr" : undefined}>
                  {profile[key] || "—"}
                </p>
              )}
            </div>
          ))}
        </div>

        {editing && (
          <div className="flex gap-3 mt-5">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-raz-teal text-white text-sm font-bold px-5 py-2 rounded-xl hover:bg-teal-500 transition-colors disabled:opacity-50"
            >
              {t("myProf.save")}
            </button>
            <button
              onClick={() => { setForm(profile); setEditing(false); }}
              className="text-gray-500 text-sm font-medium px-5 py-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {t("myProf.cancel")}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-5">
        <h2 className="font-bold text-gray-700 mb-4">{t("myProf.paymentMethods")}</h2>
        <div className="flex flex-col gap-2">
          {paymentMethods.map((pm) => (
            <div key={pm.id} className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-gray-400" />
                <span className="text-sm font-medium" dir="ltr">{pm.brand} •••• {pm.last4}</span>
              </div>
              <button
                onClick={() => handleRemoveCard(pm.id)}
                className="text-gray-400 hover:text-red-500 text-xs font-medium"
              >
                {t("myProf.removePaymentMethod")}
              </button>
            </div>
          ))}
        </div>

        {addingCard ? (
          <div className="flex items-end gap-3 mt-4 flex-wrap">
            <div>
              <p className="text-xs text-gray-400 mb-1">{t("myProf.cardBrand")}</p>
              <select
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-raz-teal"
              >
                {CARD_BRANDS.map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">{t("myProf.last4")}</p>
              <input
                value={newLast4}
                onChange={(e) => setNewLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
                dir="ltr"
                maxLength={4}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-24 focus:outline-none focus:border-raz-teal"
              />
            </div>
            <button
              onClick={handleAddCard}
              disabled={newLast4.length !== 4}
              className="bg-raz-teal text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-teal-500 transition-colors disabled:opacity-50"
            >
              {t("myProf.save")}
            </button>
            <button onClick={() => setAddingCard(false)} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAddingCard(true)}
            className="w-full border border-dashed border-gray-300 rounded-xl py-2.5 text-sm text-gray-500 hover:border-raz-teal hover:text-raz-teal flex items-center justify-center gap-2 mt-4 transition-colors"
          >
            <Plus size={15} />
            {t("myProf.addPaymentMethod")}
          </button>
        )}
      </div>
    </div>
  );
}
