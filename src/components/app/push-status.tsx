"use client";

import { useCallback, useEffect, useState } from "react";
import { BellOff, BellRing, CheckCircle2, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { IconChip } from "@/components/app/bits";
import { getPref, isNativeApp, messaging, nativePlatform } from "@/lib/native-plugins";
import { enablePush, PROMPT_AGAIN_MS, PUSH_CHANGED, PUSH_PROMPT_DISMISSED } from "@/components/app/native-push";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

type State = "web" | "on" | "off" | "blocked";

/** Are alerts on for this phone? ("web" on the website, where there are no phone alerts.) */
async function readPushState(): Promise<{ state: State; promptShowing: boolean }> {
  if (!isNativeApp()) return { state: "web", promptShowing: false };
  const { receive } = await messaging().checkPermissions();
  if (receive === "granted") return { state: "on", promptShowing: false };
  if (receive === "denied") return { state: "blocked", promptShowing: false };
  // the one-off "Get alerts" card is on screen right now: don't show two
  const dismissed = Number((await getPref(PUSH_PROMPT_DISMISSED)) ?? 0);
  return { state: "off", promptShowing: Date.now() - dismissed > PROMPT_AGAIN_MS };
}

function usePushState() {
  const [s, setS] = useState<{ state: State; promptShowing: boolean } | null>(null);
  const check = useCallback(() => readPushState().then(setS, () => {}), []);
  useEffect(() => {
    void check();
    // back from the phone's Settings, or alerts turned on / refused elsewhere on screen
    const onChange = () => void check();
    window.addEventListener(PUSH_CHANGED, onChange);
    const appState = import("@capacitor/app").then(({ App }) => App.addListener("appStateChange", ({ isActive }) => isActive && onChange())).catch(() => null);
    return () => {
      window.removeEventListener(PUSH_CHANGED, onChange);
      void appState.then((h) => h?.remove());
    };
  }, [check]);
  return { state: s?.state ?? null, promptShowing: s?.promptShowing ?? false, check };
}

/**
 * Tells people to keep phone notifications on, so they hear about meetings, hapta, upad and
 * payments. Where it shows:
 * - "full" (Account, Notifications): always, with the current state, a Turn on button or the
 *   steps in the phone's Settings when they've been blocked.
 * - "nudge" (dashboard): only when alerts are off, as a short reminder.
 */
export function PushStatus({ variant = "full", hideOnWeb = false, className }: { variant?: "full" | "nudge"; hideOnWeb?: boolean; className?: string }) {
  const t = useT();
  const { state, promptShowing, check } = usePushState();
  const [busy, setBusy] = useState(false);
  if (!state) return null;
  if (variant === "nudge" && (state === "on" || state === "web" || (state === "off" && promptShowing))) return null;

  const turnOn = async () => {
    setBusy(true);
    const on = await enablePush().catch(() => false);
    setBusy(false);
    if (on) toast.success(t("native.pushOnToast"));
    window.dispatchEvent(new Event(PUSH_CHANGED));
    await check();
  };

  if (state === "web") {
    if (hideOnWeb) return null;
    return (
      <div className={cn("mb-4 flex items-start gap-3 rounded-2xl bg-muted/50 p-3.5 text-sm", className)}>
        <Smartphone className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-muted-foreground">{t("native.pushWeb")}</p>
      </div>
    );
  }

  if (state === "on") {
    return (
      <section className={cn("mb-4 flex items-start gap-3 rounded-2xl bg-emerald-500/10 p-3.5 ring-1 ring-emerald-500/25", className)}>
        <IconChip tone="emerald" size="sm">
          <CheckCircle2 />
        </IconChip>
        <div className="min-w-0 text-sm">
          <p className="font-semibold">{t("native.pushOnTitle")}</p>
          <p className="text-muted-foreground">{t("native.pushOnDesc")}</p>
        </div>
      </section>
    );
  }

  const blocked = state === "blocked";
  return (
    <section className={cn("mb-4 rounded-2xl bg-amber-500/10 p-3.5 ring-1 ring-amber-500/30", className)} aria-live="polite">
      <div className="flex items-start gap-3">
        <IconChip tone="amber" size="sm">
          {blocked ? <BellOff /> : <BellRing />}
        </IconChip>
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-semibold">{blocked ? t("native.pushBlockedTitle") : t("native.pushOffTitle")}</p>
          <p className="text-muted-foreground">{blocked ? t("native.pushBlockedDesc") : t("native.pushOffDesc")}</p>
          {blocked && <p className="mt-1.5 rounded-lg bg-card px-2.5 py-1.5 text-xs font-medium ring-1 ring-foreground/10">{nativePlatform() === "ios" ? t("native.pushStepsIos") : t("native.pushStepsAndroid")}</p>}
        </div>
        {!blocked && (
          <Button size="sm" className="shrink-0" disabled={busy} onClick={() => void turnOn()}>
            {t("native.turnOn")}
          </Button>
        )}
      </div>
    </section>
  );
}
