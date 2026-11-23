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

import { getT } from "@/i18n/server";
import type { Key } from "@/i18n/core";

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

const STATUSES = ["", "pending", "approved", "rejected", "reversed"] as const;

export default async function ExpensesPage({ params, searchParams }: PageProps<"/org/[orgId]/expenses">) {
  const { orgId } = await params;
  const { t } = await getT();
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
    [t("exp.by", { name: x.submittedByName ?? "—" }), x.eventName, x.paidBy === "out_of_pocket" ? t("exp.oop", { status: t(`status.${x.reimbursement?.status ?? "pending"}` as Key) }) : ""].filter(Boolean).join(" · ");
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
          <ActionButton path={`/orgs/${orgId}/expenses/${x._id}/reject`} size="xs" variant="ghost" successMessage={t("exp.rejected")} confirm={{ title: t("exp.rejectQ"), reason: "required", destructive: true, confirmLabel: t("ap.reject") }}>
            {t("ap.reject")}
          </ActionButton>
          <ActionButton path={`/orgs/${orgId}/expenses/${x._id}/approve`} size="xs" variant="default" successMessage={t("exp.approved")} confirm={{ title: t("exp.approveQ"), description: t("exp.approveD") }}>
            {t("ap.approve")}
          </ActionButton>
        </>
      )}
      {x.status === "approved" && x.paidBy === "out_of_pocket" && x.reimbursement?.status === "pending" && canApprove && <ReimburseDialog expenseId={x._id} accounts={active} payee={x.payeeName} amountPaise={x.amountPaise} />}
      {x.status === "approved" && can(org, "transactions.adjust") && x.reimbursement?.status !== "reimbursed" && (
        <ActionButton path={`/orgs/${orgId}/expenses/${x._id}/reverse`} size="xs" variant="ghost" successMessage={t("exp.reversed")} confirm={{ title: t("exp.reverseQ"), description: t("exp.reverseD"), reason: "required", destructive: true, confirmLabel: t("ap.reverse") }}>
          {t("ap.reverse")}
        </ActionButton>
      )}
    </>
  );

  return (
    <>
      <PageHeader
        title={t("exp.title")}
        description={t("exp.desc")}
        actions={
          can(org, "expenses.submit") && org.status === "active" ? (
            <ExpenseDialog accounts={active} methods={org.settings.paymentMethods} categories={cats.filter((c) => c.isActive)} thresholdPaise={org.settings.expenseApprovalThresholdPaise} />
          ) : null
        }
      />
      <SummaryBand
        tone="warm"
        icon={<Wallet />}
        label={t("exp.inView")}
        value={<Money paise={data.approvedTotalPaise} />}
        sub={`${data.total === 1 ? t("ap.record1") : t("ap.records", { n: data.total })}${f.from || f.to ? ` · ${f.from ? formatDate(f.from) : t("ap.start")} – ${f.to ? formatDate(f.to) : t("ap.today")}` : ""}`}
      />
      <ChipLinks label={t("ap.status")} current={f.status} items={STATUSES.map((k) => ({ key: k, label: k ? t(`exp.st.${k}` as Key) : t("ap.all"), href: href({ status: k, page: "" }) }))} />
      <FilterBar resetHref={`/org/${orgId}/expenses`}>
        {f.status && <input type="hidden" name="status" value={f.status} />}
        <FilterField label={t("ap.category")}>
          <NativeSelect name="categoryKey" defaultValue={f.categoryKey}>
            <option value="">{t("ap.all")}</option>
            {cats.map((c) => (
              <option key={c.key} value={c.key}>
                {c.name}
              </option>
            ))}
          </NativeSelect>
        </FilterField>
        <FilterField label={t("ap.from")}>
          <Input type="date" name="from" defaultValue={f.from} />
        </FilterField>
        <FilterField label={t("ap.to")}>
          <Input type="date" name="to" defaultValue={f.to} />
        </FilterField>
      </FilterBar>
      {data.items.length === 0 ? (
        <EmptyState icon={<Receipt />} title={t("exp.none")} description={t("exp.noneD")} />
      ) : (
        <>
          <ul className="flex flex-col gap-2 md:hidden" aria-label={t("exp.title")}>
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
                    <TableHead>{t("exp.payeeDesc")}</TableHead>
                    <TableHead>{t("ap.category")}</TableHead>
                    <TableHead className="text-right">{t("ap.amount")}</TableHead>
                    <TableHead>{t("ap.status")}</TableHead>
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
