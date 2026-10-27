"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

/** Inside the iOS / Android app the home page is skipped: go straight to the user's Mandal (or sign in). */
export function NativeRedirect() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) window.location.replace("/onboarding?auto=1");
  }, []);
  return null;
}
