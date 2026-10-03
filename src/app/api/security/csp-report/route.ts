import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { consumeRequestRateLimit } from "@/lib/request-rate-limit";
import { logSecurityEvent } from "@/lib/security-events";

const ALLOWED_CONTENT_TYPES = new Set(["application/csp-report", "application/reports+json", "application/json"]);

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() ?? "";
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (!ALLOWED_CONTENT_TYPES.has(contentType) || contentLength > 8_192) return new Response(null, { status: 204 });

  const body = await request.text().catch(() => "");
  if (!body || new TextEncoder().encode(body).byteLength > 8_192) return new Response(null, { status: 204 });
  try {
    JSON.parse(body);
  } catch {
    return new Response(null, { status: 204 });
  }

  try {
    const limit = await consumeRequestRateLimit(createAdminClient(), request, "csp_report", 60, 60);
    if (limit.allowed && !limit.unavailable) logSecurityEvent("csp_violation", "payment_or_application_policy_violation");
  } catch {
    // Reporting is best-effort and must not expose backend failures.
  }
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
