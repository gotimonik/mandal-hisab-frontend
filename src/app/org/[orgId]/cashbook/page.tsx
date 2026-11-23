import { ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine, BookOpenCheck, BookText, HandCoins, Heart, Landmark, Lock, LogOut, Percent, Receipt, RotateCcw, Scale, UserPlus, Wallet } from "lucide-react";
import { api, qs } from "@/lib/server/api";
import { can, getAccounts, getOrg } from "@/lib/server/data";
import { PageHeader } from "@/components/app/page-header";
import { FilterBar, FilterField } from "@/components/app/filter-bar";
import { NativeSelect } from "@/components/app/native-select";
import { StatCard } from "@/components/app/stat-card";
import { Money } from "@/components/app/money";
import { EmptyState } from "@/components/app/empty-state";
import { TableWrap } from "@/components/app/table-wrap";
import { SummaryBand } from "@/components/app/summary-band";
import { IconChip, SectionTitle } from "@/components/app/bits";

import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/tones";
import { requestToday } from "@/lib/server/today";
import { CashEntryDialog } from "@/features/cashbook/cash-entry-dialog";
import { ExportCsvButton } from "@/components/app/export-csv-button";

import { getT } from "@/i18n/server";

export const metadata = { title: "Cash book" };

interface CashBook {
  from: string | null;
  to: string;
  openingBalancePaise: number;
  summary: {
    haptaCollectedPaise: number;
    otherReceiptsPaise: number;
    withdrawalsPaidPaise: number;
    otherExpensesPaise: number;
    loansGivenPaise: number;
    loanPaymentsReceivedPaise: number;
    totalReceiptsPaise: number;
    totalPaymentsPaise: number;
  };
  categories: {
    type: string;
    label: string;
    receiptsPaise: number;
    paymentsPaise: number;
    netPaise: number;
  }[];
  lines: {
    date: string;
    number?: string;
    description: string;
    type: string;
    isReversal: boolean;
    memberName: string | null;
    accountName: string;
    receiptPaise: number;
    paymentPaise: number;
    balancePaise: number;
  }[];
  closingBalancePaise: number;
}

/** Same colour per kind of money as the Transactions page. */
const LOOK: Record<string, { tone: Tone; icon: React.ReactNode }> = {
  hapta_collection: { tone: "emerald", icon: <ArrowDownToLine /> },
  fund_loan_given: { tone: "orange", icon: <HandCoins /> },
  fund_loan_payment: { tone: "orange", icon: <HandCoins /> },
  withdrawal: { tone: "rose", icon: <ArrowUpFromLine /> },
  interest_credit: { tone: "pink", icon: <Percent /> },
  donation: { tone: "emerald", icon: <Heart /> },
  other_income: { tone: "emerald", icon: <ArrowDownToLine /> },
  expense: { tone: "pink", icon: <Receipt /> },
  expense_reimbursement: { tone: "pink", icon: <Receipt /> },
  transfer: { tone: "slate", icon: <ArrowLeftRight /> },
  loan_disbursement: { tone: "violet", icon: <Landmark /> },
  loan_repayment: { tone: "violet", icon: <Landmark /> },
  opening_balance: { tone: "slate", icon: <Wallet /> },
  adjustment: { tone: "slate", icon: <Scale /> },
  reversal: { tone: "rose", icon: <RotateCcw /> },
  closing_distribution: { tone: "violet", icon: <Lock /> },
  member_joining: { tone: "emerald", icon: <UserPlus /> },
  member_leaving: { tone: "rose", icon: <LogOut /> },
};
const look = (l: { type: string; isReversal: boolean }) =>
  (l.isReversal ? LOOK.reversal : LOOK[l.type]) ?? {
    tone: "slate" as Tone,
    icon: <BookText />,
  };

