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
  if (!campaign_id || !org_id) {
    return NextResponse.json({ error: "campaign_id and org_id required" }, { status: 400 });
  }
  const parsed = Number(amount);
  if (!parsed || parsed <= 0 || parsed > 1_000_000) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const receiptId = `R-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

  const { data, error } = await sb
    .from("donations")
    .insert({
      donor_id: user?.id ?? null,
      campaign_id,
      org_id,
      amount: parsed,
      currency: "ILS",
      status: "completed",
      is_recurring: Boolean(is_recurring),
      dedication_name: dedication_name ?? null,
      dedication_message: null,
      community_id: null,
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
    await sb.from("recurring_donations").insert({
      donor_id: user.id,
      campaign_id,
      org_id,
      amount: parsed,
      status: "active",
      start_date: new Date().toISOString().split("T")[0],
      next_charge_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      psp_token: null,
    });
  }

  return NextResponse.json({ donation: data, receiptId });
}
