"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAdminDirectory, updateProfileRole, type AdminDirectory } from "@/lib/supabase/queries-account-admin";
import type { AppRole } from "@/lib/supabase/types";

const ROLE_LABELS: Record<AppRole, string> = {
  donor: "Donor",
  ngo_owner: "NGO owner",
  community_owner: "Community owner",
  admin: "Admin",
};

type Draft = { role: AppRole; orgId: string; communityId: string };

export default function AdminUsersPage() {
  const { profile, signOut } = useAuth();
  const [directory, setDirectory] = useState<AdminDirectory | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  async function load() {
    try {
      const next = await getAdminDirectory();
      setDirectory(next);
      setDrafts(Object.fromEntries(next.profiles.map((item) => [item.id, {
        role: item.app_role, orgId: item.org_id ?? "", communityId: item.community_id ?? "",
      }])));
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load users");
    }
  }

  useEffect(() => {
    let active = true;
    getAdminDirectory().then((next) => {
      if (!active) return;
      setDirectory(next);
      setDrafts(Object.fromEntries(next.profiles.map((item) => [item.id, {
        role: item.app_role, orgId: item.org_id ?? "", communityId: item.community_id ?? "",
      }])));
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : "Unable to load users");
    });
    return () => { active = false; };
  }, []);

  function patchDraft(id: string, patch: Partial<Draft>) {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
  }

  async function save(id: string) {
    const draft = drafts[id];
    if (!draft) return;
    setSavingId(id);
    setError("");
    try {
      await updateProfileRole(id, draft.role, draft.orgId || null, draft.communityId || null);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update role");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-raz-surface p-4 md:p-8" dir="ltr">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-start gap-4 mb-6">
          <div><p className="text-sm text-raz-teal font-bold">Impactify administration</p>
            <h1 className="text-3xl font-bold text-gray-900">Users and roles</h1>
            <p className="text-sm text-gray-500">Signed in as {profile?.email ?? "admin"}</p></div>
          <button onClick={signOut} className="bg-raz-dark text-white px-4 py-2 rounded-xl text-sm">Sign out</button>
        </header>
        {error && <div className="mb-4 rounded-xl bg-red-50 text-red-700 p-3 text-sm" role="alert">{error}</div>}
        {!directory ? <p className="text-gray-500">Loading users…</p> : (
          <div className="bg-white rounded-2xl overflow-x-auto border border-gray-100">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-gray-50 text-left">
                <th className="p-3">User</th><th className="p-3">Role</th><th className="p-3">Tenant</th><th className="p-3">Status</th><th className="p-3" />
              </tr></thead>
              <tbody>{directory.profiles.map((item) => {
                const draft = drafts[item.id];
                const isSelf = item.id === profile?.id;
                return <tr key={item.id} className="border-b last:border-0 align-top">
                  <td className="p-3"><strong className="block text-gray-900">{item.full_name || "Unnamed user"}</strong>
                    <span className="text-gray-500">{item.email ?? "No email"}</span></td>
                  <td className="p-3"><select value={draft?.role ?? item.app_role} disabled={isSelf}
                    onChange={(event) => patchDraft(item.id, { role: event.target.value as AppRole, orgId: "", communityId: "" })}
                    className="border rounded-lg px-2 py-2 bg-white">
                    {(Object.keys(ROLE_LABELS) as AppRole[]).map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
                  </select></td>
                  <td className="p-3">
                    {draft?.role === "ngo_owner" && <select value={draft.orgId} onChange={(event) => patchDraft(item.id, { orgId: event.target.value })}
                      className="border rounded-lg px-2 py-2 bg-white"><option value="">Select NGO</option>
                      {directory.organizations.map((org) => <option key={org.id} value={org.id}>{org.name_en || org.name}</option>)}</select>}
                    {draft?.role === "community_owner" && <select value={draft.communityId} onChange={(event) => patchDraft(item.id, { communityId: event.target.value })}
                      className="border rounded-lg px-2 py-2 bg-white"><option value="">Select community</option>
                      {directory.communities.map((community) => <option key={community.id} value={community.id}>{community.name_en || community.name}</option>)}</select>}
                    {(draft?.role === "donor" || draft?.role === "admin") && <span className="text-gray-400">No tenant</span>}
                  </td>
                  <td className="p-3 text-gray-500">{item.onboarding_completed_at ? "Active" : "Setup pending"}</td>
                  <td className="p-3"><button onClick={() => save(item.id)} disabled={isSelf || savingId === item.id}
                    className="bg-raz-teal text-white px-3 py-2 rounded-lg disabled:opacity-40">{savingId === item.id ? "Saving…" : "Save"}</button></td>
                </tr>;
              })}</tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
