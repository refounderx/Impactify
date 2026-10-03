function commonPolicy(nonce: string, isDevelopment: boolean) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let supabaseOrigin = "";
  try {
    supabaseOrigin = supabaseUrl ? new URL(supabaseUrl).origin : "";
  } catch {
    supabaseOrigin = "";
  }
  const supabaseSocket = supabaseOrigin.replace(/^https:/, "wss:");
  return {
    supabaseOrigin,
    directives: [
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
    "report-uri /api/security/csp-report",
    "report-to impactify-csp",
    ],
  };
}

export function paymentContentSecurityPolicy(nonce: string, isDevelopment: boolean) {
  return commonPolicy(nonce, isDevelopment).directives.join("; ");
}

export function applicationContentSecurityPolicy(nonce: string, isDevelopment: boolean) {
  const policy = commonPolicy(nonce, isDevelopment);
  return [
    ...policy.directives.filter((directive) => !directive.startsWith("img-src") && !directive.startsWith("form-action")),
    "form-action 'self' https://directng.tranzila.com",
    `img-src 'self' data: blob:${policy.supabaseOrigin ? ` ${policy.supabaseOrigin}` : ""}`,
    `media-src 'self' blob:${policy.supabaseOrigin ? ` ${policy.supabaseOrigin}` : ""}`,
    "frame-src https://www.youtube-nocookie.com https://player.vimeo.com",
  ].join("; ");
}

export function isPaymentSecurityRoute(pathname: string) {
  return pathname === "/api/payments/checkout" || /^\/donate\/[^/]+\/payment\/?$/.test(pathname);
}
