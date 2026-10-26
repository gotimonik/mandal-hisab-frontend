import Link from "next/link";
import { CalendarClock, ChevronRight, Plus, Users } from "lucide-react";
import { getOrg, getSchemes, can } from "@/lib/server/data";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Money } from "@/components/app/money";
import { EmptyState } from "@/components/app/empty-state";
import { SummaryBand } from "@/components/app/summary-band";
import { IconChip, ProgressBar } from "@/components/app/bits";
import { buttonVariants } from "@/components/ui/button";
import { FREQUENCY_LABEL, formatDate, label } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/tones";

export const metadata = { title: "Hapta schemes" };

const STATUS_TONE: Record<string, Tone> = { active: "emerald", draft: "slate", paused: "amber", closed: "slate" };

export default async function SchemesPage({ params }: PageProps<"/org/[orgId]/schemes">) {
  const { orgId } = await params;
  const [org, schemes] = await Promise.all([getOrg(orgId), getSchemes(orgId)]);
  const manage = can(org, "schemes.manage");
  const due = schemes.reduce((s, x) => s + (x.duePaise ?? 0), 0);
  const collected = schemes.reduce((s, x) => s + (x.collectedPaise ?? 0), 0);
  const order = { active: 0, paused: 1, draft: 2, closed: 3 } as Record<string, number>;
  const sorted = [...schemes].sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9));

  return (
    <>
      <PageHeader
        title="Hapta schemes"
        description="Contribution plans — each one creates installments for the members enrolled in it."
        actions={
          manage ? (
            <Link href={`/org/${orgId}/schemes/new`} className={buttonVariants()}>
              <Plus /> New scheme
            </Link>
          ) : null
        }
      />
      {schemes.length === 0 ? (
        <EmptyState icon={<CalendarClock />} title="No schemes yet" description="Create a scheme such as 500 every month or 3,000 every quarter, then enroll members." />
      ) : (
        <>
          <SummaryBand
            icon={<CalendarClock />}
            label="Collected so far, all schemes"
            value={<Money paise={collected} />}
            stats={[
              { label: "Due so far", value: <Money paise={due} short /> },
              { label: "Collected", value: `${due ? Math.round((collected / due) * 100) : 100}%` },
              { label: "Active schemes", value: schemes.filter((s) => s.status === "active").length },
            ]}
          />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {sorted.map((s) => {
              const pct = s.duePaise ? Math.round(((s.collectedPaise ?? 0) / s.duePaise) * 100) : 100;
              return (
                <Link
                  key={s._id}
                  href={`/org/${orgId}/schemes/${s._id}`}
                  className={cn("group flex flex-col rounded-2xl bg-card shadow-card ring-1 ring-foreground/[0.06] transition-colors hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none", s.status === "closed" && "opacity-60")}
                >
                  <div className="flex items-start gap-3 p-4 pb-3">
                    <IconChip tone={STATUS_TONE[s.status] ?? "indigo"}>
                      <CalendarClock />
                    </IconChip>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-semibold">{s.name}</h2>
                      <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="rounded-md bg-muted px-1.5 py-0.5 font-medium">{label(FREQUENCY_LABEL, s.frequency)}</span>
                        {s.amountMode === "member_specific" && <span>member-specific</span>}
                        {s.status !== "active" && <StatusBadge status={s.status} />}
                      </p>
                    </div>
                    <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <div className="px-4">
                    <Money paise={s.amountPaise} className="block text-2xl font-bold tracking-tight" />
                    <div className="mt-3 flex items-center gap-2">
                      <ProgressBar value={pct} className="h-2 flex-1" />
                      <span className="text-xs font-semibold tabular-nums">{Math.min(100, pct)}%</span>
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      <Money paise={s.collectedPaise ?? 0} className="font-medium text-foreground" /> collected of <Money paise={s.duePaise ?? 0} /> due
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/60 px-4 py-2.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Users className="size-3.5" /> {s.enrolledMembers} member{s.enrolledMembers === 1 ? "" : "s"}
                    </span>
                    <span>from {formatDate(s.startDate)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
