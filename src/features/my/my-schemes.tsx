import { CalendarCheck2 } from "lucide-react";
import { Money } from "@/components/app/money";
import { StatusBadge } from "@/components/app/status-badge";
import { EmptyState } from "@/components/app/empty-state";
import { IconChip } from "@/components/app/bits";
import { MemberProgress, type EnrollmentProgress } from "@/features/schemes/member-progress";
import { FREQUENCY_LABEL, label } from "@/lib/format";
import { getT } from "@/i18n/server";
import { getMoney } from "@/lib/server/data";

export type MySchemeRow = EnrollmentProgress & {
  status: string;
  amountPaise: number;
  duePaise: number;
  paidPaise: number;
  paidAheadPaise: number;
  totalPaise: number;
  totalPaidPaise: number;
  scheme: { _id: string; name: string; frequency: string; amountPaise: number; status: string };
};

/** One card per hapta scheme the member is in, with every month of the schedule. */
export async function MySchemes({ rows, orgId, openFirst = true }: { rows: MySchemeRow[]; orgId: string; openFirst?: boolean }) {
  const { t } = await getT();
  const money = await getMoney(orgId);
  if (rows.length === 0) return <EmptyState title={t("my.noSchemes")} />;
  return (
    <div className="grid items-start gap-3 lg:grid-cols-2">
      {rows.map((r, idx) => {
        const owed = Math.max(0, r.duePaise - r.paidPaise);
        return (
          <section key={r.scheme._id} className="min-w-0 rounded-2xl bg-card p-4 shadow-card ring-1 ring-foreground/5">
            <div className="flex items-start gap-3">
              <IconChip tone={r.scheme.status === "active" ? "violet" : "slate"}>
                <CalendarCheck2 />
              </IconChip>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold">{r.scheme.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {label(FREQUENCY_LABEL, r.scheme.frequency)} · {t("my.perInstallment", { amount: money.fmt(r.amountPaise || r.scheme.amountPaise) })}
                </p>
              </div>
              {r.scheme.status !== "active" ? <StatusBadge status={r.scheme.status} /> : r.status !== "active" ? <StatusBadge status={r.status} /> : null}
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-emerald-500/8 px-2 py-2">
                <dt className="text-[11px] text-muted-foreground">{t("my.paidSoFar")}</dt>
                <dd className="text-sm font-bold text-emerald-700 dark:text-emerald-300"><Money paise={r.totalPaidPaise} short /></dd>
              </div>
              <div className={owed > 0 ? "rounded-xl bg-rose-500/8 px-2 py-2" : "rounded-xl bg-muted/60 px-2 py-2"}>
                <dt className="text-[11px] text-muted-foreground">{t("my.stillDue")}</dt>
                <dd className={owed > 0 ? "text-sm font-bold text-rose-700 dark:text-rose-300" : "text-sm font-bold"}><Money paise={owed} short /></dd>
              </div>
              <div className="rounded-xl bg-sky-500/8 px-2 py-2">
                <dt className="text-[11px] text-muted-foreground">{t("my.paidAhead")}</dt>
                <dd className="text-sm font-bold text-sky-700 dark:text-sky-300"><Money paise={r.paidAheadPaise} short /></dd>
              </div>
            </dl>
            <div className="mt-3">
              <MemberProgress e={r} defaultOpen={openFirst && idx === 0 && r.scheme.status === "active"} />
            </div>
          </section>
        );
      })}
    </div>
  );
}
