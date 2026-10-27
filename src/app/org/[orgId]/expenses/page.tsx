import { Paperclip, Receipt, Wallet } from "lucide-react";
import { api, qs } from "@/lib/server/api";
import { getAccounts, getOrg, can } from "@/lib/server/data";
import type { Paged } from "@/lib/types";
import { PageHeader } from "@/components/app/page-header";
import { FilterBar, FilterField } from "@/components/app/filter-bar";
import { NativeSelect } from "@/components/app/native-select";
import { Pagination } from "@/components/app/pagination";
import { StatusBadge } from "@/components/app/status-badge";
import { Money } from "@/components/app/money";
import { EmptyState } from "@/components/app/empty-state";
import { TableWrap } from "@/components/app/table-wrap";
import { ActionButton } from "@/components/app/action-button";
import { SummaryBand } from "@/components/app/summary-band";
import { ChipLinks } from "@/components/app/chip-links";
import { IconChip } from "@/components/app/bits";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ExpenseDialog, ReimburseDialog } from "@/features/expenses/expense-form";

export const metadata = { title: "Expenses" };

interface Expense {
  _id: string;
  categoryKey: string;
  payeeName: string;
  description: string;
  amountPaise: number;
  date: string;
  method: string;
  paidBy: string;
  reimbursement?: { status: string };
  eventName?: string;
  attachments?: { url: string; name: string }[];
  status: string;
  rejectionReason?: string;
  reversalReason?: string;
  submittedByName: string | null;
}

const STATUSES = [
  ["", "All"],
  ["pending", "Pending approval"],
  ["approved", "Approved"],
  ["rejected", "Rejected"],
  ["reversed", "Reversed"],
] as const;

