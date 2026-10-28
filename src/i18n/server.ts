import "server-only";
import { cookies } from "next/headers";
import { isLang, LANG_COOKIE, type Lang } from "./core";
import { makeT } from "./dicts";

/** The signed-in person's language (cookie), for Server Components and Server Actions. */
export async function getLang(): Promise<Lang> {
  const v = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(v) ? v : "en";
}

export async function getT() {
  const lang = await getLang();
  return { t: makeT(lang), lang };
}

/** Has this device picked a language (rather than falling back to English)? */
export async function hasLangCookie() {
  return isLang((await cookies()).get(LANG_COOKIE)?.value);
}
