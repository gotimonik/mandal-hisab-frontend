import { BookText } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Transactions" };

const TYPES: Record<string, string> = {
  opening_balance: "Opening balance",
  hapta_collection: "Hapta collection",
  other_income: "Other income",
  donation: "Donation",
  expense: "Expense",
  expense_reimbursement: "Reimbursement",
  transfer: "Transfer",
  loan_disbursement: "Loan disbursed",
  loan_repayment: "Loan repayment",
  adjustment: "Adjustment",
  reversal: "Reversal",
};

const SYSTEM: Record<string, string> = {
  "asset:loans_receivable": "Loans receivable",
  "liability:reimbursements_payable": "Reimbursements payable",
  "equity:opening_balance": "Opening balance equity",
  "equity:adjustments": "Adjustments",
  "income:hapta": "Hapta income",
  "income:donation": "Donations",
  "income:interest": "Interest income",
  "income:penalty": "Late fees",
  "income:membership_fee": "Membership fees",
  "income:event": "Event income",
  "income:other": "Other income",
};

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
  return (
    <>
      <PageHeader title="Transactions" description="The double-entry journal. Every entry balances; corrections appear as reversals, never edits." />
      <FilterBar resetHref={`/org/${orgId}/transactions`}>
        <FilterField label="Type">
          <NativeSelect name="type" defaultValue={f.type}>
            <option value="">All</option>
            {Object.entries(TYPES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
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
        <EmptyState icon={<BookText />} title="No transactions" />
      ) : (
        <TableWrap>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date / no.</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Entries (Dr / Cr)</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((t) => (
                <TableRow key={t._id} className={t.reversedBy ? "text-muted-foreground" : ""}>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(t.date)}
                    <div className="font-mono text-xs text-muted-foreground">{t.number}</div>
                  </TableCell>
                  <TableCell className="min-w-56">
                    <div>{t.description}</div>
                    <div className="text-xs text-muted-foreground">
                      {TYPES[t.type] ?? t.type}
                      {t.reason ? ` · ${t.reason}` : ""}
                    </div>
                    {t.reversedBy && <StatusBadge status="reversed" className="mt-1" />}
                  </TableCell>
                  <TableCell className="min-w-56 text-xs">
                    {t.lines.map((l, i) => (
                      <div key={i} className="flex justify-between gap-3">
                        <span className={l.creditPaise ? "pl-4" : ""}>
                          {l.debitPaise ? "Dr" : "Cr"} {names[l.accountKey] ?? l.accountKey}
                        </span>
                        <Money paise={l.debitPaise || l.creditPaise} />
                      </div>
                    ))}
                  </TableCell>
                  <TableCell className="text-right">
                    <Money paise={t.amountPaise} />
                  </TableCell>
                  <TableCell className="text-right">
                    {canAdjust && !t.reversedBy && ["transfer", "adjustment", "opening_balance"].includes(t.type) && (
                      <ActionButton path={`/orgs/${orgId}/transactions/${t._id}/reverse`} size="xs" variant="ghost" successMessage="Reversal posted" confirm={{ title: `Reverse ${t.number}?`, description: "A mirror entry is posted today. The original stays visible.", reason: "required", destructive: true, confirmLabel: "Reverse" }}>
                        Reverse
                      </ActionButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableWrap>
      )}
      <Pagination page={data.page} pageSize={data.pageSize} total={data.total} baseHref={`/org/${orgId}/transactions`} params={f} />
    </>
  );
}
