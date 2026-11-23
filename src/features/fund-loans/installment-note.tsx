"use client";

import { Input } from "@/components/ui/input";
import { Field } from "@/components/app/field";
import { useLang, useT } from "@/i18n/client";
import { monthName } from "@/i18n/core";
import { useMoney } from "@/components/app/currency";
import { FormNote } from "@/components/app/form-bits";

const RATE = /^\d{1,3}(\.\d{1,4})?$/;
export const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

export type InstallmentSetting = { enabled: boolean; count: number; minAmountPaise?: number };

/** The installment a new upad will get: whole rupees, rounded up (the last one is what's left) — same as the server. */
export function installmentPaise(amountPaise: number, count: number) {
  return Math.ceil(amountPaise / count / 100) * 100;
}

/** Whether an upad of this amount gets installments: setting on and more than the Mandal's limit (same as the server). */
export function installmentsApply(amountPaise: number, s?: InstallmentSetting) {
  return !!s?.enabled && amountPaise > 0 && amountPaise > (s.minAmountPaise ?? 0);
}

/** "2026-11" → "2026-12" */
export function addMonths(month: string, n: number) {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7);
}

/** Month picker for the first installment. */
export function InstallmentStartField({ id, value, onChange, min }: { id: string; value: string; onChange: (v: string) => void; min: string }) {
  const lang = useLang();
  const t = useT();
  return (
    <Field label={t("ax.firstInst")} htmlFor={id} hint={MONTH.test(value) ? monthName(lang, value) : undefined}>
      <Input id={id} type="month" min={min} max={addMonths(min, 24)} value={value} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

/** "To be returned in 10 monthly installments of ₹8,000 … first month ₹8,000 + ₹800 interest". */
export function InstallmentPlanNote({ amountPaise, rate, installments, startMonth }: { amountPaise: number; rate: string; installments?: InstallmentSetting; startMonth?: string }) {
  const t = useT();
  const lang = useLang();
  const money = useMoney();
  if (!installments || !installmentsApply(amountPaise, installments)) return null;
  const per = Math.min(amountPaise, installmentPaise(amountPaise, installments.count));
  const interest = RATE.test(rate) ? Math.round((amountPaise * Number(rate)) / 100) : 0;
  return (
    <FormNote tone="warn">
      {t("upad.installmentPlan", { n: installments.count, amount: money.fmt(per), interest: money.fmt(interest), total: money.fmt(per + interest) })}
      {startMonth && MONTH.test(startMonth) ? ` (${monthName(lang, startMonth)} →)` : ""}
    </FormNote>
  );
}
