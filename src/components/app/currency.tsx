"use client";

import { createContext, use, useContext, type ReactNode } from "react";
import { moneyFmt, type MoneyFmt } from "@/lib/currency";

const Ctx = createContext<MoneyFmt>(moneyFmt("INR"));

type Currency = string | null | undefined;

/**
 * Gives client components the Mandal's currency (set once in the org layout).
 * Accepts a promise so the layout doesn't have to wait for the org before the
 * page underneath starts fetching its own data.
 */
export function CurrencyProvider({ currency, children }: { currency?: Currency | Promise<Currency>; children: ReactNode }) {
  const code = currency instanceof Promise ? use(currency) : currency;
  return <Ctx.Provider value={moneyFmt(code)}>{children}</Ctx.Provider>;
}

/** The Mandal's money formatter: m.fmt(paise), m.short(paise), m.compact(paise), m.symbol */
export function useMoney(): MoneyFmt {
  return useContext(Ctx);
}
