"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ArrowRight, HandCoins, PiggyBank } from "lucide-react";
import { cn } from "@/lib/utils";

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const num = (s: string) => {
  const n = Number(s.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

function Field({ label, value, onChange, suffix, prefix, hint }: { label: string; value: string; onChange: (v: string) => void; suffix?: string; prefix?: string; hint?: string }) {
  const id = useId();
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <div className="flex h-12 items-center gap-1.5 rounded-xl bg-background px-3.5 ring-1 ring-foreground/15 focus-within:ring-2 focus-within:ring-primary">
        {prefix && <span className="text-muted-foreground">{prefix}</span>}
        <input id={id} inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} className="min-w-0 flex-1 bg-transparent text-base font-semibold tabular-nums outline-none" />
        {suffix && <span className="shrink-0 text-sm text-muted-foreground">{suffix}</span>}
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Result({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5 rounded-2xl p-3.5", big ? "bg-white/15 ring-1 ring-white/25" : "")}>
      <p className="text-xs font-medium text-white/80">{label}</p>
      <p className={cn("font-extrabold tracking-tight tabular-nums", big ? "text-3xl" : "text-xl")}>{value}</p>
    </div>
  );
}

function UpadCalc() {
  const [amount, setAmount] = useState("20000");
  const [rate, setRate] = useState("1");
  const [months, setMonths] = useState("6");
  const a = num(amount);
  const r = num(rate);
  const m = Math.min(Math.round(num(months)), 600);
  const perMonth = (a * r) / 100;
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.1fr]">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
        <Field label="Upad amount" prefix="₹" value={amount} onChange={setAmount} />
        <Field label="Interest rate" suffix="% / month" value={rate} onChange={setRate} hint={r ? `Same as ${(r * 12).toLocaleString("en-IN", { maximumFractionDigits: 2 })}% a year` : undefined} />
        <Field label="Months until returned" suffix="months" value={months} onChange={setMonths} />
      </div>
      <div className="bg-hero relative flex flex-col justify-center overflow-hidden rounded-3xl p-4 text-white sm:p-6">
        <div aria-hidden className="pointer-events-none absolute -top-16 -right-14 size-48 rounded-full bg-white/10" />
        <div className="relative grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <Result big label="Interest every month" value={inr(perMonth)} />
          </div>
          <Result label={`Total interest (${m} months)`} value={inr(perMonth * m)} />
          <Result label="Total paid back" value={inr(a + perMonth * m)} />
        </div>
        <p className="relative mt-3 text-xs leading-5 text-white/80">
          Interest is charged on the amount still outstanding, from the month after the upad is given. Returning part of it early lowers the interest from the next month — and the interest is shared
          with every member.
        </p>
      </div>
    </div>
  );
}

function SavingsCalc() {
  const [members, setMembers] = useState("30");
  const [hapta, setHapta] = useState("1000");
  const [years, setYears] = useState("3");
  const n = Math.round(num(members));
  const h = num(hapta);
  const y = Math.min(num(years), 50);
  const months = Math.round(y * 12);
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.1fr]">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
        <Field label="Members" value={members} onChange={setMembers} suffix="members" />
        <Field label="Monthly hapta per member" prefix="₹" value={hapta} onChange={setHapta} />
        <Field label="How long the Mandal runs" value={years} onChange={setYears} suffix="years" />
      </div>
      <div className="bg-hero-green relative flex flex-col justify-center overflow-hidden rounded-3xl p-4 text-white sm:p-6">
        <div aria-hidden className="pointer-events-none absolute -top-16 -right-14 size-48 rounded-full bg-white/10" />
        <div className="relative grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <Result big label={`Collected over ${months} months`} value={inr(n * h * months)} />
          </div>
          <Result label="Collected every month" value={inr(n * h)} />
          <Result label="Each member saves" value={inr(h * months)} />
        </div>
        <p className="relative mt-3 text-xs leading-5 text-white/80">
          Hapta only, before any interest. Interest earned on upad is added to members&apos; savings on top of this, so each member gets back more than they put in.
        </p>
      </div>
    </div>
  );
}

const TABS = [
  { id: "upad", label: "Upad interest", icon: <HandCoins /> },
  { id: "savings", label: "Mandal savings", icon: <PiggyBank /> },
] as const;

/** Small, useful calculator on the home page: upad interest, and how much a Mandal collects. */
export function HisabCalculator() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("upad");
  return (
    <div className="rounded-3xl bg-card p-4 shadow-card ring-1 ring-foreground/[0.06] sm:p-6">
      <div role="tablist" aria-label="Calculator" className="mb-5 inline-flex w-full gap-1 rounded-2xl bg-muted p-1 sm:w-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl px-2.5 text-sm whitespace-nowrap sm:gap-2 sm:px-4 font-semibold text-muted-foreground transition sm:flex-none [&_svg]:size-4",
              tab === t.id && "bg-card text-foreground shadow-sm",
            )}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">{tab === "upad" ? <UpadCalc /> : <SavingsCalc />}</div>
      <p className="mt-4 text-sm text-muted-foreground">
        MandalHisab does this for every member, every month, automatically.{" "}
        <Link href="/guides/how-upad-interest-is-calculated" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
          How interest works <ArrowRight className="size-3.5" />
        </Link>
      </p>
    </div>
  );
}
