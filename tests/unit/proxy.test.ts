import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

const req = (path: string, signedIn: boolean) => new NextRequest(`https://mandalhisab.com${path}`, { headers: signedIn ? { cookie: "mh_session=abc; mh_org=123" } : {} });
const goesTo = (r: Response) => {
  const loc = r.headers.get("location");
  return loc ? new URL(loc).pathname + new URL(loc).search : null;
};

describe("sign in / create account when already signed in", () => {
  it("signed in: Sign in and Create account go into the app", () => {
    expect(goesTo(proxy(req("/login", true)))).toBe("/onboarding?auto=1");
    expect(goesTo(proxy(req("/register", true)))).toBe("/onboarding?auto=1");
  });

  it("signed in with an invitation link: straight to the invitation", () => {
    expect(goesTo(proxy(req("/register?next=%2Finvite%2Fabc123", true)))).toBe("/invite/abc123");
    expect(goesTo(proxy(req("/login?next=%2Fpersonal%3Fadd%3Dexpense", true)))).toBe("/personal?add=expense");
  });

  it("never follows next= off the site", () => {
    expect(goesTo(proxy(req("/login?next=%2F%2Fevil.example", true)))).toBe("/onboarding?auto=1");
    expect(goesTo(proxy(req("/login?next=https%3A%2F%2Fevil.example", true)))).toBe("/onboarding?auto=1");
  });

  it("signed out: the pages open as usual", () => {
    expect(goesTo(proxy(req("/login", false)))).toBeNull();
    expect(goesTo(proxy(req("/register?next=%2Finvite%2Fabc", false)))).toBeNull();
  });

  it("expired session: the sign-in page shows and the old cookie is removed (no loop)", () => {
    const r = proxy(req("/login?expired=1", true));
    expect(goesTo(r)).toBeNull();
    const cleared = r.headers.getSetCookie().join("; ");
    expect(cleared).toMatch(/mh_session=;/);
    expect(cleared).toMatch(/mh_org=;/);
  });

  it("private pages still need a session", () => {
    expect(goesTo(proxy(req("/personal", false)))).toBe("/login?next=%2Fpersonal");
    expect(goesTo(proxy(req("/personal", true)))).toBeNull();
  });
});
