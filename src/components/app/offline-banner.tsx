"use client";

import { useEffect, useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";
import { toast } from "sonner";

const subscribe = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
};

/** Shown while the phone or computer has no internet: what's on screen may be out of date and saving won't work. */
export function OfflineBanner() {
  const offline = useSyncExternalStore(subscribe, () => !navigator.onLine, () => false);

  // Offline, a tap on a link would fail and fall back to a full page load — which shows the
  // browser's (or the app's) offline page and loses the screen. Stay on this page instead.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (navigator.onLine || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // a link to a spot on this same page still works
      if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return;
      e.preventDefault();
      e.stopPropagation();
      toast.warning("You're offline · તમે ઑફલાઇન છો · आप ऑफ़लाइन हैं", { id: "offline-tap", description: "This opens once you're back online." });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  if (!offline) return null;
  return (
    <div role="status" className="fixed inset-x-0 top-0 z-[150] flex items-center justify-center gap-2 bg-amber-500 px-4 pt-[calc(env(safe-area-inset-top)+0.4rem)] pb-1.5 text-center text-xs font-semibold text-amber-950 shadow">
      <WifiOff className="size-3.5 shrink-0" />
      <span>No internet · ઇન્ટરનેટ નથી · इंटरनेट नहीं — changes can’t be saved until you’re back online.</span>
    </div>
  );
}
