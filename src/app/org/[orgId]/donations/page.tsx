import Link from "next/link";
import { Heart } from "lucide-react";
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
import { METHOD_LABEL, formatDate, label } from "@/lib/format";
import { DonationDialog } from "@/features/donations/donation-form";
import { VerifyDialog } from "@/features/collections/verify-dialog";

export const metadata = { title: "Donations" };

interface Donation {
  _id: string;
  donorName: string;
  donorPan?: string;
  amountPaise: number;
  date: string;
  method: string;
  reference?: string;
  accountId: string;
  purpose?: string;
  eventName?: string;
  status: string;
  receiptId?: string;
  reversalReason?: string;
}

export default async function DonationsPage({ params, searchParams }: PageProps<"/org/[orgId]/donations">) {
  const { orgId } = await params;
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const f = { status: str("status"), from: str("from"), to: str("to"), eventName: str("eventName") };
  const page = Number(sp.page ?? 1) || 1;
  const [org, data, accounts] = await Promise.all([getOrg(orgId), api<Paged<Donation> & { verifiedTotalPaise: number }>(`/orgs/${orgId}/donations${qs({ ...f, page })}`), getAccounts(orgId)]);
  const active = accounts.filter((a) => a.isActive).map((a) => ({ _id: a._id, name: a.name }));
  return (
    <>
      <PageHeader
        title="Donations"
        description={
          <>
            Verified donations in view: <Money paise={data.verifiedTotalPaise} className="font-medium text-foreground" />
          </>
        }
        actions={can(org, "donations.record") && org.status === "active" ? <DonationDialog accounts={active} methods={org.settings.paymentMethods} /> : null}
      />
      <FilterBar resetHref={`/org/${orgId}/donations`}>
        <FilterField label="Status">
          <NativeSelect name="status" defaultValue={f.status}>
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="reversed">Reversed</option>
          </NativeSelect>
        </FilterField>
        <FilterField label="Event">
          <Input name="eventName" defaultValue={f.eventName} />
        </FilterField>
        <FilterField label="From">
          <Input type="date" name="from" defaultValue={f.from} />
        </FilterField>
        <FilterField label="To">
          <Input type="date" name="to" defaultValue={f.to} />
        </FilterField>
      </FilterBar>
      {data.items.length === 0 ? (
        <EmptyState icon={<Heart />} title="No donations recorded" />
      ) : (
        <TableWrap>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Donor</TableHead>
                <TableHead>Event / purpose</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((d) => (
                <TableRow key={d._id}>
                  <TableCell className="whitespace-nowrap">{formatDate(d.date)}</TableCell>
                  <TableCell>
                    <span className="font-medium">{d.donorName}</span>
                    {d.donorPan && <div className="text-xs text-muted-foreground">PAN {d.donorPan}</div>}
                  </TableCell>
                  <TableCell>
                    {d.eventName ?? "—"}
                    {d.purpose && <div className="text-xs text-muted-foreground">{d.purpose}</div>}
                  </TableCell>
                  <TableCell>
                    {label(METHOD_LABEL, d.method)}
                    {d.reference && <div className="text-xs text-muted-foreground">{d.reference}</div>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Money paise={d.amountPaise} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={d.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {d.receiptId && (
                        <Link href={`/org/${orgId}/receipts/${d.receiptId}`} className="rounded-md px-2 py-1 text-xs font-medium text-primary hover:underline">
                          Receipt
                        </Link>
                      )}
                      {d.status === "pending" && can(org, "payments.verify") && <VerifyDialog paymentId={d._id} accounts={active} accountId={d.accountId} payer={d.donorName} amountPaise={d.amountPaise} date={d.date} path={`/donations/${d._id}/verify`} />}
                      {(d.status === "verified" || d.status === "pending") && can(org, "payments.reverse") && (
                        <ActionButton path={`/orgs/${orgId}/donations/${d._id}/reverse`} size="xs" variant="ghost" successMessage="Donation reversed" confirm={{ title: d.status === "pending" ? "Reject this donation?" : "Reverse this donation?", reason: "required", destructive: true, confirmLabel: d.status === "pending" ? "Reject" : "Reverse" }}>
                          {d.status === "pending" ? "Reject" : "Reverse"}
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
      <Pagination page={data.page} pageSize={data.pageSize} total={data.total} baseHref={`/org/${orgId}/donations`} params={f} />
    </>
  );
}
