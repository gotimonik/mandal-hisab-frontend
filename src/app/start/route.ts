import { NextResponse, type NextRequest } from "next/server";
import { ApiError, apiCall } from "@/lib/server/api";
import { lastOrg } from "@/lib/server/session";
import type { Me } from "@/lib/types";

/**
 * Where the app (and anything else that opens a fresh page) starts: the last Mandal, or the
 * Mandal list, or sign-in. Decided here with a real redirect before any page is sent.
 *
 * /onboarding?auto=1 decides the same thing, but only after its page has started streaming, so
 * on a fresh page load Next.js sends the jump as a one-second `<meta refresh>`: the page loads
 * twice, and with the fingerprint / Face ID lock on that asked to unlock twice (slow phones).
 * In-app links can keep using /onboarding?auto=1 — there the jump happens without a reload.
 */
export async function GET(request: NextRequest) {
  const go = (path: string) => NextResponse.redirect(new URL(path, request.url), 307);
  if (!request.cookies.has("mh_session")) return go("/login");
  try {
    const [me, invitations] = await Promise.all([apiCall<Me>("/auth/me"), apiCall<unknown[]>("/invitations/mine")]);
    const active = me.organizations.filter((o) => o.membershipStatus === "active" && o.status !== "suspended");
    const pending = me.organizations.filter((o) => o.membershipStatus === "pending");
    if (active.length >= 1 && pending.length === 0 && invitations.length === 0) {
      const last = await lastOrg();
      const target = active.find((o) => o.id === last) ?? (active.length === 1 ? active[0] : null);
      if (target) return go(`/org/${target.id}`);
    }
    return go("/onboarding");
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return go("/login?expired=1");
    // service unreachable etc.: the Mandal list shows the usual error / retry screen
    return go("/onboarding");
  }
}
