"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { IconChip } from "@/components/app/bits";
import { isNativeApp, messaging, nativePlatform } from "@/lib/native-plugins";
import { enablePush, PUSH_CHANGED, setPushEnabled } from "@/components/app/native-push";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

/** What this phone itself allows (app only; null on the website). */
type Phone = "granted" | "prompt" | "denied" | null;

async function readPhone(): Promise<Phone> {
  if (!isNativeApp()) return null;
  const { receive } = await messaging().checkPermissions();
  return receive === "granted" ? "granted" : receive === "denied" ? "denied" : "prompt";
}

/**
 * Push notifications for the whole account, on the website and in the app.
 * - Off: nothing is pushed to any phone signed in to this account (they still show under the bell).
 * - On: pushes go to every phone with the app. In the app, if this phone hasn't allowed them yet,
 *   it offers to; if they're blocked in the phone's settings, it shows where to turn them on.
 */
export function PushSetting({ initialOn, className }: { initialOn: boolean; className?: string }) {
  const t = useT();
  const router = useRouter();
  const [on, setOn] = useState(initialOn);
  const [phone, setPhone] = useState<Phone>(null);
  const [busy, setBusy] = useState(false);

  const checkPhone = useCallback(() => readPhone().then(setPhone, () => {}), []);

  useEffect(() => {
    if (!isNativeApp()) return;
    void checkPhone();
    const onChange = () => void checkPhone();
    window.addEventListener(PUSH_CHANGED, onChange);
    // back from the phone's Settings app
    const appState = import("@capacitor/app").then(({ App }) => App.addListener("appStateChange", ({ isActive }) => isActive && onChange())).catch(() => null);
    return () => {
      window.removeEventListener(PUSH_CHANGED, onChange);
      void appState.then((h) => h?.remove());
    };
  }, [checkPhone]);

  const toggle = async () => {
    if (busy) return;
    const next = !on;
    setBusy(true);
    setOn(next);
    const saved = await setPushEnabled(next).catch(() => false);
    if (!saved) {
      setOn(!next);
      setBusy(false);
      toast.error(t("native.pushSaveFailed"));
      return;
    }
    // turning on in the app: ask this phone too, if it hasn't been asked yet
    if (next && phone === "prompt") await enablePush().catch(() => false);
    await checkPhone();
    setBusy(false);
    toast.success(next ? t("native.pushOnToast") : t("native.pushOffToast"));
    router.refresh();
  };

  const allowHere = async () => {
    setBusy(true);
    const ok = await enablePush().catch(() => false);
    await checkPhone();
    setBusy(false);
    if (ok) toast.success(t("native.pushOnToast"));
    else toast.error(t("native.pushNotAllowed"));
  };

  return (
    <section className={cn("rounded-2xl bg-card p-4 shadow-card ring-1 ring-foreground/[0.06] sm:p-5", className)}>
      <div className="flex items-start gap-3">
        <IconChip tone={on ? "emerald" : "amber"}>{on ? <Bell /> : <BellOff />}</IconChip>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">{t("native.pushSettingTitle")}</h2>
          <p className="text-sm text-muted-foreground">{on ? t("native.pushSettingOn") : t("native.pushSettingOff")}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={t("native.pushSettingTitle")}
          disabled={busy}
          onClick={() => void toggle()}
          className={cn("relative mt-1 h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-60", on ? "bg-primary" : "bg-muted ring-1 ring-foreground/15")}
        >
          <span className={cn("absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow transition-transform", on && "translate-x-5")} />
        </button>
      </div>

      {on && phone === "denied" && (
        <div className="mt-3 rounded-xl bg-amber-500/10 px-3 py-2.5 text-xs ring-1 ring-amber-500/25">
          <p className="font-semibold">{t("native.pushBlockedTitle")}</p>
          <p className="mt-0.5 text-muted-foreground">{nativePlatform() === "ios" ? t("native.pushStepsIos") : t("native.pushStepsAndroid")}</p>
        </div>
      )}
      {on && phone === "prompt" && (
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-amber-500/10 px-3 py-2.5 text-xs ring-1 ring-amber-500/25">
          <p className="min-w-0 flex-1 text-muted-foreground">{t("native.pushPhoneNotAllowed")}</p>
          <Button size="sm" disabled={busy} onClick={() => void allowHere()}>
            {t("native.turnOn")}
          </Button>
        </div>
      )}
      {on && phone === null && (
        <p className="mt-3 text-xs text-muted-foreground">
          {t("native.pushSettingWeb")}{" "}
          <Link href="/download" className="font-semibold whitespace-nowrap text-primary hover:underline">
            {t("native.getApp")}
          </Link>
        </p>
      )}
    </section>
  );
}
