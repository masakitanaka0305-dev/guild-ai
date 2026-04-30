// GUILD AI — Auth guard (disabled for v1 MVP)
// Authentication is postponed to v2. All routes are public.
// See docs/Auth-Removed.md for context and re-introduction plan.

import { NextResponse } from "next/server";

export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
