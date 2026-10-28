"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Fingerprint, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/actions/auth";
import { biometric, getPref, isNativeApp, setPref } from "@/lib/native-plugins";
import { useT } from "@/i18n/client";

export const LOCK_PREF = "mh.appLock";
/** Mirror of the setting in localStorage, read by the tiny script in the root layout before paint. */
export const LOCK_LS = "mh.appLock";
/** Lock again when the app comes back after this long in the background. */
const RELOCK_MS = 60_000;

export async function lockEnabled() {
  return (await getPref(LOCK_PREF)) === "on";
}
export async function setLockEnabled(on: boolean) {
  await setPref(LOCK_PREF, on ? "on" : null);
  try {
    if (on) localStorage.setItem(LOCK_LS, "1");
    else localStorage.removeItem(LOCK_LS);
  } catch {}
}

export async function verify(reason: string) {
  try {
    await biometric().verifyIdentity({ reason, title: "MandalHisab", subtitle: reason, useFallback: true, maxAttempts: 5 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Once per app launch: Next.js keeps earlier screens alive (hidden) and re-runs their effects when
 * you go back, so the launch-time lock must not fire again then. Relocking after time away is
 * handled by the app-state listener.
 */
let launchChecked = false;

/** Remove the "hide until unlocked" class the root layout's early script may have set. */
const reveal = () => document.documentElement.classList.remove("app-locking");

/**
 * Face ID / fingerprint lock for the signed-in app (opt-in on the Account page). Covers the screen
 * on launch and when the app returns after a minute in the background, until the person unlocks.
 */
export function AppLock() {
  const t = useT();
  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const hiddenAt = useRef<number | null>(null);

  const unlock = useCallback(async () => {
    setBusy(true);
    const ok = await verify(t("native.unlockReason"));
    setBusy(false);
    if (ok) {
      setLocked(false);
      reveal();
    }
  }, [t]);

  useEffect(() => {
    if (!isNativeApp()) return reveal();
    let removed = false;
    let handle: { remove: () => Promise<void> } | undefined;
    (async () => {
      if (!(await lockEnabled())) {
        try {
          localStorage.removeItem(LOCK_LS);
        } catch {}
        return reveal();
      }
      if (!launchChecked) {
        launchChecked = true;
        setLocked(true);
        void unlock();
      } else reveal();
      const { App } = await import("@capacitor/app");
      handle = await App.addListener("appStateChange", ({ isActive }) => {
        if (!isActive) hiddenAt.current = Date.now();
        else if (hiddenAt.current && Date.now() - hiddenAt.current > RELOCK_MS) {
          hiddenAt.current = null;
          setLocked(true);
          void unlock();
        }
      });
      if (removed) void handle.remove();
    })().catch(() => reveal());
    return () => {
      removed = true;
      void handle?.remove();
    };
  }, [unlock]);

  if (!locked) return null;
  return (
    <div id="app-lock" role="dialog" aria-modal="true" aria-labelledby="lock-title" className="bg-hero fixed inset-0 z-[200] flex flex-col items-center justify-center gap-5 px-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-center text-white">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
        <Lock className="size-8" />
      </span>
      <div>
        <h1 id="lock-title" className="text-2xl font-extrabold tracking-tight">{t("native.lockedTitle")}</h1>
        <p className="mt-1 text-sm text-white/85">{t("native.lockedDesc")}</p>
      </div>
      <Button size="lg" onClick={() => void unlock()} disabled={busy} className="h-12 min-w-48 rounded-2xl bg-white text-base text-primary hover:bg-white/90">
        {busy ? <Loader2 className="animate-spin" /> : <Fingerprint />} {t("native.unlock")}
      </Button>
      <form action={logoutAction}>
        <button type="submit" className="min-h-10 px-3 text-sm font-medium text-white/85 underline-offset-4 hover:underline">
          {t("native.signOutInstead")}
        </button>
      </form>
    </div>
  );
}
