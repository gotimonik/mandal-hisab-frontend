"use client";

import Link from "next/link";
import { useEffect, type ComponentProps } from "react";

/**
 * Links that only change what a page shows (another month, another period) shouldn't jump the
 * page back to the top. Next.js keeps the scroll with `scroll={false}`, but the page's loading
 * skeleton briefly makes it short, so the browser scrolls up anyway: the link remembers where you
 * were, and <RestoreScroll /> on the page puts you back there once the new data is in.
 */
const KEY = "mh:keepScroll";

export function KeepScrollLink({ onClick, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      scroll={false}
      onClick={(e) => {
        try {
          sessionStorage.setItem(KEY, JSON.stringify({ path: window.location.pathname, y: window.scrollY, at: Date.now() }));
        } catch {
          /* private mode — just no restore */
        }
        onClick?.(e);
      }}
    />
  );
}

/** Put on the page whose links are KeepScrollLinks; runs each time the page shows new data. */
export function RestoreScroll() {
  useEffect(() => {
    let saved: { path: string; y: number; at: number } | null = null;
    try {
      saved = JSON.parse(sessionStorage.getItem(KEY) ?? "null");
      sessionStorage.removeItem(KEY);
    } catch {
      return;
    }
    // only straight after the click on this same page, never on a later visit
    if (!saved || saved.path !== window.location.pathname || Date.now() - saved.at > 15_000) return;
    const y = saved.y;
    // after the new content has laid out
    requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo({ top: y, behavior: "instant" })));
  });
  return null;
}
