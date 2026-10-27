import Link from "next/link";
import { api } from "@/lib/server/api";
import { can, getOrg, getMoney } from "@/lib/server/data";
import type { FundLoan } from "@/lib/types";
import { PageHeader } from "@/components/app/page-header";
import { SummaryBand } from "@/components/app/summary-band";
import { IconChip, MemberAvatar, SectionTitle } from "@/components/app/bits";
import { StatusBadge } from "@/components/app/status-badge";
import { Money } from "@/components/app/money";
import { TableWrap } from "@/components/app/table-wrap";
import { ActionButton } from "@/components/app/action-button";
import { EmptyState } from "@/components/app/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CalendarDays, HandCoins, Receipt } from "lucide-react";
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
  const [org, data] = await Promise.all([getOrg(orgId), api<{ loan: FundLoan; dues: Due[]; payments: Payment[] }>(`/orgs/${orgId}/fund-loans/${loanId}`)]);
  // getOrg is already in flight above (and cached), so this resolves without a second wait
  const money = await getMoney(orgId);
  const { loan: l, dues, payments } = data;
  const live = org.status === "active";
  const latestValid = payments.find((p) => p.status === "valid");
  const staffView = can(org, "members.view");
  const CARD = "rounded-2xl bg-card p-3.5 shadow-card ring-1 ring-foreground/[0.06]";
  const months = (p: Payment) => [p.allocations.length ? p.allocations.map((a) => monthName(a.period)).join(", ") : "", p.recordedByName ? `by ${p.recordedByName}` : ""].filter(Boolean).join(" · ");
  const paymentActions = (p: Payment) => (
    <>
      <Link href={`/org/${orgId}/receipts/${p.receiptId}`} className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300">
        <Receipt className="size-3.5" /> Receipt
      </Link>
      {staffView && latestValid?._id === p._id && can(org, "transactions.adjust") && live && (
        <ActionButton path={`/orgs/${orgId}/fund-loan-payments/${p._id}/reverse`} size="xs" variant="ghost" successMessage="Payment reversed" confirm={{ title: "Reverse this payment?", description: "Use only if it was recorded by mistake. The interest shares are taken back from members' balances.", reason: "required", destructive: true, confirmLabel: "Reverse" }}>
          Reverse
        </ActionButton>
      )}
    </>
  );
  return (
    <>
      <PageHeader
        eyebrow={`Upad ${l.number}`}
        title={l.member?.name ?? "Member"}
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
      <SummaryBand
        tone="warm"
        icon={<HandCoins />}
        label="Upad outstanding"
        value={<Money paise={l.outstandingPaise} />}
        sub={`of ${money.fmt(l.principalPaise)} given · next month's interest ${money.fmt(l.nextInterestPaise)} (${l.monthlyRate}% of the outstanding amount)`}
        stats={[
          { label: "Interest due now", value: <Money paise={l.interestDuePaise} short /> },
          { label: "Interest paid so far", value: <Money paise={l.interestPaidPaise} short /> },
          { label: "Next month", value: <Money paise={l.nextInterestPaise} short /> },
        ]}
      />
      {l.interestDuePaise > 0 ? (
        <p className="mb-5 rounded-2xl bg-amber-500/12 px-3.5 py-2.5 text-sm font-medium text-amber-800 ring-1 ring-amber-500/30 dark:text-amber-300">
          {money.fmt(l.interestDuePaise)} interest unpaid{l.unpaidMonths.length ? ` — ${l.unpaidMonths.map(monthName).join(", ")}` : ""}
        </p>
      ) : (
        l.status === "active" && <p className="mb-5 rounded-2xl bg-emerald-500/10 px-3.5 py-2.5 text-sm font-medium text-emerald-700 ring-1 ring-emerald-500/25 dark:text-emerald-300">Nothing unpaid — interest is up to date.</p>
      )}

      <SectionTitle>Monthly interest</SectionTitle>
      {dues.length === 0 ? (
        <EmptyState icon={<CalendarDays />} title="No interest due yet" description={`Interest starts from ${monthName(l.firstInterestMonth)}.`} />
      ) : (
        <>
          <ul className="flex flex-col gap-2 md:hidden" aria-label="Monthly interest">
            {dues.map((d) => (
              <li key={d._id} className={cn(CARD, "flex items-center gap-3", d.unpaidPaise > 0 && d.status !== "paid" && "ring-2 ring-amber-400/40")}>
                <IconChip tone="orange" size="sm">
                  <CalendarDays />
                </IconChip>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-semibold">{monthName(d.period)}</p>
                  <p className="text-xs text-muted-foreground">
                    <Money paise={d.principalBasisPaise} /> × {d.monthlyRate}% · due {formatDate(d.dueDate)}
                  </p>
                  {d.paidPaise > 0 && (
                    <p className="text-xs text-muted-foreground">
                      paid <Money paise={d.paidPaise} />
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Money paise={d.interestPaise} className="font-bold" />
                  <StatusBadge status={d.status} />
                </div>
              </li>
            ))}
          </ul>
          <div className="hidden md:block">
            <TableWrap>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">On amount</TableHead>
                    <TableHead className="text-right">Interest</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dues.map((d) => (
                    <TableRow key={d._id}>
                      <TableCell>
                        <span className="inline-flex items-center gap-2.5">
                          <IconChip tone="orange" size="sm">
                            <CalendarDays />
                          </IconChip>
                          <span>
                            <span className="font-semibold">{monthName(d.period)}</span>
                            <span className="block text-xs text-muted-foreground">due {formatDate(d.dueDate)}</span>
                          </span>
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Money paise={d.principalBasisPaise} /> × {d.monthlyRate}%
                      </TableCell>
                      <TableCell className="text-right">
                        <Money paise={d.interestPaise} className="font-semibold" />
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
          </div>
        </>
      )}

      <SectionTitle className="mt-6">Payments received</SectionTitle>
      {payments.length === 0 ? (
        <EmptyState icon={<Receipt />} title="No payments yet" />
      ) : (
        <>
          <ul className="flex flex-col gap-2 md:hidden" aria-label="Payments received">
            {payments.map((p) => (
              <li key={p._id} className={cn(CARD, p.status === "reversed" && "opacity-70")}>
                <div className="flex items-start gap-3">
                  <MemberAvatar name={l.member?.name ?? "?"} size="sm" />
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-semibold">{formatDate(p.date)}</p>
                    {months(p) && <p className="truncate text-xs text-muted-foreground">{months(p)}</p>}
                    <p className="text-xs text-muted-foreground">
                      {p.interestPaise ? (
                        <>
                          Interest <Money paise={p.interestPaise} />
                        </>
                      ) : null}
                      {p.interestPaise && p.principalPaise ? " · " : null}
                      {p.principalPaise ? (
                        <>
                          Upad returned <Money paise={p.principalPaise} />
                        </>
                      ) : null}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Money paise={p.interestPaise + p.principalPaise} className="font-bold" />
                    <StatusBadge status={p.status === "valid" ? "paid" : "reversed"} />
                  </div>
                </div>
                {p.reversalReason && <p className="mt-2 rounded-lg bg-muted/60 px-2.5 py-1.5 text-xs text-destructive">Reversed: {p.reversalReason}</p>}
                <div className="mt-2 flex flex-wrap items-center justify-end gap-1">{paymentActions(p)}</div>
              </li>
            ))}
          </ul>
          <div className="hidden md:block">
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
                    <TableRow key={p._id} className={cn(p.status === "reversed" && "text-muted-foreground")}>
                      <TableCell className="whitespace-nowrap">
                        <span className="font-semibold">{formatDate(p.date)}</span>
                        <div className="text-xs text-muted-foreground">{months(p)}</div>
                        {p.reversalReason && <div className="text-xs text-destructive">Reversed: {p.reversalReason}</div>}
                      </TableCell>
                      <TableCell className="text-right">{p.interestPaise ? <Money paise={p.interestPaise} className="font-semibold" /> : ""}</TableCell>
                      <TableCell className="text-right">{p.principalPaise ? <Money paise={p.principalPaise} className="font-semibold" /> : ""}</TableCell>
                      <TableCell>
                        <StatusBadge status={p.status === "valid" ? "paid" : "reversed"} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">{paymentActions(p)}</div>
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
