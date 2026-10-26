import "server-only";
import { cookies } from "next/headers";
import { isLang, LANG_COOKIE, makeT, type Lang } from "./core";

/** The signed-in person's language (cookie), for Server Components and Server Actions. */
export async function getLang(): Promise<Lang> {
  const v = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(v) ? v : "en";
}

export async function getT() {
  const lang = await getLang();
  return { t: makeT(lang), lang };
}
