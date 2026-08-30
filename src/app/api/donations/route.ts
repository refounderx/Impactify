import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") ?? "";
  const receiptId = request.nextUrl.searchParams.get("receipt") ?? "";
  if (!UUID_RE.test(id) || !receiptId) {
    return NextResponse.json({ error: "Invalid confirmation reference" }, { status: 400 });
  }

  const sb = createAdminClient();
  const { data, error } = await sb
    .from("donations")
    .select("id, amount, receipt_id, created_at, campaign_id, campaigns(title, title_en, gradient, emoji), organizations(name, name_en)")
    .eq("id", id)
    .eq("receipt_id", receiptId)
    .single();
  if (error || !data) return NextResponse.json({ error: "Confirmation not found" }, { status: 404 });

  return NextResponse.json({ donation: data });
}

export async function POST(request: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { campaign_id, org_id, amount, is_recurring, dedication_name } = body;

  // Validate inputs at trust boundary
  if (!UUID_RE.test(campaign_id ?? "") || !UUID_RE.test(org_id ?? "")) {
    return NextResponse.json({ error: "campaign_id and org_id required" }, { status: 400 });
  }
  const parsed = Number(amount);
  if (!parsed || parsed <= 0 || parsed > 1_000_000) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }
  if (is_recurring && !user) {
    return NextResponse.json({ error: "Sign in is required for recurring donations" }, { status: 401 });
  }

  const { data: campaign, error: campaignError } = await sb.from("campaigns")
    .select("id, org_id, status").eq("id", campaign_id).eq("status", "active").single();
  if (campaignError || !campaign || campaign.org_id !== org_id) {
    return NextResponse.json({ error: "Campaign and organization do not match" }, { status: 400 });
  }

  const receiptId = `R-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

  const admin = createAdminClient();
  let communityId: string | null = null;
  let donorName: string | null = null;

  if (user) {
    const { data: donorProfile, error: donorProfileError } = await admin
      .from("profiles")
      .select("community_id,full_name")
      .eq("id", user.id)
      .maybeSingle();
    if (donorProfileError) return NextResponse.json({ error: "Unable to identify donor community" }, { status: 500 });

    donorName = donorProfile?.full_name?.trim() || null;
    if (donorProfile?.community_id) {
      const { data: membership, error: membershipError } = await admin
        .from("community_campaigns")
        .select("community_id")
        .eq("community_id", donorProfile.community_id)
        .eq("campaign_id", campaign_id)
        .eq("status", "active")
        .maybeSingle();
      if (membershipError) return NextResponse.json({ error: "Unable to validate community campaign" }, { status: 500 });
      communityId = membership?.community_id ?? null;
    }
  }

  const { data, error } = await admin
    .from("donations")
    .insert({
      donor_id: user?.id ?? null,
      campaign_id,
      org_id,
      amount: parsed,
      currency: "ILS",
      status: "completed",
      is_recurring: Boolean(is_recurring),
      dedication_name: typeof dedication_name === "string" ? dedication_name.trim().slice(0, 120) || null : null,
      dedication_message: null,
      community_id: communityId,
      donor_name: donorName,
      psp_token: null,
      last_four: null,
      card_brand: null,
      receipt_id: receiptId,
      receipt_url: null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If recurring, also create a recurring_donations row (requires auth)
  if (is_recurring && user?.id) {
    const { error: recurringError } = await sb.from("recurring_donations").insert({
      donor_id: user.id,
      campaign_id,
      org_id,
      amount: parsed,
      status: "active",
      start_date: new Date().toISOString().split("T")[0],
      next_charge_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      psp_token: null,
    });
    if (recurringError) {
      return NextResponse.json({ error: "Donation saved, but recurring setup failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ donation: data, receiptId });
}