export default async function CashBookPage({ params, searchParams }: PageProps<"/org/[orgId]/cashbook">) {
  const { orgId } = await params;
  const { t } = await getT();
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const today = await requestToday();
  const f = {
    from: str("from") || `${today.slice(0, 7)}-01`,
    to: str("to") || today,
    accountId: str("accountId"),
  };
  const [org, book, accounts] = await Promise.all([getOrg(orgId), api<CashBook>(`/orgs/${orgId}/cashbook${qs(f)}`), getAccounts(orgId)]);
  const s = book.summary;
  const active = accounts.filter((a) => a.isActive);
  return (
    <>
      <PageHeader
        title={t("cb.title")}
        description={t("cb.desc")}
        actions={
          <>
            <ExportCsvButton href={`/api/export${qs({ path: `/orgs/${orgId}/cashbook`, ...f })}`}>{t("cb.csv")}</ExportCsvButton>
            {can(org, "accounts.manage") && org.status === "active" && (
              <CashEntryDialog
                defaultOpen={sp.new === "1"}
                accounts={active.map((a) => ({ _id: a._id, name: a.name }))}
                categories={org.settings.expenseCategories.filter((c) => c.isActive).map((c) => ({ key: c.key, name: c.name }))}
              />
            )}
          </>
        }
      />
      <FilterBar resetHref={`/org/${orgId}/cashbook`}>
        <FilterField label={t("ap.from")}>
          <Input type="date" name="from" defaultValue={f.from} />
        </FilterField>
        <FilterField label={t("ap.to")}>
          <Input type="date" name="to" defaultValue={f.to} />
        </FilterField>
        {active.length > 1 && (
          <FilterField label={t("ap.account")}>
            <NativeSelect name="accountId" defaultValue={f.accountId}>
              <option value="">{t("cb.allCash")}</option>
              {active.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name}
                </option>
              ))}
            </NativeSelect>
          </FilterField>
        )}
      </FilterBar>
      <SummaryBand
        tone="green"
        icon={<BookOpenCheck />}
        label={active.length > 1 && f.accountId ? t("cb.closingIn", { name: active.find((a) => a._id === f.accountId)?.name ?? "" }) : t("cb.closing")}
        value={<Money paise={book.closingBalancePaise} />}
        sub={`${formatDate(f.from)} – ${formatDate(f.to)}${book.closingBalancePaise < 0 ? t("cb.belowZero") : ""}`}
        stats={[
          {
            label: t("cb.opening"),
            value: <Money paise={book.openingBalancePaise} />,
          },
          { label: t("cb.moneyIn"), value: <Money paise={s.totalReceiptsPaise} /> },
          { label: t("cb.moneyOut"), value: <Money paise={s.totalPaymentsPaise} /> },
        ]}
      />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label={t("cb.hapta")} value={<Money paise={s.haptaCollectedPaise} />} tone="good" icon={<ArrowDownToLine />} />
        <StatCard label={t("cb.upadIn")} value={<Money paise={s.loanPaymentsReceivedPaise} />} tone="good" icon={<HandCoins />} accent="orange" />
        <StatCard label={t("cb.otherIn")} value={<Money paise={s.otherReceiptsPaise} />} icon={<Heart />} accent="emerald" />
        <StatCard label={t("cb.upadGiven")} value={<Money paise={s.loansGivenPaise} />} icon={<HandCoins />} accent="orange" />
        <StatCard label={t("cb.withdrawals")} value={<Money paise={s.withdrawalsPaidPaise} />} icon={<ArrowUpFromLine />} accent="rose" />
        <StatCard label={t("cb.otherOut")} value={<Money paise={s.otherExpensesPaise} />} icon={<Receipt />} accent="pink" />
      </div>
      {book.lines.length > 0 && <SectionTitle>{t("cb.entries")}</SectionTitle>}
      {book.lines.length === 0 ? (
        <EmptyState icon={<BookOpenCheck />} title={t("cb.none")} description={t("cb.noneD")} />
      ) : (
        <>
          <ul className="flex flex-col gap-2 md:hidden" aria-label={t("cb.aria")}>
            <li className="flex items-center justify-between rounded-2xl bg-muted/50 px-3.5 py-2.5 text-sm font-semibold">
              <span>{t("cb.openingBal")}</span>
              <Money paise={book.openingBalancePaise} />
            </li>
            {book.lines.map((l, i) => {
              const lk = look(l);
              return (
                <li key={i} className={cn("rounded-2xl bg-card p-3.5 shadow-card ring-1 ring-foreground/[0.06]", l.isReversal && "opacity-80")}>
                  <div className="flex items-start gap-3">
                    <IconChip tone={lk.tone} size="sm">
                      {lk.icon}
                    </IconChip>
                    <div className="min-w-0 flex-1 text-sm">
                      <p className={cn("font-semibold", l.isReversal && "text-destructive")}>{l.description}</p>
                      <p className="text-xs text-muted-foreground">{[formatDate(l.date), l.number, active.length > 1 ? l.accountName : null].filter(Boolean).join(" · ")}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end">
                      {l.receiptPaise ? (
                        <span className="font-bold text-success">
                          + <Money paise={l.receiptPaise} />
                        </span>
                      ) : null}
                      {l.paymentPaise ? (
                        <span className="font-bold text-destructive">
                          − <Money paise={l.paymentPaise} />
                        </span>
                      ) : null}
                      <span className="text-[11px] text-muted-foreground">
                        {t("cb.bal")} <Money paise={l.balancePaise} colored={l.balancePaise < 0} />
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
            <li className="flex items-center justify-between rounded-2xl bg-muted/50 px-3.5 py-2.5 text-sm font-bold">
              <span>{t("cb.closing")}</span>
              <Money paise={book.closingBalancePaise} colored={book.closingBalancePaise < 0} />
            </li>
          </ul>
          <div className="hidden md:block">
            <TableWrap>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("ap.date")}</TableHead>
                    <TableHead>{t("cb.particulars")}</TableHead>
                    <TableHead className="text-right">{t("cb.in")}</TableHead>
                    <TableHead className="text-right">{t("cb.out")}</TableHead>
                    <TableHead className="text-right">{t("cb.balance")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-muted/40">
                    <TableCell />
                    <TableCell className="font-semibold">{t("cb.openingBal")}</TableCell>
                    <TableCell />
                    <TableCell />
                    <TableCell className="text-right font-semibold">
                      <Money paise={book.openingBalancePaise} />
                    </TableCell>
                  </TableRow>
                  {book.lines.map((l, i) => {
                    const lk = look(l);
                    return (
                      <TableRow key={i}>
                        <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(l.date)}</TableCell>
                        <TableCell className="min-w-40 whitespace-normal">
                          <span className="inline-flex items-center gap-2.5">
                            <IconChip tone={lk.tone} size="sm">
                              {lk.icon}
                            </IconChip>
                            <span>
                              <span className={cn("block font-medium", l.isReversal && "text-destructive")}>{l.description}</span>
                              {(l.number || active.length > 1) && (
                                <span className="block text-xs text-muted-foreground">{[l.number, active.length > 1 ? l.accountName : null].filter(Boolean).join(" · ")}</span>
                              )}
                            </span>
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{l.receiptPaise ? <Money paise={l.receiptPaise} className="font-semibold text-success" /> : ""}</TableCell>
                        <TableCell className="text-right">{l.paymentPaise ? <Money paise={l.paymentPaise} className="font-semibold text-destructive" /> : ""}</TableCell>
                        <TableCell className="text-right">
                          <Money paise={l.balancePaise} colored={l.balancePaise < 0} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-muted/40 font-semibold">
                    <TableCell />
                    <TableCell>{t("cb.closing")}</TableCell>
                    <TableCell className="text-right">
                      <Money paise={s.totalReceiptsPaise} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Money paise={s.totalPaymentsPaise} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Money paise={book.closingBalancePaise} colored={book.closingBalancePaise < 0} />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableWrap>
          </div>
        </>
      )}
    </>
  );
}