export default async function ExpensesPage({ params, searchParams }: PageProps<"/org/[orgId]/expenses">) {
  const { orgId } = await params;
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const f = { status: str("status"), categoryKey: str("categoryKey"), from: str("from"), to: str("to"), eventName: str("eventName") };
  const page = Number(sp.page ?? 1) || 1;
  const [org, data, accounts] = await Promise.all([getOrg(orgId), api<Paged<Expense> & { approvedTotalPaise: number }>(`/orgs/${orgId}/expenses${qs({ ...f, page })}`), getAccounts(orgId)]);
  const cats = org.settings.expenseCategories;
  const catName = (k: string) => cats.find((c) => c.key === k)?.name ?? k;
  const active = accounts.filter((a) => a.isActive).map((a) => ({ _id: a._id, name: a.name }));
  const canApprove = can(org, "expenses.approve");
  const href = (over: Record<string, string>) => `/org/${orgId}/expenses${qs({ ...f, ...over })}`;

  const byLine = (x: Expense) =>
    [`by ${x.submittedByName ?? "—"}`, x.eventName, x.paidBy === "out_of_pocket" ? `out of pocket (${x.reimbursement?.status ?? "pending"})` : ""].filter(Boolean).join(" · ");
  const attachments = (x: Expense) =>
    x.attachments?.map((a) => (
      <a key={a.url} href={a.url} target="_blank" rel="noreferrer" className="mr-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
        <Paperclip className="size-3" /> {a.name}
      </a>
    ));
  const actions = (x: Expense) => (
    <>
      {x.status === "pending" && canApprove && (
        <>
          <ActionButton path={`/orgs/${orgId}/expenses/${x._id}/reject`} size="xs" variant="ghost" successMessage="Expense rejected" confirm={{ title: "Reject this expense?", reason: "required", destructive: true, confirmLabel: "Reject" }}>
            Reject
          </ActionButton>
          <ActionButton path={`/orgs/${orgId}/expenses/${x._id}/approve`} size="xs" variant="default" successMessage="Expense approved" confirm={{ title: "Approve this expense?", description: "It will be posted to the ledger and reduce the account balance." }}>
            Approve
          </ActionButton>
        </>
      )}
      {x.status === "approved" && x.paidBy === "out_of_pocket" && x.reimbursement?.status === "pending" && canApprove && <ReimburseDialog expenseId={x._id} accounts={active} payee={x.payeeName} amountPaise={x.amountPaise} />}
      {x.status === "approved" && can(org, "transactions.adjust") && x.reimbursement?.status !== "reimbursed" && (
        <ActionButton path={`/orgs/${orgId}/expenses/${x._id}/reverse`} size="xs" variant="ghost" successMessage="Expense reversed" confirm={{ title: "Reverse this expense?", description: "A reversal entry is posted; the original stays in the ledger.", reason: "required", destructive: true, confirmLabel: "Reverse" }}>
          Reverse
        </ActionButton>
      )}
    </>
  );

  return (
    <>
      <PageHeader
        title="Expenses"
        description="Money spent by the Mandal. Pending expenses are not counted until approved."
        actions={
          can(org, "expenses.submit") && org.status === "active" ? (
            <ExpenseDialog accounts={active} methods={org.settings.paymentMethods} categories={cats.filter((c) => c.isActive)} thresholdPaise={org.settings.expenseApprovalThresholdPaise} />
          ) : null
        }
      />
      <SummaryBand
        tone="warm"
        icon={<Wallet />}
        label="Approved expenses in view"
        value={<Money paise={data.approvedTotalPaise} />}
        sub={`${data.total} record${data.total === 1 ? "" : "s"}${f.from || f.to ? ` · ${f.from ? formatDate(f.from) : "start"} – ${f.to ? formatDate(f.to) : "today"}` : ""}`}
      />
      <ChipLinks label="Status" current={f.status} items={STATUSES.map(([k, l]) => ({ key: k, label: l, href: href({ status: k, page: "" }) }))} />
      <FilterBar resetHref={`/org/${orgId}/expenses`}>
        {f.status && <input type="hidden" name="status" value={f.status} />}
        <FilterField label="Category">
          <NativeSelect name="categoryKey" defaultValue={f.categoryKey}>
            <option value="">All</option>
            {cats.map((c) => (
              <option key={c.key} value={c.key}>
                {c.name}
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
        <EmptyState icon={<Receipt />} title="No expenses found" description="Try another status, category or date range." />
      ) : (
        <>
          <ul className="flex flex-col gap-2 md:hidden" aria-label="Expenses">
            {data.items.map((x) => (
              <li key={x._id} className={cn("rounded-2xl bg-card p-3.5 shadow-card ring-1 ring-foreground/[0.06]", x.status === "pending" && "ring-2 ring-amber-400/40", (x.status === "rejected" || x.status === "reversed") && "opacity-70")}>
                <div className="flex items-start gap-3">
                  <IconChip tone="orange" size="sm">
                    <Receipt />
                  </IconChip>
                  <div className="min-w-0 flex-1 text-sm">
                    <span className="font-semibold">{x.payeeName}</span>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(x.date)} · {catName(x.categoryKey)}
                    </p>
                    {x.description && <p className="text-xs text-muted-foreground">{x.description}</p>}
                    <p className="truncate text-xs text-muted-foreground">{byLine(x)}</p>
                    {attachments(x)}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Money paise={x.amountPaise} className="font-bold" />
                    <StatusBadge status={x.status} />
                  </div>
                </div>
                {(x.rejectionReason || x.reversalReason) && <p className="mt-2 rounded-lg bg-muted/60 px-2.5 py-1.5 text-xs text-muted-foreground">{x.rejectionReason ?? x.reversalReason}</p>}
                <div className="mt-2 flex flex-wrap items-center justify-end gap-1 empty:hidden">{actions(x)}</div>
              </li>
            ))}
          </ul>
          <div className="hidden md:block">
            <TableWrap>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payee / description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((x) => (
                    <TableRow key={x._id} className={cn((x.status === "rejected" || x.status === "reversed") && "text-muted-foreground")}>
                      <TableCell className="min-w-56 whitespace-normal">
                        <span className="font-semibold">{x.payeeName}</span>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(x.date)}
                          {x.description ? ` · ${x.description}` : ""}
                        </div>
                        <div className="text-xs text-muted-foreground">{byLine(x)}</div>
                        {attachments(x)}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-2">
                          <IconChip tone="orange" size="sm">
                            <Receipt />
                          </IconChip>
                          {catName(x.categoryKey)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Money paise={x.amountPaise} className="font-semibold" />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={x.status} />
                        {(x.rejectionReason || x.reversalReason) && <div className="max-w-40 truncate text-xs text-muted-foreground">{x.rejectionReason ?? x.reversalReason}</div>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">{actions(x)}</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrap>
          </div>
        </>
      )}
      <Pagination page={data.page} pageSize={data.pageSize} total={data.total} baseHref={`/org/${orgId}/expenses`} params={f} />
    </>
  );
}
