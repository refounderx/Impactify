import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { AppRole } from "@/lib/supabase/types";

function homeForRole(role: AppRole) {
  if (role === "ngo_owner") return "/nonprofit";
  if (role === "community_owner") return "/community";
  if (role === "admin") return "/admin/users";
  return "/";
}

// Supabase redirects here after user clicks the magic link email
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const sb = await createClient();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await sb.auth.getUser();
      const { data: profile } = user
        ? await sb.from("profiles").select("app_role, onboarding_completed_at").eq("id", user.id).single()
        : { data: null };
      const destination = profile?.onboarding_completed_at
        ? homeForRole(profile.app_role)
        : "/auth/setup";
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  // Something went wrong — send back to login
  return NextResponse.redirect(`${origin}/auth?error=auth_failed`);
}
