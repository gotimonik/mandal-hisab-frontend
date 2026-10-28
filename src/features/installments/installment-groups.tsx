import Link from "next/link";
import { CalendarCheck2, ChevronRight, Users } from "lucide-react";
import { Money } from "@/components/app/money";
import { IconChip, MemberAvatar, ProgressBar } from "@/components/app/bits";
import { FREQUENCY_LABEL, formatDate, label } from "@/lib/format";
import { cn } from "@/lib/utils";

export type InstallmentGroup = {
  _id: string;
  name: string;
  membershipNumber?: string;
  frequency?: string;
  amountPaise?: number;
  count: number;
  paidCount: number;
  others: number;
  plannedPaise: number;
  paidPaise: number;
  outstandingPaise: number;
  overduePaise: number;
  overdueCount: number;
  upcomingPaise: number;
  paidAheadPaise: number;
  nextDue: string | null;
};

/** One card per scheme or per member; tapping it opens that scheme's / member's installments. */
export function InstallmentGroups({ by, items, hrefFor }: { by: "scheme" | "member"; items: InstallmentGroup[]; hrefFor: (g: InstallmentGroup) => string }) {
  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3" aria-label={by === "scheme" ? "Installments by scheme" : "Installments by member"}>
      {items.map((g) => {
        const pct = g.plannedPaise > 0 ? Math.round((g.paidPaise / g.plannedPaise) * 100) : 0;
        return (
          <li key={g._id}>
            <Link
              href={hrefFor(g)}
              className={cn("group flex h-full flex-col rounded-2xl bg-card p-4 shadow-card ring-1 ring-foreground/[0.06] transition-shadow hover:ring-primary/30", g.overdueCount > 0 && "ring-2 ring-rose-400/40")}
            >
              <div className="flex items-start gap-3">
                {by === "scheme" ? (
                  <IconChip tone="violet">
                    <CalendarCheck2 />
                  </IconChip>
                ) : (
                  <MemberAvatar name={g.name} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold group-hover:text-primary">{g.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {by === "scheme" ? (
                      <>
                        {label(FREQUENCY_LABEL, g.frequency ?? "")}
                        {g.amountPaise ? <> · <Money paise={g.amountPaise} short /></> : null}
                      </>
                    ) : (
                      <>
                        {g.membershipNumber} · {g.others} scheme{g.others === 1 ? "" : "s"}
                      </>
                    )}
                  </p>
                </div>
                {by === "scheme" && (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums">
                    <Users className="size-3" /> {g.others}
                  </span>
                )}
                <ChevronRight className="size-4 shrink-0 self-center text-muted-foreground" />
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <ProgressBar value={pct} className="h-1.5 flex-1" barClassName="bg-emerald-500" />
                <span className="shrink-0 tabular-nums">
                  {g.paidCount} of {g.count} paid
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className={cn("rounded-xl px-1.5 py-1.5", g.outstandingPaise > 0 ? "bg-amber-500/10" : "bg-muted/60")}>
                  <dt className="text-[11px] text-muted-foreground">Due now</dt>
                  <dd className={cn("text-sm font-bold", g.outstandingPaise > 0 && "text-warning-ink")}>
                    <Money paise={g.outstandingPaise} short />
                  </dd>
                </div>
                <div className={cn("rounded-xl px-1.5 py-1.5", g.overduePaise > 0 ? "bg-rose-500/8" : "bg-muted/60")}>
                  <dt className="text-[11px] text-muted-foreground">Overdue</dt>
                  <dd className={cn("text-sm font-bold", g.overduePaise > 0 && "text-rose-700 dark:text-rose-300")}>
                    <Money paise={g.overduePaise} short />
                  </dd>
                </div>
                <div className="rounded-xl bg-sky-500/8 px-1.5 py-1.5">
                  <dt className="text-[11px] text-muted-foreground">Paid ahead</dt>
                  <dd className="text-sm font-bold text-sky-700 dark:text-sky-300">
                    <Money paise={g.paidAheadPaise} short />
                  </dd>
                </div>
              </dl>
              <p className="mt-2 text-xs text-muted-foreground">
                Collected <Money paise={g.paidPaise} short className="font-semibold text-foreground" /> of <Money paise={g.plannedPaise} short />
                {g.nextDue ? <> · next due {formatDate(g.nextDue)}</> : <> · all paid</>}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
