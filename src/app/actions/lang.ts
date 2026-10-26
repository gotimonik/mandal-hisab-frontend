"use server";

import { cookies } from "next/headers";
import { isLang, LANG_COOKIE } from "@/i18n/core";

/** Remember the chosen language on this device (1 year). */
export async function setLanguage(lang: string) {
  if (!isLang(lang)) return { ok: false as const };
  (await cookies()).set(LANG_COOKIE, lang, { httpOnly: false, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365, secure: process.env.NODE_ENV === "production" });
  return { ok: true as const };
}
