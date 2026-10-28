"use client";

import { useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";

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
  if (!offline) return null;
  return (
    <div role="status" className="fixed inset-x-0 top-0 z-[150] flex items-center justify-center gap-2 bg-amber-500 px-4 pt-[calc(env(safe-area-inset-top)+0.4rem)] pb-1.5 text-center text-xs font-semibold text-amber-950 shadow">
      <WifiOff className="size-3.5 shrink-0" />
      <span>No internet · ઇન્ટરનેટ નથી · इंटरनेट नहीं — changes can’t be saved until you’re back online.</span>
    </div>
  );
}
