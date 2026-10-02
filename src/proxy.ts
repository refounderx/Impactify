import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isPaymentSecurityRoute, paymentContentSecurityPolicy } from "@/lib/content-security-policy";

const NGO_ADMIN_PREFIXES = [
  "/nonprofit/campaigns",
  "/nonprofit/donations",
  "/nonprofit/communities",
  "/nonprofit/products",
  "/nonprofit/updates",
  "/nonprofit/create-campaign",
];

function isProtectedPath(pathname: string) {
  return pathname === "/my-donations" ||
    pathname === "/nonprofit" ||
    NGO_ADMIN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) ||
    pathname === "/community" || pathname.startsWith("/community/") ||
    pathname === "/admin" || pathname.startsWith("/admin/") ||
    pathname === "/auth/setup";
}

export async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const paymentRoute = isPaymentSecurityRoute(request.nextUrl.pathname);
  const nonce = paymentRoute ? btoa(crypto.randomUUID()) : null;
  const csp = nonce ? paymentContentSecurityPolicy(nonce, process.env.NODE_ENV === "development") : null;
  if (nonce && csp) {
    requestHeaders.set("x-nonce", nonce);
    requestHeaders.set("Content-Security-Policy", csp);
  }
  const nextResponse = () => {
    const result = NextResponse.next({ request: { headers: requestHeaders } });
    if (csp) result.headers.set("Content-Security-Policy", csp);
    return result;
  };
  let response = nextResponse();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = nextResponse();
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user && isProtectedPath(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
