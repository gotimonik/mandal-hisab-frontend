"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { setAnalyticsRole, track } from "@/lib/analytics";

const ID = /[a-f0-9]{24}/g;
/** Page path with IDs replaced, e.g. /org/66f…/members/670… → /org/:id/members/:id. No query string. */
const pagePath = () => window.location.pathname.replace(ID, ":id");

/**
 * One click listener for the whole app:
 * - any element (or its parent) with data-track="event_name" → that event, plus its
 *   data-track-* attributes as parameters (e.g. data-track-action="collect");
 * - links to sign-up / sign-in / download, contact links (email, phone, WhatsApp),
 *   CSV exports and app-store links are tracked automatically.
 */
export function AnalyticsClicks() {
  const pathname = usePathname();
  // Page views, sent by us so the address never includes IDs or search text.
  useEffect(() => {
    const t = setTimeout(() => track("page_view", { page_location: window.location.origin + pagePath(), page_title: document.title }), 150);
    return () => clearTimeout(t);
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.("[data-track], a[href]");
      if (!el) return;
      const tagged = (e.target as Element).closest("[data-track]") as HTMLElement | null;
      if (tagged) {
        const params: Record<string, string> = { page: pagePath() };
        for (const [k, v] of Object.entries(tagged.dataset)) if (k.startsWith("track") && k !== "track" && v) params[k.slice(5).replace(/^./, (c) => c.toLowerCase())] = v;
        track(tagged.dataset.track!, params);
        return;
      }
      const href = (el as HTMLAnchorElement).getAttribute("href") ?? "";
      if (href.startsWith("mailto:")) track("contact_click", { channel: "email", page: pagePath() });
      else if (href.startsWith("tel:")) track("contact_click", { channel: "phone", page: pagePath() });
      else if (href.includes("wa.me/")) track("contact_click", { channel: "whatsapp", page: pagePath() });
      else if (href.startsWith("/api/export")) {
        const report = (decodeURIComponent(href).match(/\/(?:reports\/)?([a-z-]+)(?:\?|&|$)/)?.[1] ?? "export").replace(/-/g, "_");
        track("export_csv", { report, page: pagePath() });
      } else if (/play\.google\.com|apps\.apple\.com/.test(href)) track("app_store_click", { store: href.includes("apple") ? "ios" : "android" });
      else if (href.startsWith("/register")) track("cta_click", { cta: "create_mandal", page: pagePath() });
      else if (href.startsWith("/login")) track("cta_click", { cta: "sign_in", page: pagePath() });
      else if (href.startsWith("/download")) track("cta_click", { cta: "download", page: pagePath() });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
  return null;
}

/** Sets the visitor's role in the open Mandal as a user property (no identity). */
export function AnalyticsRole({ role }: { role: string }) {
  useEffect(() => setAnalyticsRole(role), [role]);
  return null;
}
