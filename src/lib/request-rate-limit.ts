import "server-only";
import { createHmac } from "node:crypto";
import type { NextRequest } from "next/server";
import type { createAdminClient } from "@/lib/supabase/admin";
import { normalizeRateLimitAddress } from "@/lib/request-identity";

type AdminClient = ReturnType<typeof createAdminClient>;

function clientIp(request: NextRequest) {
  const raw = process.env.VERCEL
    ? request.headers.get("x-vercel-forwarded-for")
    : process.env.NODE_ENV !== "production"
      ? request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip")
      : null;
  return normalizeRateLimitAddress(raw);
}

export async function consumeRequestRateLimit(
  admin: AdminClient,
  request: NextRequest,
  scope: string,
  limit: number,
  windowSeconds: number,
) {
  const ip = clientIp(request);
  if (!ip) return { allowed: true, unavailable: true };
  const secret = process.env.RATE_LIMIT_HMAC_SECRET;
  if (!secret || secret.length < 32) throw new Error("Rate-limit secret unavailable");
  const bucketKey = createHmac("sha256", secret).update(`impactify:${scope}:${ip}`).digest("hex");
  const { data, error } = await admin.rpc("consume_api_rate_limit", {
    p_scope: scope,
    p_bucket_key: bucketKey,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error || typeof data !== "boolean") throw new Error("Rate-limit service unavailable");
  return { allowed: data, unavailable: false };
}
