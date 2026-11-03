import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ProgressBar } from "@/components/app/bits";
import { formatINR } from "@/lib/format";
import type { T } from "@/i18n/core";

/** White rounded card used across Personal Hisab pages. */
export function Card({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={cn("rounded-2xl bg-card p-4 shadow-card ring-1 ring-foreground/[0.06] sm:p-5", className)}>
      {children}
    </section>
  );
}

/** Spent vs budget: green, amber from 80 %, red when over. */
export function BudgetBar({ label, spent, budget, t, icon }: { label: ReactNode; spent: number; budget: number; t: T; icon?: ReactNode }) {
  const over = spent > budget;
  const pct = budget ? (spent / budget) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-sm">
        <span className="flex min-w-0 items-center gap-2 truncate font-medium">
          {icon}
          <span className="truncate">{label}</span>
        </span>
        <span className={cn("shrink-0 text-xs font-semibold", over ? "text-destructive" : pct >= 80 ? "text-warning-ink" : "text-muted-foreground")}>
          {over ? t("ph.budget.over", { amount: formatINR(spent - budget) }) : t("ph.budget.left", { amount: formatINR(budget - spent) })}
        </span>
      </div>
      <ProgressBar value={pct} className="h-2" barClassName={over ? "bg-destructive" : pct >= 80 ? "bg-amber-500" : "bg-emerald-500"} label={typeof label === "string" ? label : undefined} />
      <p className="mt-0.5 text-[11px] text-muted-foreground">{t("ph.budget.of", { spent: formatINR(spent), budget: formatINR(budget) })}</p>
    </div>
  );
}

export const thisMonthRange = (today: string) => ({ from: `${today.slice(0, 7)}-01`, to: today });
/** First day of the month `n` months before `today`'s month. */
export function monthsBack(today: string, n: number) {
  const d = new Date(Date.UTC(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1 - n, 1));
  return d.toISOString().slice(0, 10);
}
