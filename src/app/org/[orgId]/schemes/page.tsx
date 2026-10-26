import Link from "next/link";
import { CalendarClock, Plus } from "lucide-react";
import { getOrg, getSchemes, can } from "@/lib/server/data";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Money } from "@/components/app/money";
import { EmptyState } from "@/components/app/empty-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { FREQUENCY_LABEL, formatDate, label } from "@/lib/format";

export const metadata = { title: "Hapta schemes" };

export default async function SchemesPage({ params }: PageProps<"/org/[orgId]/schemes">) {
  const { orgId } = await params;
  const [org, schemes] = await Promise.all([getOrg(orgId), getSchemes(orgId)]);
  const manage = can(org, "schemes.manage");
  return (
    <>
      <PageHeader
        title="Hapta schemes"
        description="Recurring contribution plans. Each scheme generates installments for its enrolled members."
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
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {schemes.map((s) => {
            const pct = s.duePaise ? Math.round(((s.collectedPaise ?? 0) / s.duePaise) * 100) : 100;
            return (
              <Link key={s._id} href={`/org/${orgId}/schemes/${s._id}`} className="rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                <Card className="h-full transition-colors hover:bg-muted/40">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between gap-2">
                      <span className="truncate">{s.name}</span>
                      <StatusBadge status={s.status} />
                    </CardTitle>
                    <CardDescription>
                      <Money paise={s.amountPaise} /> · {label(FREQUENCY_LABEL, s.frequency)}
                      {s.amountMode === "member_specific" ? " · member-specific" : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>{s.enrolledMembers} members</span>
                      <span>from {formatDate(s.startDate)}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-primary" style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        Collected <Money paise={s.collectedPaise ?? 0} />
                      </span>
                      <span>
                        of <Money paise={s.duePaise ?? 0} /> due
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
