"use client";

import { useT } from "@/i18n/client";
import { useMoney } from "@/components/app/currency";
import { FormNote } from "@/components/app/form-bits";

const RATE = /^\d{1,3}(\.\d{1,4})?$/;

/** The installment a new upad will get: whole rupees, rounded up (the last one is what's left) — same as the server. */
export function installmentPaise(amountPaise: number, count: number) {
  return Math.ceil(amountPaise / count / 100) * 100;
}

/** "To be returned in 10 monthly installments of ₹8,000 … first month ₹8,000 + ₹800 interest". */
export function InstallmentPlanNote({ amountPaise, rate, installments }: { amountPaise: number; rate: string; installments?: { enabled: boolean; count: number } }) {
  const t = useT();
  const money = useMoney();
  if (!installments?.enabled || amountPaise <= 0) return null;
  const per = Math.min(amountPaise, installmentPaise(amountPaise, installments.count));
  const interest = RATE.test(rate) ? Math.round((amountPaise * Number(rate)) / 100) : 0;
  return <FormNote tone="warn">{t("upad.installmentPlan", { n: installments.count, amount: money.fmt(per), interest: money.fmt(interest), total: money.fmt(per + interest) })}</FormNote>;
}
