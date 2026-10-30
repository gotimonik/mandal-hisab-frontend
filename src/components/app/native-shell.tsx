"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { APP_START, isWebOnlyPath } from "@/lib/native";

/**
 * Only does something inside the iOS / Android app (Capacitor); on the website it renders nothing.
 * - Hides the launch splash once the page has loaded.
 * - Stops links to website-only pages (e.g. the logo) from opening them in the app.
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

    // Website-only pages (home, features, download, about, FAQ) never open in the app.
    // Links to them — like the logo (href="/") — do nothing on sign-in pages and go to the Mandal elsewhere.
    const AUTH = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || !isWebOnlyPath(url.pathname)) return;
      e.preventDefault();
      e.stopPropagation();
      if (!AUTH.includes(window.location.pathname)) window.location.assign(APP_START);
    };
    document.addEventListener("click", onClick, { capture: true });
    cleanups.push(() => document.removeEventListener("click", onClick, { capture: true }));

    (async () => {
      // The page has loaded: take down the launch splash (app icon on purple).
      const { SplashScreen } = await import("@capacitor/splash-screen");
      void SplashScreen.hide({ fadeOutDuration: 300 }).catch(() => {});

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
