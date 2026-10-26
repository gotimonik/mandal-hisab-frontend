import Link from "next/link";
import { FileBarChart } from "lucide-react";
import { getOrg } from "@/lib/server/data";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { REPORTS } from "@/features/reports-meta";

export const metadata = { title: "Reports" };

export default async function ReportsPage({ params }: PageProps<"/org/[orgId]/reports">) {
  const { orgId } = await params;
  const org = await getOrg(orgId);
  const list = REPORTS.filter((r) => org.myPermissions.includes(r.permission));
  return (
    <>
      <PageHeader title="Reports" description="All figures are computed from the ledger and verified records. Export any report as CSV or print it to PDF." />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[
          { href: `/org/${orgId}/monthly/report`, title: "Monthly summary", description: "Hapta expected vs collected, interest, withdrawals, cash and each member's balance for a month." },
          { href: `/org/${orgId}/cashbook`, title: "Cash book", description: "Opening cash, every receipt and payment, and closing cash for any period." },
        ].map((r) => (
          <Link key={r.href} href={r.href} className="rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
            <Card className="h-full ring-primary/30 transition-colors hover:bg-muted/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileBarChart className="size-4 text-primary" /> {r.title}
                </CardTitle>
                <CardDescription>{r.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
        {list.map((r) => (
          <Link key={r.kind} href={`/org/${orgId}/reports/${r.kind}`} className="rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
            <Card className="h-full transition-colors hover:bg-muted/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileBarChart className="size-4 text-primary" /> {r.title}
                </CardTitle>
                <CardDescription>{r.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
      <p className="mt-6 text-sm text-muted-foreground">Member-wise savings ledgers and dues statements are on each member&apos;s page (Members → member).</p>
    </>
  );
}
