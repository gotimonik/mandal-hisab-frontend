import { NextResponse, type NextRequest } from "next/server";
import { APP_START, NATIVE_APP_UA, WEB_ONLY_PATHS } from "@/lib/native";

const PROTECTED = ["/org", "/onboarding", "/platform", "/account", "/invite"];

/**
 * 1. Inside the iOS / Android app, the website-only pages (features, download, about, FAQ)
 *    are skipped: the app goes straight to the user's Mandal, or to sign in.
 * 2. Optimistic auth check: visitors without a session cookie are sent to /login from
 *    protected areas. Real authentication and authorization happen in the API on every call.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = request.cookies.has("mh_session");

  if (WEB_ONLY_PATHS.includes(pathname) && (request.headers.get("user-agent") ?? "").includes(NATIVE_APP_UA)) {
    return NextResponse.redirect(new URL(hasSession ? APP_START : "/login", request.url));
  }

  if (PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`)) && !hasSession) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/features", "/download", "/about", "/faq", "/org/:path*", "/onboarding/:path*", "/platform/:path*", "/account/:path*", "/invite/:path*"],
};
