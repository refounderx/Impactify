import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!name || !EMAIL.test(email) || !message || name.length > 120 || email.length > 254 || message.length > 2000 || phone.length > 40) {
    return NextResponse.json({ error: "Invalid contact details" }, { status: 400 });
  }
  const { error } = await createAdminClient().from("contact_messages").insert({ name, email, phone: phone || null, message });
  if (error) return NextResponse.json({ error: "Unable to save message" }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
