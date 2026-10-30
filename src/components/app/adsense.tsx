"use client";

import { useSyncExternalStore } from "react";
import Script from "next/script";
import { Capacitor } from "@capacitor/core";
import { site } from "@/config/site";
import { NATIVE_APP_UA } from "@/lib/native";

/**
 * Google AdSense (Auto ads) for the public website pages only. Rendered from the public
 * layout, so it never loads on sign-in pages or inside a Mandal, and it never loads inside
 * the iOS / Android app. Off until `site.ads.adsenseClientId` is set, and production only.
 */
export function AdSense() {
  const load = useSyncExternalStore(
    () => () => {},
    () => !Capacitor.isNativePlatform() && !navigator.userAgent.includes(NATIVE_APP_UA),
    () => false,
  );
  const client = site.ads.adsenseClientId;
  if (!load || !client || process.env.NODE_ENV !== "production") return null;
  return <Script id="adsense" async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`} crossOrigin="anonymous" strategy="lazyOnload" />;
}
