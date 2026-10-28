import Link from "next/link";
import { ArrowRight, CalendarCheck2, Users } from "lucide-react";
import { Money } from "@/components/app/money";
import { IconChip, ProgressBar, SectionTitle } from "@/components/app/bits";
import { buttonVariants } from "@/components/ui/button";
import { FREQUENCY_LABEL, label } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getT } from "@/i18n/server";
import type { MoneyFmt } from "@/lib/currency";

export type SchemeSummary = {
  _id: string;
  name: string;
  frequency: string;
  amountPaise: number;
  members: number;
  monthDuePaise: number;
  monthPaidPaise: number;
  outstandingPaise: number;
  paidAheadPaise: number;
  collectedPaise: number;
  plannedPaise: number;
};

const MAX = 6;

/** Admin / manager dashboard: one card per active hapta scheme. */
export async function SchemesOverview({ schemes, orgId, money }: { schemes: SchemeSummary[]; orgId: string; money: MoneyFmt }) {
  if (!schemes?.length) return null;
  const { t } = await getT();
  const base = `/org/${orgId}/schemes`;
  return (
    <section className="mt-5" aria-label={t("dash.schemes")}>
      <SectionTitle
        action={
          <Link href={base} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-primary")}>
            {t("common.all")} <ArrowRight />
          </Link>
        }
      >
        {t("dash.schemes")}
      </SectionTitle>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {schemes.slice(0, MAX).map((s) => {
          const pct = s.monthDuePaise > 0 ? Math.round((s.monthPaidPaise / s.monthDuePaise) * 100) : 0;
          return (
            <Link key={s._id} href={`${base}/${s._id}`} className="group min-w-0 rounded-2xl bg-card p-4 shadow-card ring-1 ring-foreground/5 transition-shadow hover:ring-primary/30">
              <div className="flex items-start gap-3">
                <IconChip tone="violet">
                  <CalendarCheck2 />
                </IconChip>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold group-hover:text-primary">{s.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {label(FREQUENCY_LABEL, s.frequency)} · <Money paise={s.amountPaise} short />
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums">
                  <Users className="size-3" /> {s.members}
                </span>
              </div>
              <div className="mt-3">
                <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
                  <span className="text-muted-foreground">{t("dash.schemeThisMonth")}</span>
                  {s.monthDuePaise > 0 ? (
                    <span>
                      <b className="tabular-nums">{money.short(s.monthPaidPaise)}</b> <span className="text-muted-foreground">/ {money.short(s.monthDuePaise)}</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">{t("dash.schemeNoneDue")}</span>
                  )}
                </div>
                <ProgressBar value={pct} className="h-2" barClassName="bg-emerald-500" label={s.name} />
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-emerald-500/8 px-1.5 py-1.5">
                  <dt className="text-[11px] text-muted-foreground">{t("dash.schemeCollected")}</dt>
                  <dd className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{money.short(s.collectedPaise)}</dd>
                </div>
                <div className={cn("rounded-xl px-1.5 py-1.5", s.outstandingPaise > 0 ? "bg-rose-500/8" : "bg-muted/60")}>
                  <dt className="text-[11px] text-muted-foreground">{t("dash.schemePending")}</dt>
                  <dd className={cn("text-sm font-bold", s.outstandingPaise > 0 && "text-rose-700 dark:text-rose-300")}>{money.short(s.outstandingPaise)}</dd>
                </div>
                <div className="rounded-xl bg-sky-500/8 px-1.5 py-1.5">
                  <dt className="text-[11px] text-muted-foreground">{t("dash.schemeAhead")}</dt>
                  <dd className="text-sm font-bold text-sky-700 dark:text-sky-300">{money.short(s.paidAheadPaise)}</dd>
                </div>
              </dl>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
