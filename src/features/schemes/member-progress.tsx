"use client";

import { ChevronDown } from "lucide-react";
import { Money } from "@/components/app/money";
import { useMoney } from "@/components/app/currency";
import { formatDate } from "@/lib/format";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

export type ScheduleItem = { sequence: number; periodLabel: string; dueDate: string; amountPaise: number; paidPaise: number; status: "paid" | "partially_paid" | "overdue" | "due" | "upcoming" };
export type EnrollmentProgress = { installmentCount: number; paidCount: number; paidThrough: string | null; nextDue: { periodLabel: string; dueDate: string; outstandingPaise: number } | null; schedule: ScheduleItem[] };

const CHIP: Record<ScheduleItem["status"], string> = {
  paid: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300",
  partially_paid: "bg-sky-500/12 text-sky-700 ring-sky-500/25 dark:text-sky-300",
  overdue: "bg-rose-500/12 text-rose-700 ring-rose-500/25 dark:text-rose-300",
  due: "bg-amber-500/15 text-amber-800 ring-amber-500/30 dark:text-amber-300",
  upcoming: "bg-card text-muted-foreground ring-foreground/10",
};

/**
 * "3 of 12 paid · up to Dec 2026" — tap to see every month of the member's schedule,
 * including months already paid in advance. Used on the scheme page and "My savings".
 */
export function MemberProgress({ e, defaultOpen = false }: { e: EnrollmentProgress; defaultOpen?: boolean }) {
  const t = useT();
  const money = useMoney();
  if (!e.installmentCount) return null;
  const pct = Math.round((e.paidCount / e.installmentCount) * 100);
  const word = (s: ScheduleItem["status"]) => t(`status.${s}`);
  return (
    <details className="group mt-1 [&_summary::-webkit-details-marker]:hidden" open={defaultOpen || undefined}>
      <summary className="flex cursor-pointer list-none items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
        <span className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-muted" aria-hidden>
          <span className="block h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
        </span>
        <span>
          <b className="font-semibold text-foreground">{t("my.ofPaid", { paid: e.paidCount, total: e.installmentCount })}</b>
          {e.paidThrough ? ` · ${t("my.upTo", { label: e.paidThrough })}` : ""}
        </span>
        <ChevronDown className="size-3.5 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-2 flex flex-col gap-2">
        <ul className="flex flex-wrap gap-1.5" aria-label="Installments">
          {e.schedule.map((i) => (
            <li key={i.sequence} title={`${i.periodLabel} · ${formatDate(i.dueDate)} · ${word(i.status)}`} className={cn("flex flex-col rounded-lg px-2 py-1 text-[11px] leading-tight ring-1", CHIP[i.status])}>
              <span className="font-semibold">{i.periodLabel}</span>
              <span className="capitalize opacity-80">
                {i.status === "partially_paid" ? (
                  <>
                    <Money paise={i.paidPaise} /> / <Money paise={i.amountPaise} />
                  </>
                ) : (
                  word(i.status)
                )}
              </span>
            </li>
          ))}
        </ul>
        {e.nextDue && <p className="text-xs text-muted-foreground">{t("my.nextDue", { label: e.nextDue.periodLabel, amount: money.fmt(e.nextDue.outstandingPaise), date: formatDate(e.nextDue.dueDate) })}</p>}
      </div>
    </details>
  );
}
