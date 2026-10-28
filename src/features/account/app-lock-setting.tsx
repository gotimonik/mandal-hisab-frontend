"use client";

import { useEffect, useState } from "react";
import { Fingerprint } from "lucide-react";
import { toast } from "sonner";
import { biometric, isNativeApp } from "@/lib/native-plugins";
import { lockEnabled, setLockEnabled, verify } from "@/components/app/app-lock";
import { IconChip } from "@/components/app/bits";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

/** Account page, app only: lock MandalHisab with Face ID / Touch ID / fingerprint on this phone. */
export function AppLockSetting() {
  const t = useT();
  const [state, setState] = useState<{ available: boolean; on: boolean; kind: string } | null>(null);
  useEffect(() => {
    if (!isNativeApp()) return;
    (async () => {
      const r = await biometric().isAvailable({ useFallback: true }).catch(() => null);
      // biometryType: 1 Touch ID, 2 Face ID, 3 fingerprint, 4 face, 5 iris (see the plugin's BiometryType)
      const kind = r?.biometryType === 2 ? "Face ID" : r?.biometryType === 1 ? "Touch ID" : t("native.fingerprint");
      setState({ available: !!r?.isAvailable, on: await lockEnabled(), kind });
    })().catch(() => {});
  }, [t]);
  if (!state) return null;

  const toggle = async () => {
    const next = !state.on;
    // turning it on (or off) needs one successful check, so nobody else can change it
    if (!(await verify(next ? t("native.confirmOn") : t("native.confirmOff")))) return;
    await setLockEnabled(next);
    setState({ ...state, on: next });
    toast.success(next ? t("native.lockOnToast") : t("native.lockOffToast"));
  };

  return (
    <section className="mb-4 rounded-2xl bg-card p-4 shadow-card ring-1 ring-foreground/[0.06] sm:p-5">
      <div className="flex items-start gap-3">
        <IconChip tone="violet">
          <Fingerprint />
        </IconChip>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">{t("native.lockTitle", { kind: state.kind })}</h2>
          <p className="text-sm text-muted-foreground">{state.available ? t("native.lockDesc") : t("native.lockUnavailable")}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={state.on}
          aria-label={t("native.lockTitle", { kind: state.kind })}
          disabled={!state.available}
          onClick={() => void toggle()}
          className={cn("relative mt-1 h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-40", state.on ? "bg-primary" : "bg-muted ring-1 ring-foreground/15")}
        >
          <span className={cn("absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow transition-transform", state.on && "translate-x-5")} />
        </button>
      </div>
    </section>
  );
}
