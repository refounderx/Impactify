import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const donationId = typeof body?.donation_id === "string" ? body.donation_id : "";
  if (!UUID_RE.test(donationId)) return NextResponse.json({ error: "Invalid donation" }, { status: 400 });

  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles").select("app_role,org_id").eq("id", user.id).maybeSingle();
  if (profileError || profile?.app_role !== "ngo_owner" || !profile.org_id) {
    return NextResponse.json({ error: "NGO owner profile required" }, { status: 403 });
  }

  const { data: donation, error: donationError } = await admin
    .from("donations").select("id,org_id,status").eq("id", donationId).maybeSingle();
  if (donationError || !donation || donation.org_id !== profile.org_id || donation.status !== "completed") {
    return NextResponse.json({ error: "Donation is not eligible for a refund request" }, { status: 400 });
  }

  const { data, error } = await admin.from("refund_requests")
    .upsert({ donation_id: donation.id, org_id: profile.org_id, requested_by: user.id }, { onConflict: "donation_id", ignoreDuplicates: true })
    .select("id,status,created_at")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (data) return NextResponse.json({ refund: data });
  const { data: existing, error: existingError } = await admin.from("refund_requests")
    .select("id,status,created_at").eq("donation_id", donation.id).single();
  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });
  return NextResponse.json({ refund: existing });
}
