"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiMutate } from "@/lib/api-client";
import { getPref, isNativeApp, messaging, nativePlatform, setPref } from "@/lib/native-plugins";
import { useT } from "@/i18n/client";

const DISMISSED = "mh.pushPromptDismissedAt";

async function register(token: string) {
  const platform = nativePlatform();
  if (platform === "web") return;
  await apiMutate({ path: "/me/push-devices", body: { token, platform } }).catch(() => null);
}

/**
 * Phone push notifications (inside the app only):
 * - asks once, in context, whether to turn alerts on (a card, then the system prompt),
 * - registers this phone with the server, and again when Firebase rotates the token,
 * - tapping a notification opens the screen it points to and marks it read,
 * - a notification arriving while the app is open refreshes the bell count.
 */
export function NativePush() {
  const router = useRouter();
  const t = useT();
  const [ask, setAsk] = useState(false);

  useEffect(() => {
    if (!isNativeApp()) return;
    const fm = messaging();
    const handles: Promise<{ remove: () => Promise<void> }>[] = [];
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
        if (Date.now() - dismissed > 30 * 86_400_000) setAsk(true);
      }
    })().catch(() => {});
    return () => handles.forEach((h) => void h.then((x) => x.remove()));
  }, [router]);

  if (!ask) return null;
  const turnOn = async () => {
    setAsk(false);
    const fm = messaging();
    const { receive } = await fm.requestPermissions().catch(() => ({ receive: "denied" as const }));
    if (receive !== "granted") return void setPref(DISMISSED, String(Date.now()));
    const { token } = await fm.getToken();
    if (token) await register(token);
  };
  return (
    <div role="dialog" aria-labelledby="push-title" className="fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-md rounded-2xl bg-card p-4 shadow-xl ring-1 ring-foreground/10 md:bottom-6">
      <button type="button" aria-label={t("native.notNow")} onClick={() => (setAsk(false), void setPref(DISMISSED, String(Date.now())))} className="absolute top-2 right-2 rounded-full p-2 text-muted-foreground hover:bg-muted">
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
        <Button variant="ghost" className="flex-1" onClick={() => (setAsk(false), void setPref(DISMISSED, String(Date.now())))}>
          {t("native.notNow")}
        </Button>
        <Button className="flex-1" onClick={() => void turnOn()}>
          {t("native.turnOn")}
        </Button>
      </div>
    </div>
  );
}
