"use client";

import { Capacitor, registerPlugin } from "@capacitor/core";
// Types only: the packages' web code (which would pull in the Firebase web SDK) is never bundled.
import type { FirebaseMessagingPlugin } from "@capacitor-firebase/messaging";
import type { NativeBiometricPlugin } from "@capgo/capacitor-native-biometric";

/** True inside the iOS / Android app. */
export const isNativeApp = () => typeof window !== "undefined" && Capacitor.isNativePlatform();
export const nativePlatform = () => Capacitor.getPlatform() as "ios" | "android" | "web";

let fm: FirebaseMessagingPlugin | undefined;
/** Push notifications (Firebase Cloud Messaging). Call only inside the app. */
export const messaging = () => (fm ??= registerPlugin<FirebaseMessagingPlugin>("FirebaseMessaging"));

let bio: NativeBiometricPlugin | undefined;
/** Face ID / Touch ID / fingerprint. Call only inside the app. */
export const biometric = () => (bio ??= registerPlugin<NativeBiometricPlugin>("NativeBiometric"));

let wp: { print(opts: { title?: string }): Promise<unknown> } | undefined;
/** Print / Save as PDF of the current page (the app's own native plugin). Call only inside the app. */
export const webPrint = () => (wp ??= registerPlugin<{ print(opts: { title?: string }): Promise<unknown> }>("WebPrint"));

/** Small app-only settings kept on the phone (lock on/off, prompt dismissed …). */
export async function getPref(key: string) {
  const { Preferences } = await import("@capacitor/preferences");
  return (await Preferences.get({ key })).value;
}
export async function setPref(key: string, value: string | null) {
  const { Preferences } = await import("@capacitor/preferences");
  if (value === null) await Preferences.remove({ key });
  else await Preferences.set({ key, value });
}

/** A light tap on the phone, e.g. after something was saved. No-op on the website. */
export function hapticSuccess() {
  if (!isNativeApp()) return;
  void import("@capacitor/haptics").then(({ Haptics, NotificationType }) => Haptics.notification({ type: NotificationType.Success })).catch(() => {});
}
