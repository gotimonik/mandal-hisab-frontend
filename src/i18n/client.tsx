"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { translator, type Dict, type Lang, type T } from "./core";
import { useMoney } from "@/components/app/currency";

const Ctx = createContext<{ lang: Lang; dict?: Dict }>({ lang: "en" });

/**
 * Provides the language to client components; set from the server (cookie) so there's no flash.
 * `dict` is that language's dictionary from the server (omitted for English, which is bundled).
 */
export function I18nProvider({ lang, dict, children }: { lang: Lang; dict?: Dict; children: ReactNode }) {
  const value = useMemo(() => ({ lang, dict }), [lang, dict]);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return <Ctx value={value}>{children}</Ctx>;
}

/** Translator for client components; {cur} is filled with the Mandal's currency symbol. */
export function useT(): T {
  const { dict } = useContext(Ctx);
  const money = useMoney();
  return useMemo(() => translator(dict, { cur: money.symbol }), [dict, money]);
}
export const useLang = () => useContext(Ctx).lang;
/** The current language's dictionary (undefined for English). */
export const useDict = () => useContext(Ctx).dict;
