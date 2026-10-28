"use server";

import { cookies } from "next/headers";
import { isLang, LANG_COOKIE, type Lang } from "@/i18n/core";
import { apiCall } from "@/lib/server/api";
import { getSessionToken } from "@/lib/server/session";

const cookieOpts = { httpOnly: false, sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 * 365, secure: process.env.NODE_ENV === "production" };

/**
 * Remember the chosen language on this device (1 year) and, when signed in, on the account —
 * notifications and phone pushes are written in it.
 */
export async function setLanguage(lang: string) {
  if (!isLang(lang)) return { ok: false as const };
  (await cookies()).set(LANG_COOKIE, lang, cookieOpts);
  if (await getSessionToken()) await apiCall("/auth/me", { method: "PATCH", body: { language: lang } }).catch(() => null);
  return { ok: true as const };
}

/**
 * Right after sign-in: the language picked on this device wins and is saved to the account;
 * on a new device with no choice yet, the account's language is used instead.
 */
export async function syncLanguageAfterSignIn(token: string, accountLang: string | null | undefined) {
  const jar = await cookies();
  const here = jar.get(LANG_COOKIE)?.value;
  if (isLang(here)) {
    if (here !== accountLang) await apiCall("/auth/me", { method: "PATCH", body: { language: here }, token }).catch(() => null);
  } else if (isLang(accountLang)) {
    jar.set(LANG_COOKIE, accountLang as Lang, cookieOpts);
  }
}
