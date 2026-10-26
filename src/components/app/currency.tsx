"use client";

import { createContext, useContext, type ReactNode } from "react";
import { moneyFmt, type MoneyFmt } from "@/lib/currency";

const Ctx = createContext<MoneyFmt>(moneyFmt("INR"));

/** Gives client components the Mandal's currency (set once in the org layout). */
export function CurrencyProvider({ currency, children }: { currency?: string | null; children: ReactNode }) {
  return <Ctx.Provider value={moneyFmt(currency)}>{children}</Ctx.Provider>;
}

/** The Mandal's money formatter: m.fmt(paise), m.short(paise), m.compact(paise), m.symbol */
export function useMoney(): MoneyFmt {
  return useContext(Ctx);
}
