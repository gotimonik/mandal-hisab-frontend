import Link from "next/link";
import { HandCoins } from "lucide-react";
import { api, qs } from "@/lib/server/api";
import { getAccounts, getActiveMembers, getOrg, getSchemes, can } from "@/lib/server/data";
import type { Paged, Payment } from "@/lib/types";
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
import { METHOD_LABEL, formatDate, label } from "@/lib/format";
import { RecordPaymentDialog } from "@/features/collections/record-payment";
import { VerifyDialog } from "@/features/collections/verify-dialog";

export const metadata = { title: "Collections" };

const KIND: Record<string, string> = { hapta: "Hapta", membership_fee: "Membership fee", event: "Event", other_income: "Other income" };

export default async function CollectionsPage({ params, searchParams }: PageProps<"/org/[orgId]/collections">) {
  const { orgId } = await params;
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const f = { status: str("status"), kind: str("kind"), method: str("method"), from: str("from"), to: str("to"), memberId: str("memberId") };
  const page = Number(sp.page ?? 1) || 1;
  const org = await getOrg(orgId);
  const canRecord = can(org, "payments.record") && org.status === "active";
  const [data, accounts, members, schemes] = await Promise.all([
    api<Paged<Payment> & { totalAmountPaise: number }>(`/orgs/${orgId}/payments${qs({ ...f, page, pageSize: 25 })}`),
    getAccounts(orgId),
    canRecord ? getActiveMembers(orgId) : Promise.resolve([]),
    canRecord ? getSchemes(orgId) : Promise.resolve([]),
  ]);
  const activeAccounts = accounts.filter((a) => a.isActive).map((a) => ({ _id: a._id, name: a.name }));
  const canVerify = can(org, "payments.verify");
  const canReverse = can(org, "payments.reverse");
  return (
    <>
      <PageHeader
        title="Collections"
        description={`Money received · ${data.total} ${f.status ? `${f.status} ` : ""}record${data.total === 1 ? "" : "s"}`}
        actions={
          canRecord ? (
            <RecordPaymentDialog
              members={members.map((m) => ({ _id: m._id, name: m.name, membershipNumber: m.membershipNumber }))}
              accounts={activeAccounts}
              schemes={schemes.filter((s) => s.status === "active").map((s) => ({ _id: s._id, name: s.name }))}
              methods={org.settings.paymentMethods}
              defaultOpen={str("new") === "1"}
              defaultMemberId={f.memberId || undefined}
            />
          ) : null
        }
      />
      <FilterBar resetHref={`/org/${orgId}/collections`}>
        <FilterField label="Status">
          <NativeSelect name="status" defaultValue={f.status}>
            <option value="">All</option>
            <option value="pending">Pending verification</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
            <option value="reversed">Reversed</option>
          </NativeSelect>
        </FilterField>
        <FilterField label="Type">
          <NativeSelect name="kind" defaultValue={f.kind}>
            <option value="">All</option>
            {Object.entries(KIND).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </NativeSelect>
        </FilterField>
        <FilterField label="Method">
          <NativeSelect name="method" defaultValue={f.method}>
            <option value="">All</option>
            {org.settings.paymentMethods.map((m) => (
              <option key={m} value={m}>
                {label(METHOD_LABEL, m)}
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
      <p className="mb-2 text-sm">
        Total of listed records: <Money paise={data.totalAmountPaise} className="font-semibold" />
      </p>
      {data.items.length === 0 ? (
        <EmptyState icon={<HandCoins />} title="No collections found" />
      ) : (
        <TableWrap>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Payer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((p) => (
                <TableRow key={p._id}>
                  <TableCell className="whitespace-nowrap">{formatDate(p.date)}</TableCell>
                  <TableCell>
                    {p.memberId ? (
                      <Link href={`/org/${orgId}/members/${p.memberId}`} className="font-medium hover:underline">
                        {p.payerName}
                      </Link>
                    ) : (
                      <span className="font-medium">{p.payerName}</span>
                    )}
                    {p.source === "member_request" && <div className="text-xs text-muted-foreground">submitted by member</div>}
                  </TableCell>
                  <TableCell>
                    {KIND[p.kind]}
                    {p.eventName && <div className="text-xs text-muted-foreground">{p.eventName}</div>}
                  </TableCell>
                  <TableCell>
                    {label(METHOD_LABEL, p.method)}
                    {p.reference && <div className="text-xs text-muted-foreground">{p.reference}</div>}
                    {p.accountName && <div className="text-xs text-muted-foreground">→ {p.accountName}</div>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Money paise={p.amountPaise} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={p.status} />
                    {(p.rejectedReason || p.reversalReason) && <div className="max-w-40 truncate text-xs text-muted-foreground">{p.rejectedReason ?? p.reversalReason}</div>}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {p.receiptId && (
                        <Link href={`/org/${orgId}/receipts/${p.receiptId}`} className="rounded-md px-2 py-1 text-xs font-medium text-primary hover:underline">
                          Receipt
                        </Link>
                      )}
                      {p.status === "pending" && canVerify && (
                        <>
                          <VerifyDialog paymentId={p._id} accounts={accounts.filter((a) => a.isActive)} accountId={p.accountId} payer={p.payerName ?? ""} amountPaise={p.amountPaise} date={p.date} path={`/payments/${p._id}/verify`} />
                          <ActionButton path={`/orgs/${orgId}/payments/${p._id}/reject`} size="xs" variant="ghost" successMessage="Payment rejected" confirm={{ title: "Reject this payment?", description: "It will not count towards any dues.", reason: "required", destructive: true, confirmLabel: "Reject" }}>
                            Reject
                          </ActionButton>
                        </>
                      )}
                      {p.status === "verified" && canReverse && (
                        <ActionButton path={`/orgs/${orgId}/payments/${p._id}/reverse`} size="xs" variant="ghost" successMessage="Payment reversed" confirm={{ title: "Reverse this payment?", description: "A reversal entry is posted, the receipt is cancelled and the member's dues are restored. The original record is kept.", reason: "required", destructive: true, confirmLabel: "Reverse" }}>
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
      <Pagination page={data.page} pageSize={data.pageSize} total={data.total} baseHref={`/org/${orgId}/collections`} params={f} />
    </>
  );
}
