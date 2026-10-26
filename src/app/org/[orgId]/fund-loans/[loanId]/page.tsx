import Link from "next/link";
import { api } from "@/lib/server/api";
import { can, getOrg, getMoney } from "@/lib/server/data";
import type { FundLoan } from "@/lib/types";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { StatusBadge } from "@/components/app/status-badge";
import { Money } from "@/components/app/money";
import { TableWrap } from "@/components/app/table-wrap";
import { ActionButton } from "@/components/app/action-button";
import { EmptyState } from "@/components/app/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { LoanPaymentDialog } from "@/features/fund-loans/loan-payment-dialog";

export const metadata = { title: "Upad" };

interface Due {
  _id: string;
  period: string;
  dueDate: string;
  principalBasisPaise: number;
  monthlyRate: string;
  interestPaise: number;
  paidPaise: number;
  unpaidPaise: number;
  status: string;
}
interface Payment {
  _id: string;
  date: string;
  interestPaise: number;
  principalPaise: number;
  allocations: { period: string; amountPaise: number }[];
  status: "valid" | "reversed";
  reversalReason?: string;
  receiptId: string;
  note?: string;
  recordedByName: string | null;
}

const monthName = (m: string) => new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${m}-01T00:00:00Z`));

export default async function FundLoanPage({ params }: PageProps<"/org/[orgId]/fund-loans/[loanId]">) {
  const { orgId, loanId } = await params;
  const money = await getMoney(orgId);
  const [org, data] = await Promise.all([getOrg(orgId), api<{ loan: FundLoan; dues: Due[]; payments: Payment[] }>(`/orgs/${orgId}/fund-loans/${loanId}`)]);
  const { loan: l, dues, payments } = data;
  const live = org.status === "active";
  const latestValid = payments.find((p) => p.status === "valid");
  const staffView = can(org, "members.view");
  return (
    <>
      <PageHeader
        title={`${l.member?.name ?? "Member"} — ${l.number}`}
        description={
          <>
            <Money paise={l.principalPaise} /> given on {formatDate(l.date)} at {l.monthlyRate}% per month · <StatusBadge status={l.status} />
            {l.note ? ` · ${l.note}` : ""}
          </>
        }
        actions={
          <>
            {staffView && l.status === "active" && can(org, "payments.record") && live && (
              <LoanPaymentDialog loanId={l._id} number={l.number} memberName={l.member?.name ?? "member"} interestDuePaise={l.interestDuePaise} outstandingPaise={l.outstandingPaise} />
            )}
            {staffView && l.status === "active" && payments.every((p) => p.status === "reversed") && can(org, "transactions.adjust") && live && (
              <ActionButton path={`/orgs/${orgId}/fund-loans/${l._id}/cancel`} variant="ghost" successMessage="Upad cancelled" confirm={{ title: `Cancel ${l.number}?`, description: "Only for an upad recorded by mistake. The cash goes back into the fund.", reason: "required", destructive: true, confirmLabel: "Cancel upad" }}>
                Cancel upad
              </ActionButton>
            )}
          </>
        }
      />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Upad outstanding" value={<Money paise={l.outstandingPaise} />} hint={`of ${money.fmt(l.principalPaise)} given`} />
        <StatCard label="Interest due now" value={<Money paise={l.interestDuePaise} />} tone={l.interestDuePaise > 0 ? "warn" : "good"} hint={l.unpaidMonths.length ? l.unpaidMonths.map(monthName).join(", ") : "Nothing unpaid"} />
        <StatCard label="Next month's interest" value={<Money paise={l.nextInterestPaise} />} hint={`${l.monthlyRate}% of the outstanding amount`} />
        <StatCard label="Interest paid so far" value={<Money paise={l.interestPaidPaise} />} tone="good" />
      </div>

      <h2 className="mb-2 font-semibold">Monthly interest</h2>
      {dues.length === 0 ? (
        <EmptyState title="No interest due yet" description={`Interest starts from ${monthName(l.firstInterestMonth)}.`} />
      ) : (
        <TableWrap>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="hidden text-right sm:table-cell">On amount</TableHead>
                <TableHead className="text-right">Interest</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dues.map((d) => (
                <TableRow key={d._id}>
                  <TableCell>
                    {monthName(d.period)}
                    <div className="text-xs text-muted-foreground">due {formatDate(d.dueDate)}</div>
                  </TableCell>
                  <TableCell className="hidden text-right sm:table-cell">
                    <Money paise={d.principalBasisPaise} /> × {d.monthlyRate}%
                  </TableCell>
                  <TableCell className="text-right">
                    <Money paise={d.interestPaise} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Money paise={d.paidPaise} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={d.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableWrap>
      )}

      <h2 className="mt-6 mb-2 font-semibold">Payments received</h2>
      {payments.length === 0 ? (
        <EmptyState title="No payments yet" />
      ) : (
        <TableWrap>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Interest</TableHead>
                <TableHead className="text-right">Upad returned</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p._id}>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(p.date)}
                    <div className="text-xs text-muted-foreground">
                      {p.allocations.length ? p.allocations.map((a) => monthName(a.period)).join(", ") : ""}
                      {p.recordedByName ? `${p.allocations.length ? " · " : ""}by ${p.recordedByName}` : ""}
                    </div>
                    {p.reversalReason && <div className="text-xs text-destructive">Reversed: {p.reversalReason}</div>}
                  </TableCell>
                  <TableCell className="text-right">{p.interestPaise ? <Money paise={p.interestPaise} /> : ""}</TableCell>
                  <TableCell className="text-right">{p.principalPaise ? <Money paise={p.principalPaise} /> : ""}</TableCell>
                  <TableCell>
                    <StatusBadge status={p.status === "valid" ? "paid" : "reversed"} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Link href={`/org/${orgId}/receipts/${p.receiptId}`} className="rounded-md px-2 py-1 text-xs font-medium text-primary hover:underline">
                        Receipt
                      </Link>
                      {staffView && latestValid?._id === p._id && can(org, "transactions.adjust") && live && (
                        <ActionButton path={`/orgs/${orgId}/fund-loan-payments/${p._id}/reverse`} size="xs" variant="ghost" successMessage="Payment reversed" confirm={{ title: "Reverse this payment?", description: "Use only if it was recorded by mistake. The interest shares are taken back from members' balances.", reason: "required", destructive: true, confirmLabel: "Reverse" }}>
                          Reverse
                        </ActionButton>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableWrap>
      )}
    </>
  );
}
