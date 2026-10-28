import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SA_BASE_COOKIE, SA_BASE_HEADER, SA_INTERNAL, isSaBase } from "./lib/sa-path";

const isDev = process.env.NODE_ENV !== "production";
const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin : "";

/**
 * Content Security Policy with a fresh nonce per request:
 * only our own scripts (carrying the nonce) can run — injected scripts are blocked.
 */
function contentSecurityPolicy(nonce: string) {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${supabaseOrigin}`,
    "font-src 'self'",
    `connect-src 'self' ${supabaseOrigin}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

/**
 * 1. Adds the CSP to every page.
 * 2. For the management areas: refreshes the Supabase session and sends visitors
 *    without a session to the right login page. Role / 2FA checks happen server-side
 *    in every page and action (requireAdmin / requireSuperAdmin) and in database RLS.
 */
export async function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const csp = contentSecurityPolicy(nonce);

  // Next.js reads the nonce from this request header and applies it to its own scripts.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("content-security-policy", csp);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.delete(SA_BASE_HEADER); // only middleware may set it

  const path = request.nextUrl.pathname;

  // The real console folder is hidden: everyone gets a plain 404 there.
  if (path === SA_INTERNAL || path.startsWith(`${SA_INTERNAL}/`)) {
    const res = NextResponse.rewrite(new URL("/_not-found-hidden", request.url), { request: { headers: requestHeaders } });
    res.headers.set("content-security-policy", csp);
    return res;
  }

  // The secret address (its hash is SUPER_ADMIN_PATH_HASH) is served from the hidden folder.
  const firstSegment = path.match(/^\/[^/]+/)?.[0] ?? "";
  const saSecret = (await isSaBase(firstSegment)) ? firstSegment : null;
  const isSuperAdmin = !!saSecret;
  const internalPath = isSuperAdmin ? SA_INTERNAL + path.slice(saSecret.length) : path;
  const isManagement = isSuperAdmin || path === "/admin" || path.startsWith("/admin/");
  // lets the server build console links without the address being stored anywhere
  if (saSecret) requestHeaders.set(SA_BASE_HEADER, saSecret);

  const next = () => {
    const res = isSuperAdmin
      ? NextResponse.rewrite(new URL(internalPath + request.nextUrl.search, request.url), { request: { headers: requestHeaders } })
      : NextResponse.next({ request: { headers: requestHeaders } });
    res.headers.set("content-security-policy", csp);
    if (saSecret) {
      res.cookies.set(SA_BASE_COOKIE, saSecret, {
        httpOnly: true,
        sameSite: "strict",
        secure: !isDev,
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
    return res;
  };
  let response = next();
  if (!isManagement) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = next();
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const isLogin = path === "/admin/login" || internalPath === `${SA_INTERNAL}/login`;

  if (!user && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = isSuperAdmin ? `${saSecret}/login` : "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  // management pages must never be cached by browsers or proxies
  response.headers.set("cache-control", "no-store, max-age=0");
  return response;
}

export const config = {
  matcher: [
    // every page (prefetches included), but not static files / images
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|hero/|about/|collections/|brand/|.*\\.(?:png|jpg|jpeg|webp|svg|ico)$).*)",
  ],
};
