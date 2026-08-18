import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

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
    });
  }

  return NextResponse.json({ donation: data, receiptId });
}
