import { Paperclip, Receipt } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
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
  return (
    <>
      <PageHeader
        title="Expenses"
        description={
          <>
            Approved expenses in view: <Money paise={data.approvedTotalPaise} className="font-medium text-foreground" />. Pending expenses are not counted until approved.
          </>
        }
        actions={
          can(org, "expenses.submit") && org.status === "active" ? (
            <ExpenseDialog accounts={active} methods={org.settings.paymentMethods} categories={cats.filter((c) => c.isActive)} thresholdPaise={org.settings.expenseApprovalThresholdPaise} />
          ) : null
        }
      />
      <FilterBar resetHref={`/org/${orgId}/expenses`}>
        <FilterField label="Status">
          <NativeSelect name="status" defaultValue={f.status}>
            <option value="">All</option>
            <option value="pending">Pending approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="reversed">Reversed</option>
          </NativeSelect>
        </FilterField>
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
        <EmptyState icon={<Receipt />} title="No expenses found" />
      ) : (
        <TableWrap>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Payee / description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((x) => (
                <TableRow key={x._id}>
                  <TableCell className="whitespace-nowrap">{formatDate(x.date)}</TableCell>
                  <TableCell className="min-w-48">
                    <span className="font-medium">{x.payeeName}</span>
                    <div className="text-xs text-muted-foreground">{x.description}</div>
                    <div className="text-xs text-muted-foreground">
                      by {x.submittedByName ?? "—"}
                      {x.eventName ? ` · ${x.eventName}` : ""}
                      {x.paidBy === "out_of_pocket" ? ` · out of pocket (${x.reimbursement?.status ?? "pending"})` : ""}
                    </div>
                    {x.attachments?.map((a) => (
                      <a key={a.url} href={a.url} target="_blank" rel="noreferrer" className="mr-2 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                        <Paperclip className="size-3" /> {a.name}
                      </a>
                    ))}
                  </TableCell>
                  <TableCell>{catName(x.categoryKey)}</TableCell>
                  <TableCell className="text-right">
                    <Money paise={x.amountPaise} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={x.status} />
                    {(x.rejectionReason || x.reversalReason) && <div className="max-w-40 truncate text-xs text-muted-foreground">{x.rejectionReason ?? x.reversalReason}</div>}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {x.status === "pending" && canApprove && (
                        <>
                          <ActionButton path={`/orgs/${orgId}/expenses/${x._id}/approve`} size="xs" variant="default" successMessage="Expense approved" confirm={{ title: "Approve this expense?", description: "It will be posted to the ledger and reduce the account balance." }}>
                            Approve
                          </ActionButton>
                          <ActionButton path={`/orgs/${orgId}/expenses/${x._id}/reject`} size="xs" variant="ghost" successMessage="Expense rejected" confirm={{ title: "Reject this expense?", reason: "required", destructive: true, confirmLabel: "Reject" }}>
                            Reject
                          </ActionButton>
                        </>
                      )}
                      {x.status === "approved" && x.paidBy === "out_of_pocket" && x.reimbursement?.status === "pending" && canApprove && <ReimburseDialog expenseId={x._id} accounts={active} payee={x.payeeName} amountPaise={x.amountPaise} />}
                      {x.status === "approved" && can(org, "transactions.adjust") && x.reimbursement?.status !== "reimbursed" && (
                        <ActionButton path={`/orgs/${orgId}/expenses/${x._id}/reverse`} size="xs" variant="ghost" successMessage="Expense reversed" confirm={{ title: "Reverse this expense?", description: "A reversal entry is posted; the original stays in the ledger.", reason: "required", destructive: true, confirmLabel: "Reverse" }}>
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
      <Pagination page={data.page} pageSize={data.pageSize} total={data.total} baseHref={`/org/${orgId}/expenses`} params={f} />
    </>
  );
}
