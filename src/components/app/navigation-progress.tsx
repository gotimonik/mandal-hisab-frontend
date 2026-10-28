"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { cn } from "@/lib/utils";
import { WEB_ONLY_PATHS } from "@/lib/native";

const START = "mh:navstart";

/** Start the top progress bar for a navigation that isn't a link click (e.g. router.push after a menu choice). */
export function startNavigationProgress() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(START));
}

/**
 * Thin bar at the top of the screen while the next page loads, so a tap always shows that
 * something is happening. Starts on internal link clicks (and startNavigationProgress()),
 * finishes when the new page's content (not just its loading skeleton) is on screen. Render inside <Suspense> (it reads the URL).
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [phase, setPhase] = useState<"idle" | "loading" | "done">("idle");
  const safety = useRef<ReturnType<typeof setTimeout> | null>(null);

  // A new URL means the page arrived — but it may still be showing its loading skeleton
  // while the data streams in, so keep going until the skeleton is gone.
  const url = `${pathname}?${search}`;
  const last = useRef(url);
  useEffect(() => {
    if (last.current === url) return;
    last.current = url;
    const finish = () => setPhase((p) => (p === "loading" ? "done" : p));
    const id = setInterval(() => {
      if (!document.querySelector("[data-page-skeleton]")) {
        clearInterval(id);
        finish();
      }
    }, 100);
    return () => clearInterval(id);
  }, [url]);
  useEffect(() => {
    if (phase !== "done") return;
    const t = setTimeout(() => setPhase("idle"), 350);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    const start = () => {
      setPhase("loading");
      if (safety.current) clearTimeout(safety.current);
      // never leave it running (navigation failed, or stayed on the same URL)
      safety.current = setTimeout(() => setPhase((p) => (p === "loading" ? "done" : p)), 12000);
    };
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const to = new URL(a.href, window.location.href);
      const here = window.location;
      if (to.origin !== here.origin || to.pathname.startsWith("/api/")) return;
      if (to.pathname === here.pathname && to.search === here.search) return; // same page / #hash
      if (WEB_ONLY_PATHS.includes(to.pathname) && Capacitor.isNativePlatform()) return; // blocked in the app
      start();
    };
    // Capture phase: Next.js <Link> cancels the browser's default click (to navigate in-app),
    // so by the bubble phase every link click looks "prevented".
    document.addEventListener("click", onClick, { capture: true });
    window.addEventListener(START, start);
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      window.removeEventListener(START, start);
      if (safety.current) clearTimeout(safety.current);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-[env(safe-area-inset-top)] z-[100] h-[3px]">
      <div
        className={cn(
          "h-full bg-primary shadow-[0_0_8px] shadow-primary/60",
          phase === "idle" && "w-0 opacity-0 transition-none",
          phase === "loading" && "w-[85%] opacity-100 transition-[width] duration-[8s] ease-out",
          phase === "done" && "w-full opacity-0 transition-[width,opacity] duration-300",
        )}
      />
    </div>
  );
}
