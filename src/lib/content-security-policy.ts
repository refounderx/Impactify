export function paymentContentSecurityPolicy(nonce: string, isDevelopment: boolean) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let supabaseOrigin = "";
  try {
    supabaseOrigin = supabaseUrl ? new URL(supabaseUrl).origin : "";
  } catch {
    supabaseOrigin = "";
  }
  const supabaseSocket = supabaseOrigin.replace(/^https:/, "wss:");
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self' https://directng.tranzila.com",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDevelopment ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    `img-src 'self' data: blob:${supabaseOrigin ? ` ${supabaseOrigin}` : ""}`,
    `connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin} ${supabaseSocket}` : ""}`,
    "upgrade-insecure-requests",
  ].join("; ");
}

export function isPaymentSecurityRoute(pathname: string) {
  return pathname === "/api/payments/checkout" || /^\/donate\/[^/]+\/payment\/?$/.test(pathname);
}
