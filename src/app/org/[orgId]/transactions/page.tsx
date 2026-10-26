import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  BookText,
  HandCoins,
  Heart,
  Landmark,
  Lock,
  Percent,
  Receipt,
  RotateCcw,
  Scale,
  Wallet,
} from "lucide-react";
import { api, qs } from "@/lib/server/api";
import { getAccounts, getOrg, can } from "@/lib/server/data";
import type { Paged, Txn } from "@/lib/types";
import { PageHeader } from "@/components/app/page-header";
import { FilterBar, FilterField } from "@/components/app/filter-bar";
import { NativeSelect } from "@/components/app/native-select";
import { Pagination } from "@/components/app/pagination";
import { StatusBadge } from "@/components/app/status-badge";
import { Money } from "@/components/app/money";
import { EmptyState } from "@/components/app/empty-state";
import { TableWrap } from "@/components/app/table-wrap";
import { ActionButton } from "@/components/app/action-button";
import { IconChip } from "@/components/app/bits";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/tones";

export const metadata = { title: "Transactions" };

/** Every transaction type the backend posts: label, icon and colour. */
const TYPES: Record<string, { label: string; tone: Tone; icon: React.ReactNode }> = {
  hapta_collection: { label: "Hapta collection", tone: "emerald", icon: <ArrowDownToLine /> },
  fund_loan_given: { label: "Upad given", tone: "orange", icon: <HandCoins /> },
  fund_loan_payment: { label: "Upad payment", tone: "orange", icon: <HandCoins /> },
  withdrawal: { label: "Withdrawal", tone: "rose", icon: <ArrowUpFromLine /> },
  interest_credit: { label: "Interest credited", tone: "pink", icon: <Percent /> },
  donation: { label: "Donation", tone: "emerald", icon: <Heart /> },
  other_income: { label: "Other income", tone: "emerald", icon: <ArrowDownToLine /> },
  expense: { label: "Expense", tone: "pink", icon: <Receipt /> },
  expense_reimbursement: { label: "Reimbursement", tone: "pink", icon: <Receipt /> },
  transfer: { label: "Transfer", tone: "slate", icon: <ArrowLeftRight /> },
  loan_disbursement: { label: "Loan disbursed", tone: "violet", icon: <Landmark /> },
  loan_repayment: { label: "Loan repayment", tone: "violet", icon: <Landmark /> },
  opening_balance: { label: "Opening balance", tone: "slate", icon: <Wallet /> },
  member_opening: { label: "Member opening balance", tone: "slate", icon: <Wallet /> },
  member_adjustment: { label: "Member adjustment", tone: "slate", icon: <Scale /> },
  adjustment: { label: "Adjustment", tone: "slate", icon: <Scale /> },
  reversal: { label: "Reversal", tone: "rose", icon: <RotateCcw /> },
  closing_distribution: { label: "Closing share-out", tone: "violet", icon: <Lock /> },
};
const typeOf = (t: string) => TYPES[t] ?? { label: t.replace(/_/g, " "), tone: "slate" as Tone, icon: <BookText /> };

/** Plain names for the Mandal's internal ledger accounts. */
const SYSTEM: Record<string, string> = {
  "liability:member_funds": "Member savings",
  "asset:fund_loans": "Upad given out",
  "asset:loans_receivable": "Loans receivable",
  "liability:reimbursements_payable": "Reimbursements payable",
  "equity:opening_balance": "Opening balance",
  "equity:adjustments": "Adjustments",
  "equity:accumulated_surplus": "Mandal's own money",
  "equity:closing_distribution": "Closing share-out",
  "income:hapta": "Hapta income",
  "income:donation": "Donations",
  "income:interest": "Interest income",
  "income:penalty": "Late fees",
  "income:membership_fee": "Membership fees",
  "income:event": "Event income",
  "income:other": "Other income",
  "expense:member_interest": "Interest paid to members",
};

type Group = { side: "Dr" | "Cr"; key: string; total: number; count: number };

/** Lines on the same account and side are added together (a 30-member hapta collection is one line, ×30). */
function groupLines(lines: Txn["lines"]): Group[] {
  const map = new Map<string, Group>();
  for (const l of lines) {
    const side = l.debitPaise ? "Dr" : "Cr";
    const k = `${side}|${l.accountKey}`;
    const g = map.get(k) ?? { side, key: l.accountKey, total: 0, count: 0 };
    g.total += l.debitPaise || l.creditPaise;
    g.count += 1;
    map.set(k, g);
  }
  return [...map.values()].sort((a, b) => (a.side === b.side ? 0 : a.side === "Dr" ? -1 : 1));
}

