"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { makeT, type Lang, type T } from "./core";

const Ctx = createContext<{ lang: Lang; t: T }>({ lang: "en", t: makeT("en") });

/** Provides the language to client components; set from the server (cookie) so there's no flash. */
export function I18nProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const value = useMemo(() => ({ lang, t: makeT(lang) }), [lang]);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return <Ctx value={value}>{children}</Ctx>;
}

export const useT = () => useContext(Ctx).t;
export const useLang = () => useContext(Ctx).lang;
