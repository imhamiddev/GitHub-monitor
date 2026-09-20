import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/repositories",
  "/activity",
  "/statistics",
  "/settings",
  "/onboarding",
];

const AUTH_PAGES = ["/login", "/register"];

/**
 * Lightweight, edge-safe check: we only look for the presence of a
 * session cookie here (no DB call), then let each protected page's
 * Server Component re-verify via getServerSession() for the real,
 * authoritative check. This keeps the proxy fast while avoiding any
 * reliance on client-supplied state for actual authorization.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request);

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
  const isAuthPage = AUTH_PAGES.some((page) => pathname.startsWith(page));

  if (isProtected && !sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/repositories/:path*",
    "/activity/:path*",
    "/statistics/:path*",
    "/settings/:path*",
    "/onboarding",
    "/login",
    "/register",
  ],
};
