"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { APP_START, NATIVE_APP_UA } from "@/lib/native";

/**
 * Backup for website-only pages inside the iOS / Android app (src/proxy.ts normally redirects
 * on the server). The inline script covers full page loads before anything paints; the effect
 * covers in-app navigation, where inline scripts don't run.
 */
export function NativeRedirect() {
  useEffect(() => {
    if (Capacitor.isNativePlatform() || navigator.userAgent.includes(NATIVE_APP_UA)) {
      document.documentElement.style.visibility = "hidden";
      window.location.replace(APP_START);
    }
  }, []);
  const js = `try{var C=window.Capacitor;if(navigator.userAgent.indexOf(${JSON.stringify(NATIVE_APP_UA)})>-1||(C&&C.isNativePlatform&&C.isNativePlatform())){document.documentElement.style.visibility="hidden";location.replace(${JSON.stringify(APP_START)})}}catch(e){}`;
  return <script dangerouslySetInnerHTML={{ __html: js }} suppressHydrationWarning />;
}
