import Link from "next/link";
import { api } from "@/lib/server/api";
import { can, getOrg, getMoney } from "@/lib/server/data";
import type { FundLoan, UpadInstallmentNow, UpadInstallmentRow } from "@/lib/types";
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
import { CalendarDays, CalendarRange, HandCoins, Receipt } from "lucide-react";
import { LoanPaymentDialog } from "@/features/fund-loans/loan-payment-dialog";
import { StartInstallmentsDialog } from "@/features/fund-loans/start-installments-dialog";

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
  /** null: paid from the member's advance */
  receiptId: string | null;
  note?: string;
  recordedByName: string | null;
  groupId?: string | null;
  advanceAddedPaise?: number;
}

import { getT } from "@/i18n/server";
import { monthName as monthNameIn } from "@/i18n/core";

export default async function FundLoanPage({ params }: PageProps<"/org/[orgId]/fund-loans/[loanId]">) {
  const { orgId, loanId } = await params;
  const { t, lang } = await getT();
  const monthName = (m: string) => monthNameIn(lang, m, "short");
  const [org, data] = await Promise.all([getOrg(orgId), api<{ loan: FundLoan; dues: Due[]; payments: Payment[]; installments?: (UpadInstallmentNow & { rows: UpadInstallmentRow[] }) | null }>(`/orgs/${orgId}/fund-loans/${loanId}`)]);
  // getOrg is already in flight above (and cached), so this resolves without a second wait
  const money = await getMoney(orgId);
  const { loan: l, dues, payments } = data;
  const inst = l.status === "active" ? (data.installments ?? null) : null;
  // each installment month: the installment + that month's interest (the actual due once it exists; else
  // worked out on what the plan leaves outstanding, as interest is on last month's closing amount)
  const instRows = (() => {
    if (!inst) return [];
    let left = l.installmentPlan?.basePaise ?? l.principalPaise;
    return inst.rows.map((r) => {
      const due = dues.find((d) => d.period === r.period);
      const interest = due ? due.interestPaise : Math.round((left * Number(l.monthlyRate)) / 100);
      left -= r.amountPaise;
      return { ...r, interestPaise: interest, estimated: !due };
    });
  })();
  const live = org.status === "active";
  const latestValid = payments.find((p) => p.status === "valid");
  const staffView = can(org, "members.view");
  const CARD = "rounded-2xl bg-card p-3.5 shadow-card ring-1 ring-foreground/[0.06]";
  const months = (p: Payment) => [p.allocations.length ? p.allocations.map((a) => monthName(a.period)).join(", ") : "", p.recordedByName ? t("upd.by", { name: p.recordedByName }) : ""].filter(Boolean).join(" · ");
  const paymentActions = (p: Payment) => (
    <>
      {p.receiptId ? (
        <Link href={`/org/${orgId}/receipts/${p.receiptId}`} className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300">
          <Receipt className="size-3.5" /> {t("upd.receipt")}
        </Link>
      ) : (
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">{t("upd.fromAdvance")}</span>
      )}
      {staffView && latestValid?._id === p._id && can(org, "transactions.adjust") && live && (
        <ActionButton path={`/orgs/${orgId}/fund-loan-payments/${p._id}/reverse`} size="xs" variant="ghost" successMessage={t("upd.reversed")} confirm={{ title: t("upd.reverseQ"), description: p.groupId ? t("upd.reverseGroup") : t("upd.reverseOne"), reason: "required", destructive: true, confirmLabel: t("upd.reverse") }}>
          {t("upd.reverse")}
        </ActionButton>
      )}
    </>
  );
  return (
    <>
      <PageHeader
        eyebrow={t("upd.eyebrow", { number: l.number })}
        title={l.member?.name ?? t("upd.member")}
        description={
          <>
            <Money paise={l.principalPaise} /> {t("upd.given", { date: formatDate(l.date), rate: l.monthlyRate })} · <StatusBadge status={l.status} />
            {l.note ? ` · ${l.note}` : ""}
          </>
        }
        actions={
          <>
            {staffView && l.status === "active" && can(org, "payments.record") && live && (
              <LoanPaymentDialog methods={org.settings.paymentMethods} loanId={l._id} number={l.number} memberName={l.member?.name ?? "member"} interestDuePaise={l.interestDuePaise} outstandingPaise={l.outstandingPaise} installmentDuePaise={inst?.duePaise ?? 0} />
            )}
            {staffView && l.status === "active" && !inst && l.outstandingPaise > 0 && can(org, "withdrawals.record") && live && (
              <StartInstallmentsDialog loanId={l._id} number={l.number} outstandingPaise={l.outstandingPaise} monthlyRate={l.monthlyRate} defaultCount={org.settings.fundLoans.installments?.count ?? 10} />
            )}
            {staffView && l.status === "active" && payments.every((p) => p.status === "reversed") && can(org, "transactions.adjust") && live && (
              <ActionButton path={`/orgs/${orgId}/fund-loans/${l._id}/cancel`} variant="ghost" successMessage={t("upd.cancelled")} confirm={{ title: t("upd.cancelQ", { number: l.number }), description: t("upd.cancelD"), reason: "required", destructive: true, confirmLabel: t("upd.cancel") }}>
                {t("upd.cancel")}
              </ActionButton>
            )}
          </>
        }
      />
      <SummaryBand
        tone="warm"
        icon={<HandCoins />}
        label={t("upd.outstanding")}
        value={<Money paise={l.outstandingPaise} />}
        sub={t("upd.sub", { given: money.fmt(l.principalPaise), next: money.fmt(l.nextInterestPaise), rate: l.monthlyRate })}
        stats={[
          { label: t("upd.dueNow"), value: <Money paise={l.interestDuePaise} short /> },
          { label: t("upd.paidSoFar"), value: <Money paise={l.interestPaidPaise} short /> },
          { label: t("upd.nextMonth"), value: <Money paise={l.nextInterestPaise} short /> },
        ]}
      />
      {l.interestDuePaise > 0 ? (
        <p className="mb-5 rounded-2xl bg-amber-500/12 px-3.5 py-2.5 text-sm font-medium text-amber-800 ring-1 ring-amber-500/30 dark:text-amber-300">
          {t("upd.unpaid", { amount: money.fmt(l.interestDuePaise) })}{l.unpaidMonths.length ? ` — ${l.unpaidMonths.map(monthName).join(", ")}` : ""}
        </p>
      ) : (
        l.status === "active" && <p className="mb-5 rounded-2xl bg-emerald-500/10 px-3.5 py-2.5 text-sm font-medium text-emerald-700 ring-1 ring-emerald-500/25 dark:text-emerald-300">{t("upd.upToDate")}</p>
      )}

      {(l.memberAdvancePaise ?? 0) > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl bg-emerald-500/10 px-3.5 py-2.5 text-sm ring-1 ring-emerald-500/25">
          <p className="min-w-0 flex-1">
            <b>
              {t("upd.ahead")} <Money paise={l.memberAdvancePaise!} />
            </b>
            <span className="block text-xs text-muted-foreground">{t("upd.aheadD", { name: l.member?.name ?? t("upd.theMember") })}</span>
          </p>
          {staffView && can(org, "withdrawals.record") && live && (
            <ActionButton
              path={`/orgs/${orgId}/members/${l.memberId}/upad-advance/return`}
              size="xs"
              successMessage={t("upd.returned")}
              confirm={{ title: t("upd.returnQ", { amount: money.fmt(l.memberAdvancePaise!), name: l.member?.name ?? t("upd.theMember") }), description: t("upd.returnD"), confirmLabel: t("upd.return") }}
            >
              {t("upd.return")}
            </ActionButton>
          )}
        </div>
      )}

      {inst && (
        <>
          <SectionTitle
            action={
              staffView && can(org, "withdrawals.record") && live ? (
                <ActionButton path={`/orgs/${orgId}/fund-loans/${l._id}/installments/stop`} size="xs" variant="ghost" successMessage={t("upd.stopped")} confirm={{ title: t("upd.stopQ"), description: t("upd.stopD"), confirmLabel: t("upd.stop") }}>
                  {t("upd.stop")}
                </ActionButton>
              ) : undefined
            }
          >
            {t("upd.instTitle", { paid: inst.paidCount, count: inst.count })}
          </SectionTitle>
          <p className={cn("mb-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium ring-1", inst.duePaise > 0 ? "bg-amber-500/12 text-amber-800 ring-amber-500/30 dark:text-amber-300" : "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300")}>
            {inst.duePaise > 0
              ? inst.overduePaise > 0
                ? t("upd.instDueOver", { amount: money.fmt(inst.duePaise), over: money.fmt(inst.overduePaise) })
                : t("upd.instDue", { amount: money.fmt(inst.duePaise) })
              : inst.next
                ? t("upd.instOk", { amount: money.fmt(inst.next.amountPaise), month: monthName(inst.next.period) })
                : t("upd.instAll")}
            <span className="block text-xs font-normal opacity-80">
              {t("upd.instPlan", { amount: money.fmt(inst.amountPaise), count: inst.count, from: monthName(inst.firstMonth), to: monthName(inst.lastMonth) })}
            </span>
          </p>
          <div className="mb-6">
            <TableWrap>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>{t("upd.month")}</TableHead>
                    <TableHead className="text-right">{t("upd.installment")}</TableHead>
                    <TableHead className="text-right">{t("upd.interest")}</TableHead>
                    <TableHead className="text-right">{t("upd.total")}</TableHead>
                    <TableHead>{t("upd.status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {instRows.map((r) => (
                    <TableRow key={r.sequence}>
                      <TableCell className="text-muted-foreground tabular-nums">{r.sequence}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-2">
                          <CalendarRange className="size-4 text-muted-foreground" />
                          <span>
                            <span className="font-semibold">{monthName(r.period)}</span>
                            <span className="block text-xs text-muted-foreground">{t("upd.due", { date: formatDate(r.dueDate) })}</span>
                          </span>
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Money paise={r.amountPaise} className="font-semibold" />
                        {r.paidPaise > 0 && r.paidPaise < r.amountPaise && (
                          <span className="block text-xs text-muted-foreground">
                            {t("upd.paid")} <Money paise={r.paidPaise} />
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.estimated ? "≈ " : ""}
                        <Money paise={r.interestPaise} />
                      </TableCell>
                      <TableCell className="text-right">
                        {r.estimated ? "≈ " : ""}
                        <Money paise={r.amountPaise + r.interestPaise} className="font-semibold" />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={r.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrap>
            <p className="mt-1.5 text-xs text-muted-foreground">{t("upd.approx")}</p>
          </div>
        </>
      )}

      <SectionTitle>{t("upd.monthly")}</SectionTitle>
      {dues.length === 0 ? (
        <EmptyState icon={<CalendarDays />} title={t("upd.noDue")} description={t("upd.startsFrom", { month: monthName(l.firstInterestMonth) })} />
      ) : (
        <>
          <ul className="flex flex-col gap-2 md:hidden" aria-label={t("upd.monthly")}>
            {dues.map((d) => (
              <li key={d._id} className={cn(CARD, "flex items-center gap-3", d.unpaidPaise > 0 && d.status !== "paid" && "ring-2 ring-amber-400/40")}>
                <IconChip tone="orange" size="sm">
                  <CalendarDays />
                </IconChip>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-semibold">{monthName(d.period)}</p>
                  <p className="text-xs text-muted-foreground">
                    <Money paise={d.principalBasisPaise} /> × {d.monthlyRate}% · {t("upd.due", { date: formatDate(d.dueDate) })}
                  </p>
                  {d.paidPaise > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {t("upd.paid")} <Money paise={d.paidPaise} />
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
                    <TableHead>{t("upd.month")}</TableHead>
                    <TableHead className="text-right">{t("upd.onAmount")}</TableHead>
                    <TableHead className="text-right">{t("upd.interest")}</TableHead>
                    <TableHead className="text-right">{t("upd.paidCol")}</TableHead>
                    <TableHead>{t("upd.status")}</TableHead>
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
                            <span className="block text-xs text-muted-foreground">{t("upd.due", { date: formatDate(d.dueDate) })}</span>
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

      <SectionTitle className="mt-6">{t("upd.received")}</SectionTitle>
      {payments.length === 0 ? (
        <EmptyState icon={<Receipt />} title={t("upd.noPayments")} />
      ) : (
        <>
          <ul className="flex flex-col gap-2 md:hidden" aria-label={t("upd.received")}>
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
                          {t("upd.interest")} <Money paise={p.interestPaise} />
                        </>
                      ) : null}
                      {p.interestPaise && p.principalPaise ? " · " : null}
                      {p.principalPaise ? (
                        <>
                          {t("upd.returnedAmt")} <Money paise={p.principalPaise} />
                        </>
                      ) : null}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Money paise={p.interestPaise + p.principalPaise} className="font-bold" />
                    <StatusBadge status={p.status === "valid" ? "paid" : "reversed"} />
                  </div>
                </div>
                {p.reversalReason && <p className="mt-2 rounded-lg bg-muted/60 px-2.5 py-1.5 text-xs text-destructive">{t("upd.reversedX", { reason: p.reversalReason })}</p>}
                <div className="mt-2 flex flex-wrap items-center justify-end gap-1">{paymentActions(p)}</div>
              </li>
            ))}
          </ul>
          <div className="hidden md:block">
            <TableWrap>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("upd.date")}</TableHead>
                    <TableHead className="text-right">{t("upd.interest")}</TableHead>
                    <TableHead className="text-right">{t("upd.returnedAmt")}</TableHead>
                    <TableHead>{t("upd.status")}</TableHead>
                    <TableHead className="text-right" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p._id} className={cn(p.status === "reversed" && "text-muted-foreground")}>
                      <TableCell className="whitespace-nowrap">
                        <span className="font-semibold">{formatDate(p.date)}</span>
                        <div className="text-xs text-muted-foreground">{months(p)}</div>
                        {p.reversalReason && <div className="text-xs text-destructive">{t("upd.reversedX", { reason: p.reversalReason })}</div>}
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