function Entries({ t, names, className }: { t: Txn; names: Record<string, string>; className?: string }) {
  const groups = groupLines(t.lines);
  const name = (k: string) => names[k] ?? k;
  return (
    <div className={cn("text-xs", className)}>
      <dl className="grid grid-cols-[auto_1fr_auto] items-baseline gap-x-2 gap-y-0.5">
        {groups.map((g) => (
          <div key={`${g.side}${g.key}`} className="contents">
            <dt className={cn("font-semibold", g.side === "Dr" ? "text-emerald-700 dark:text-emerald-400" : "pl-3 text-sky-700 dark:text-sky-400")}>{g.side}</dt>
            <dd className="min-w-0 truncate">
              {name(g.key)}
              {g.count > 1 && <span className="ml-1 rounded bg-muted px-1 text-[10px] text-muted-foreground tabular-nums">×{g.count}</span>}
            </dd>
            <dd className="text-right">
              <Money paise={g.total} />
            </dd>
          </div>
        ))}
      </dl>
      {groups.length < t.lines.length && (
        <details className="mt-1">
          <summary className="cursor-pointer text-[11px] font-medium text-primary">Show all {t.lines.length} lines</summary>
          <div className="mt-1 max-h-56 overflow-y-auto rounded-lg bg-muted/50 p-2">
            {t.lines.map((l, i) => (
              <div key={i} className="flex justify-between gap-3">
                <span className={l.creditPaise ? "pl-3" : ""}>
                  {l.debitPaise ? "Dr" : "Cr"} {name(l.accountKey)}
                </span>
                <Money paise={l.debitPaise || l.creditPaise} />
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

export default async function TransactionsPage({ params, searchParams }: PageProps<"/org/[orgId]/transactions">) {
  const { orgId } = await params;
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const f = { type: str("type"), accountId: str("accountId"), from: str("from"), to: str("to") };
  const page = Number(sp.page ?? 1) || 1;
  const [org, data, accounts] = await Promise.all([getOrg(orgId), api<Paged<Txn>>(`/orgs/${orgId}/transactions${qs({ ...f, page })}`), getAccounts(orgId)]);
  const names: Record<string, string> = { ...SYSTEM };
  for (const a of accounts) names[`fa:${a._id}`] = a.name;
  for (const c of org.settings.expenseCategories) names[`expense:${c.key}`] = `Expense · ${c.name}`;
  const canAdjust = can(org, "transactions.adjust") && org.status === "active";
  const reversible = (t: Txn) => canAdjust && !t.reversedBy && ["transfer", "adjustment", "opening_balance"].includes(t.type);
  const reverse = (t: Txn) => (
    <ActionButton path={`/orgs/${orgId}/transactions/${t._id}/reverse`} size="xs" variant="ghost" successMessage="Reversal posted" confirm={{ title: `Reverse ${t.number}?`, description: "A mirror entry is posted today. The original stays visible.", reason: "required", destructive: true, confirmLabel: "Reverse" }}>
      <RotateCcw /> Reverse
    </ActionButton>
  );
  const typePill = (t: Txn) => {
    const ty = typeOf(t.type);
    return <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">{ty.label}</span>;
  };

  return (
    <>
      <PageHeader title="Transactions" description="Every money movement, newest first. Each entry balances (Dr = Cr); mistakes are corrected with a reversal, never edited." />
      <FilterBar resetHref={`/org/${orgId}/transactions`}>
        <FilterField label="Type">
          <NativeSelect name="type" defaultValue={f.type}>
            <option value="">All</option>
            {Object.entries(TYPES).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </NativeSelect>
        </FilterField>
        <FilterField label="Account">
          <NativeSelect name="accountId" defaultValue={f.accountId}>
            <option value="">All</option>
            {accounts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </NativeSelect>
        </FilterField>
        <FilterField label="From">
          <Input type="date" name="from" defaultValue={f.from} />
        </FilterField>
        <FilterField label="To">
          <Input type="date" name="to" defaultValue={f.to} />
        </FilterField>
      </FilterBar>

      {data.items.length === 0 ? (
        <EmptyState icon={<BookText />} title="No transactions" description="Nothing matches these filters." />
      ) : (
        <>
          {/* phones: cards */}
          <ul className="flex flex-col gap-2 md:hidden" aria-label="Transactions">
            {data.items.map((t) => {
              const ty = typeOf(t.type);
              return (
                <li key={t._id} className={cn("rounded-2xl bg-card p-3.5 shadow-card ring-1 ring-foreground/[0.06]", t.reversedBy && "opacity-60")}>
                  <div className="flex items-start gap-3">
                    <IconChip tone={ty.tone} size="sm">
                      {ty.icon}
                    </IconChip>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug">{t.description}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        {formatDate(t.date)} · <span className="font-mono">{t.number}</span>
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {typePill(t)}
                        {t.reversedBy && <StatusBadge status="reversed" />}
                      </div>
                      {t.reason && <p className="mt-1 text-xs text-muted-foreground">{t.reason}</p>}
                    </div>
                    <Money paise={t.amountPaise} className="shrink-0 text-sm font-bold" />
                  </div>
                  <Entries t={t} names={names} className="mt-2.5 rounded-xl bg-muted/40 p-2.5" />
                  {reversible(t) && <div className="mt-1.5 flex justify-end">{reverse(t)}</div>}
                </li>
              );
            })}
          </ul>

          {/* wider screens: table */}
          <div className="hidden md:block">
            <TableWrap>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date / no.</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="min-w-72">Entries</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((t) => {
                    const ty = typeOf(t.type);
                    return (
                      <TableRow key={t._id} className={cn("align-top", t.reversedBy && "text-muted-foreground")}>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(t.date)}
                          <div className="font-mono text-xs text-muted-foreground">{t.number}</div>
                        </TableCell>
                        <TableCell className="min-w-64 whitespace-normal">
                          <div className="flex items-start gap-2.5">
                            <IconChip tone={ty.tone} size="sm">
                              {ty.icon}
                            </IconChip>
                            <div className="min-w-0">
                              <div className="leading-snug">{t.description}</div>
                              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                {typePill(t)}
                                {t.reversedBy && <StatusBadge status="reversed" />}
                              </div>
                              {t.reason && <div className="mt-1 text-xs text-muted-foreground">{t.reason}</div>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-normal">
                          <Entries t={t} names={names} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Money paise={t.amountPaise} className="font-semibold" />
                        </TableCell>
                        <TableCell className="text-right">{reversible(t) && reverse(t)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableWrap>
          </div>
        </>
      )}
      <Pagination page={data.page} pageSize={data.pageSize} total={data.total} baseHref={`/org/${orgId}/transactions`} params={f} />
    </>
  );
}
