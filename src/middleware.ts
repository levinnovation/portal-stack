import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthCookieName } from "@/lib/auth/cookie-name";

// ponytail: edge can't validate JWT — cookie presence only; Payload validates server-side.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/portal/auth")) return NextResponse.next();

  if (!req.cookies.has(getAuthCookieName())) {
    const url = req.nextUrl.clone();
    url.pathname = "/portal/auth";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/portal/:path*"],
};
