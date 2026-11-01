import { describe, expect, it } from "vitest";
import { APP_START, APP_LINK_PREFIXES, appLinkTarget } from "@/lib/native";
import { GET as aasa } from "@/app/.well-known/apple-app-site-association/route";

describe("links that open the app", () => {
  it("opens our links on the same screen in the app", () => {
    expect(appLinkTarget("https://mandalhisab.com/org/abc/receipts/def")).toBe("/org/abc/receipts/def");
    expect(appLinkTarget("https://www.mandalhisab.com/invite?token=xyz#a")).toBe("/invite?token=xyz#a");
    expect(appLinkTarget("https://mandalhisab.com/verify-email?token=1")).toBe("/verify-email?token=1");
  });

  it("sends website-only pages to the app's start, and ignores other sites", () => {
    expect(appLinkTarget("https://mandalhisab.com/")).toBe(APP_START);
    expect(appLinkTarget("https://mandalhisab.com/guides/what-is-a-mandal")).toBe(APP_START);
    expect(appLinkTarget("https://evil.example/org/abc")).toBeNull();
    expect(appLinkTarget("not a url")).toBeNull();
  });

  it("tells iOS which paths open the app", async () => {
    const res = aasa();
    const j = await res.json();
    const d = j.applinks.details[0];
    expect(d.appIDs).toEqual(["8A8JG3NNKM.com.mandalhisab.app"]);
    const paths = d.components.map((c: { "/": string }) => c["/"]);
    for (const p of APP_LINK_PREFIXES) expect(paths).toEqual(expect.arrayContaining([p, `${p}/*`]));
    expect(paths).not.toContain("/");
  });
});
