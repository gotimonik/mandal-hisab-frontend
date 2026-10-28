import "server-only";
import { en } from "./dict/en";
import { gu } from "./dict/gu";
import { hi } from "./dict/hi";
import { translator, type Dict, type Lang, type Vars } from "./core";

/** Every language — server only. The browser receives just the one in use (see I18nProvider). */
export const DICTS: Record<Lang, Dict> = { en, gu, hi };

export const makeT = (lang: Lang, defaults?: Vars) => translator(DICTS[lang], defaults);

/** What to send to the browser for this language (English is already in the bundle). */
export const clientDict = (lang: Lang): Dict | undefined => (lang === "en" ? undefined : DICTS[lang]);
