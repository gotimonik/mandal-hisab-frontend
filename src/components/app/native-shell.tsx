"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

/**
 * Only does something inside the iOS / Android app (Capacitor); on the website it renders nothing.
 * - Android back button: closes an open dialog/sheet first, then goes back, and leaves the app on the first screen.
 * - Status bar text follows light / dark mode.
 * - Adds `native-app` / `native-ios` / `native-android` classes to <html> for app-only styling.
 */
export function NativeShell() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const html = document.documentElement;
    html.classList.add("native-app", `native-${Capacitor.getPlatform()}`);
    const cleanups: (() => void)[] = [];

    (async () => {
      const { App } = await import("@capacitor/app");
      const back = await App.addListener("backButton", ({ canGoBack }) => {
        const dialog = document.querySelector('[role="dialog"], [role="alertdialog"]');
        if (dialog) {
          (document.activeElement ?? document).dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true }));
          return;
        }
        if (canGoBack) window.history.back();
        else void App.exitApp();
      });
      cleanups.push(() => void back.remove());

      const { StatusBar, Style } = await import("@capacitor/status-bar");
      const sync = () => void StatusBar.setStyle({ style: html.classList.contains("dark") ? Style.Dark : Style.Light }).catch(() => {});
      sync();
      const obs = new MutationObserver(sync);
      obs.observe(html, { attributes: true, attributeFilter: ["class"] });
      cleanups.push(() => obs.disconnect());
    })();

    return () => cleanups.forEach((f) => f());
  }, []);
  return null;
}
