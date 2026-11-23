"use client";

import { useSyncExternalStore } from "react";
import { SectionTitle } from "@/components/app/bits";
import { isNativeApp } from "@/lib/native-plugins";
import { useT } from "@/i18n/client";
import { AppLockSetting } from "./app-lock-setting";

const noSubscribe = () => () => {};

/** Account page, app only: settings that belong to this phone (Face ID / fingerprint lock). */
export function PhoneSettings() {
  const t = useT();
  // false while rendering on the server, so the website never shows this
  const native = useSyncExternalStore(noSubscribe, isNativeApp, () => false);
  if (!native) return null;
  return (
    <div className="mb-5">
      <SectionTitle>{t("native.thisPhone")}</SectionTitle>
      <div className="[&>section]:mb-0">
        <AppLockSetting />
      </div>
    </div>
  );
}
