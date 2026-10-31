"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiMutate } from "@/lib/api-client";
import { getPref, isNativeApp, messaging, nativePlatform, setPref } from "@/lib/native-plugins";
import { useT } from "@/i18n/client";

export const PUSH_PROMPT_DISMISSED = "mh.pushPromptDismissedAt";
const DISMISSED = PUSH_PROMPT_DISMISSED;
/** The "Turn on alerts" card comes back at most once a month after "Not now". */
/** Fired when alerts are turned on (or refused) so every status card on screen updates. */
export const PUSH_CHANGED = "mh:push-changed";
export const PROMPT_AGAIN_MS = 30 * 86_400_000;

async function register(token: string) {
  const platform = nativePlatform();
  if (platform === "web") return;
  await apiMutate({ path: "/me/push-devices", body: { token, platform } }).catch(() => null);
}

/** Ask the phone for permission and register it. True when alerts are now on. */
export async function enablePush(): Promise<boolean> {
  const fm = messaging();
  const { receive } = await fm.requestPermissions().catch(() => ({ receive: "denied" as const }));
  if (receive !== "granted") return false;
  const { token } = await fm.getToken();
  if (token) await register(token);
  return true;
}

/**
 * Phone push notifications (inside the app only):
 * - asks once, in context, whether to turn alerts on (a card, then the system prompt),
 * - registers this phone with the server, and again when Firebase rotates the token,
 * - tapping a notification opens the screen it points to and marks it read,
 * - a notification arriving while the app is open refreshes the bell count,
 * - opening the app clears its notifications from the tray (and the icon's badge / dot).
 */
export function NativePush() {
  const router = useRouter();
  const t = useT();
  const [ask, setAsk] = useState(false);

  useEffect(() => {
    if (!isNativeApp()) return;
    const fm = messaging();
    const handles: Promise<{ remove: () => Promise<void> }>[] = [];
    // Opening the app clears its notifications from the phone's tray, and with them Android's
    // dot on the app icon (iOS clears the red number natively, in SceneDelegate.swift).
    const clearTray = () => void fm.removeAllDeliveredNotifications().catch(() => {});
    clearTray();
    const appState = import("@capacitor/app").then(({ App }) => App.addListener("appStateChange", ({ isActive }) => isActive && clearTray()));
    handles.push(fm.addListener("tokenReceived", ({ token }) => void register(token)));
    handles.push(fm.addListener("notificationReceived", () => router.refresh()));
    handles.push(
      fm.addListener("notificationActionPerformed", ({ notification }) => {
        const d = (notification.data ?? {}) as { link?: string; notificationId?: string };
        if (d.notificationId) void apiMutate({ path: "/notifications/read", body: { ids: [d.notificationId] } }).catch(() => null);
        if (d.link && d.link.startsWith("/") && !d.link.startsWith("//")) router.push(d.link);
        else router.refresh();
      }),
    );
    (async () => {
      if (nativePlatform() === "android") await fm.createChannel({ id: "default", name: "MandalHisab", description: "Payments, approvals and reminders", importance: 4, visibility: 1 }).catch(() => {});
      const { receive } = await fm.checkPermissions();
      if (receive === "granted") {
        const { token } = await fm.getToken();
        if (token) await register(token);
      } else if (receive !== "denied") {
        // ask again at most once a month if they said "Not now"
        const dismissed = Number((await getPref(DISMISSED)) ?? 0);
        if (Date.now() - dismissed > PROMPT_AGAIN_MS) setAsk(true);
      }
    })().catch(() => {});
    return () => [...handles, appState].forEach((h) => void h.then((x) => x.remove()));
  }, [router]);

  if (!ask) return null;
  const notNow = () => {
    setAsk(false);
    void setPref(DISMISSED, String(Date.now())).then(() => window.dispatchEvent(new Event(PUSH_CHANGED)));
  };
  const turnOn = async () => {
    setAsk(false);
    if (!(await enablePush())) await setPref(DISMISSED, String(Date.now()));
    window.dispatchEvent(new Event(PUSH_CHANGED));
  };
  return (
    <div role="dialog" aria-labelledby="push-title" className="fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-md rounded-2xl bg-card p-4 shadow-xl ring-1 ring-foreground/10 md:bottom-6">
      <button type="button" aria-label={t("native.notNow")} onClick={() => notNow()} className="absolute top-2 right-2 rounded-full p-2 text-muted-foreground hover:bg-muted">
        <X className="size-4" />
      </button>
      <div className="flex items-start gap-3 pr-6">
        <span className="bg-hero flex size-10 shrink-0 items-center justify-center rounded-xl text-white">
          <BellRing className="size-5" />
        </span>
        <div className="min-w-0">
          <p id="push-title" className="font-semibold">{t("native.pushTitle")}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{t("native.pushDesc")}</p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Button variant="ghost" className="flex-1" onClick={() => notNow()}>
          {t("native.notNow")}
        </Button>
        <Button className="flex-1" onClick={() => void turnOn()}>
          {t("native.turnOn")}
        </Button>
      </div>
    </div>
  );
}
