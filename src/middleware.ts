// GUILD AI — Auth-aware route guard
// Lightweight middleware that runs before page rendering. Only checks COOKIE
// PRESENCE (not validity) — actual session/user verification happens in the
// page server actions via `getUserBySessionToken`. This keeps the middleware
// in Edge runtime and DB-free.
//
// Flow:
//   - Protected paths without session cookie  → redirect to /login?redirect=<from>
//   - /login or /signup with active session   → redirect to /wallet (avoid showing
//     the form to already-signed-in users)

import { NextResponse, type NextRequest } from "next/server";

// keep in sync with SESSION_COOKIE_NAME in src/lib/auth/index.ts
const SESSION_COOKIE = "guild_session";

const PROTECTED_PREFIXES = ["/wallet", "/profile", "/sell", "/bank", "/guild"];
const AUTH_PAGES = ["/login", "/signup"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.includes(pathname);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = !!request.cookies.get(SESSION_COOKIE)?.value;

  // Protected page without session → redirect to /login with return target
  if (isProtected(pathname) && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  // Already-signed-in user visiting /login or /signup → bounce to /wallet
  if (isAuthPage(pathname) && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/wallet";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Match the pages we care about. Keep static assets / API routes out.
  matcher: [
    "/wallet/:path*",
    "/profile/:path*",
    "/sell/:path*",
    "/bank/:path*",
    "/guild/:path*",
    "/login",
    "/signup",
  ],
};
