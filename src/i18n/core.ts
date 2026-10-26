/**
 * Tiny i18n: dictionaries are plain nested objects (English is the source of truth, Gujarati must
 * have every key). t("monthly.collectedIn", { month: "Oct 2026" }) fills {month}.
 * Money and numbers keep Indian formatting (₹1,00,000) in every language.
 */
import { en } from "./dict/en";
import { gu } from "./dict/gu";
import { hi } from "./dict/hi";

export type Lang = "en" | "gu" | "hi";
export const LANGS: { code: Lang; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
];
export const LANG_COOKIE = "mh_lang";
export const isLang = (v: unknown): v is Lang => v === "en" || v === "gu" || v === "hi";

type Leaves<T, P extends string = ""> = { [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`> }[keyof T & string];
export type Key = Leaves<typeof en>;
type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };
export type Dict = Widen<typeof en>;

const DICTS: Record<Lang, Dict> = { en, gu, hi };

export type Vars = Record<string, string | number>;
export type T = (key: Key, vars?: Vars) => string;

function lookup(d: Dict, key: string): string | undefined {
  let cur: unknown = d;
  for (const part of key.split(".")) cur = (cur as Record<string, unknown> | undefined)?.[part];
  return typeof cur === "string" ? cur : undefined;
}

export function makeT(lang: Lang): T {
  return (key, vars) => {
    const raw = lookup(DICTS[lang], key) ?? lookup(DICTS.en, key) ?? key;
    return vars ? raw.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`)) : raw;
  };
}

/** Intl locale for month names etc. */
export const intlLocale = (lang: Lang) => (lang === "gu" ? "gu-IN" : lang === "hi" ? "hi-IN" : "en-IN");

/** "October 2026" / "ઑક્ટોબર 2026" for a YYYY-MM month */
export function monthName(lang: Lang, ym: string, style: "long" | "short" = "long") {
  return new Intl.DateTimeFormat(intlLocale(lang), { month: style, year: "numeric", timeZone: "UTC", numberingSystem: "latn" }).format(new Date(`${ym}-01T00:00:00Z`));
}
