import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic auth check only: redirect visitors without a session cookie away from
 * protected areas. Real authentication and authorization happen in the API on every call.
 */
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has("mh_session");
  if (!hasSession) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/org/:path*", "/onboarding/:path*", "/platform/:path*", "/account/:path*", "/invite/:path*"],
};
