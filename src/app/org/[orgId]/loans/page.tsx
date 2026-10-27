import Link from "next/link";
import { Landmark, Plus } from "lucide-react";
import { api, qs } from "@/lib/server/api";
import { getOrg, can } from "@/lib/server/data";
import type { Loan } from "@/lib/types";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Money } from "@/components/app/money";
import { EmptyState } from "@/components/app/empty-state";
import { TableWrap } from "@/components/app/table-wrap";
import { SummaryBand } from "@/components/app/summary-band";
import { ChipLinks } from "@/components/app/chip-links";
import { MemberAvatar } from "@/components/app/bits";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "Loans" };

const STATUSES = [
  ["", "All"],
  ["applied", "Applied"],
  ["approved", "Approved"],
  ["active", "Active"],
  ["closed", "Closed"],
  ["rejected", "Rejected"],
] as const;

export default async function LoansPage({ params, searchParams }: PageProps<"/org/[orgId]/loans">) {
  const { orgId } = await params;
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : "";
  const [org, loans] = await Promise.all([getOrg(orgId), api<Loan[]>(`/orgs/${orgId}/loans${qs({ status })}`)]);
  const principalOf = (l: Loan) => l.principalPaise ?? l.approvedPaise ?? l.requestedPaise;
  const outstanding = loans.reduce((s, l) => s + (l.outstandingPrincipalPaise ?? 0), 0);
  const overdue = loans.reduce((s, l) => s + (l.summary?.overdueAmountPaise ?? 0), 0);
  const activeCount = loans.filter((l) => l.status === "active").length;
  const terms = (l: Loan) => `${l.annualRate}% · ${l.interestMethod.replace("_", " ")} · ${l.tenure} ${l.repaymentFrequency}`;
  const link = (l: Loan) => `/org/${orgId}/loans/${l._id}`;
  return (
    <>
      <PageHeader
        title="Loans"
        description="Loans to members are tracked separately from hapta: principal is an asset, only interest and late fees are income."
        actions={
          can(org, "loans.manage") && org.status === "active" ? (
            <Link href={`/org/${orgId}/loans/new`} className={buttonVariants()}>
              <Plus /> New loan
            </Link>
          ) : null
        }
      />
      <SummaryBand
        icon={<Landmark />}
        label="Principal outstanding on the listed loans"
        value={<Money paise={outstanding} />}
        sub={`${loans.length} loan${loans.length === 1 ? "" : "s"}`}
        stats={[
          { label: "Active", value: activeCount },
          { label: "Overdue", value: <Money paise={overdue} short /> },
          { label: "Lent in total", value: <Money paise={loans.reduce((s, l) => s + (principalOf(l) ?? 0), 0)} short /> },
        ]}
      />
      <ChipLinks label="Status" current={status} items={STATUSES.map(([k, l]) => ({ key: k, label: l, href: `/org/${orgId}/loans${qs({ status: k })}` }))} />
      {loans.length === 0 ? (
        <EmptyState icon={<Landmark />} title="No loans" description={status ? "Try another status." : undefined} />
      ) : (
        <>
          <ul className="flex flex-col gap-2 md:hidden" aria-label="Loans">
            {loans.map((l) => {
              const od = l.summary?.overdueAmountPaise ?? 0;
              return (
                <li key={l._id}>
                  <Link href={link(l)} className={cn("flex items-start gap-3 rounded-2xl bg-card p-3.5 shadow-card ring-1 ring-foreground/[0.06] transition-colors active:bg-muted", od > 0 && "ring-2 ring-rose-400/40", (l.status === "closed" || l.status === "rejected") && "opacity-70")}>
                    <MemberAvatar name={l.member?.name ?? "?"} />
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="truncate font-semibold">{l.member?.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-mono">{l.loanNumber}</span>
                        {l.disbursedOn ? ` · ${formatDate(l.disbursedOn)}` : ""}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{terms(l)}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Money paise={l.status === "active" ? l.outstandingPrincipalPaise : principalOf(l)} className="font-bold" />
                      {od > 0 && <Money paise={od} className="text-xs font-semibold text-destructive" />}
                      <StatusBadge status={l.status} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="hidden md:block">
            <TableWrap>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Terms</TableHead>
                    <TableHead className="text-right">Principal</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead className="text-right">Overdue</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loans.map((l) => (
                    <TableRow key={l._id} className={cn((l.status === "closed" || l.status === "rejected") && "text-muted-foreground")}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <MemberAvatar name={l.member?.name ?? "?"} size="sm" />
                          <div className="min-w-0">
                            <Link href={link(l)} className="font-semibold hover:underline">
                              {l.member?.name ?? "—"}
                            </Link>
                            <div className="text-xs text-muted-foreground">
                              <span className="font-mono">{l.loanNumber}</span>
                              {l.disbursedOn ? ` · ${formatDate(l.disbursedOn)}` : ""}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{terms(l)}</TableCell>
                      <TableCell className="text-right">
                        <Money paise={principalOf(l)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Money paise={l.outstandingPrincipalPaise} className="font-semibold" />
                      </TableCell>
                      <TableCell className="text-right">{l.summary?.overdueAmountPaise ? <Money paise={l.summary.overdueAmountPaise} className="font-semibold text-destructive" /> : "—"}</TableCell>
                      <TableCell>
                        <StatusBadge status={l.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrap>
          </div>
        </>
      )}
    </>
  );
}
