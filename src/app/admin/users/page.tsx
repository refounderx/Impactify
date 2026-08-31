"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { deleteUser, getAdminDirectory, updateProfileRole, type AdminDirectory } from "@/lib/supabase/queries-account-admin";
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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

  async function handleSignOut() {
    await signOut();
  }

  async function removeUser(id: string) {
    setDeletingId(id);
    setError("");
    try {
      await deleteUser(id);
      setConfirmDeleteId(null);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to delete user");
    } finally {
      setDeletingId(null);
    }
  }

  const deleteTarget = directory?.profiles.find((item) => item.id === confirmDeleteId);

  return (
    <main className="min-h-screen bg-raz-surface p-4 md:p-8" dir="ltr">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-start gap-4 mb-6">
          <div><p className="text-sm text-raz-teal font-bold">Impactify administration</p>
            <h1 className="text-3xl font-bold text-gray-900">Users and roles</h1>
            <p className="text-sm text-gray-500">Signed in as {profile?.email ?? "admin"}</p></div>
          <div className="flex gap-2">
            <Link href="/" className="border border-raz-dark text-raz-dark px-4 py-2 rounded-xl text-sm">Back to website</Link>
            <button onClick={handleSignOut} className="bg-raz-dark text-white px-4 py-2 rounded-xl text-sm">Sign out</button>
          </div>
        </header>
        <div className="mb-5 rounded-2xl border border-raz-teal/20 bg-raz-teal/5 p-4 text-sm text-gray-700">
          <p className="font-bold text-gray-900 mb-1">You are signed in as the platform administrator.</p>
          <p>Your own role is locked for safety. To test a new signup or manage another user, sign out and register with a different email. That account will then appear here.</p>
        </div>
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
                  <td className="p-3 text-gray-500">{isSelf ? "Your account — locked" : item.onboarding_completed_at ? "Active" : "Setup pending"}</td>
                  <td className="p-3"><div className="flex gap-2">
                    <button onClick={() => save(item.id)} disabled={isSelf || savingId === item.id || deletingId === item.id}
                      className="bg-raz-teal text-white px-3 py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed">{savingId === item.id ? "Saving…" : isSelf ? "Locked" : "Save"}</button>
                    {!isSelf && <button onClick={() => setConfirmDeleteId(item.id)} disabled={savingId === item.id || deletingId === item.id}
                      className="border border-red-200 text-red-700 px-3 py-2 rounded-lg hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed" aria-haspopup="dialog">Delete</button>}
                  </div></td>
                </tr>;
              })}</tbody>
            </table>
          </div>
        )}
      </div>
      {deleteTarget && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !deletingId && setConfirmDeleteId(null)}>
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="delete-user-title" onClick={(event) => event.stopPropagation()}>
          <h2 id="delete-user-title" className="text-xl font-bold text-gray-900">Delete this user?</h2>
          <p className="mt-2 text-sm text-gray-600">This permanently deletes <strong>{deleteTarget.full_name || deleteTarget.email || "this user"}</strong>, their sign-in account, and account-linked data. Donation history is retained without identifying the donor.</p>
          <p className="mt-3 text-sm font-semibold text-red-700">This action cannot be undone.</p>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setConfirmDeleteId(null)} disabled={deletingId === deleteTarget.id} className="rounded-lg border border-gray-200 px-4 py-2 text-sm disabled:opacity-40">Cancel</button>
            <button onClick={() => removeUser(deleteTarget.id)} disabled={deletingId === deleteTarget.id} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-40">
              {deletingId === deleteTarget.id ? "Deleting…" : "Delete permanently"}
            </button>
          </div>
        </div>
      </div>}
    </main>
  );
}
