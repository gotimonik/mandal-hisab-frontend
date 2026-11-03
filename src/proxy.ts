import { NextResponse, type NextRequest } from "next/server";
import { APP_START, NATIVE_APP_UA, isWebOnlyPath } from "@/lib/native";

const PROTECTED = ["/org", "/onboarding", "/platform", "/account", "/invite", "/personal"];
/** Pages only for people who aren't signed in: someone signed in goes straight into the app. */
const SIGNED_OUT_ONLY = ["/login", "/register"];

/** A `next=` path from the query, only if it stays on this site. */
const safeNext = (v: string | null) => (v && v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\") ? v : null);

/**
 * 1. Inside the iOS / Android app, the website-only pages (home, features, guides, about,
 *    FAQ …) are skipped: the app goes straight to the user's Mandal, or to sign in.
 * 2. Optimistic auth check: visitors without a session cookie are sent to /login from
 *    protected areas. Real authentication and authorization happen in the API on every call.
 * 3. Someone already signed in who opens Sign in / Create account goes into the app instead
 *    (or to where `next=` points, e.g. an invitation). When the API said the session has
 *    expired (/login?expired=1), the stale cookie is removed here so the sign-in page shows.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = request.cookies.has("mh_session");

  if (isWebOnlyPath(pathname) && (request.headers.get("user-agent") ?? "").includes(NATIVE_APP_UA)) {
    return NextResponse.redirect(new URL(hasSession ? APP_START : "/login", request.url));
  }

  if (SIGNED_OUT_ONLY.includes(pathname)) {
    if (request.nextUrl.searchParams.has("expired")) {
      // the API refused this session: forget it, or every visit would bounce back into the app
      const res = NextResponse.next();
      res.cookies.delete("mh_session");
      res.cookies.delete("mh_org");
      return res;
    }
    if (hasSession) return NextResponse.redirect(new URL(safeNext(request.nextUrl.searchParams.get("next")) ?? APP_START, request.url));
    return NextResponse.next();
  }

  if (PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`)) && !hasSession) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/register", "/", "/features", "/download", "/about", "/faq", "/benefits", "/how-it-works", "/glossary", "/guides", "/guides/:path*", "/org/:path*", "/onboarding/:path*", "/platform/:path*", "/account/:path*", "/invite/:path*", "/personal", "/personal/:path*"],
};
