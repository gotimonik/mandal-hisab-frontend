import Link from "next/link";
import { ArrowUpFromLine } from "lucide-react";
import { api, qs } from "@/lib/server/api";
import { can, getAccounts, getActiveMembers, getOrg } from "@/lib/server/data";
import type { Paged, Withdrawal } from "@/lib/types";
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
import { WithdrawalDialog } from "@/features/withdrawals/withdrawal-form";

export const metadata = { title: "Withdrawals" };

export default async function WithdrawalsPage({ params, searchParams }: PageProps<"/org/[orgId]/withdrawals">) {
  const { orgId } = await params;
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const f = { memberId: str("memberId"), from: str("from"), to: str("to") };
  const page = Number(sp.page ?? 1) || 1;
  const [org, data, members, accounts] = await Promise.all([
    getOrg(orgId),
    api<Paged<Withdrawal> & { totalPaidPaise: number }>(`/orgs/${orgId}/withdrawals${qs({ ...f, page })}`),
    getActiveMembers(orgId),
    getAccounts(orgId),
  ]);
  const canRecord = can(org, "withdrawals.record") && org.status === "active";
  const cashAccounts = accounts.filter((a) => a.isActive).sort((a, b) => (a.type === "cash" ? -1 : 0) - (b.type === "cash" ? -1 : 0));
  return (
    <>
      <PageHeader
        title="Withdrawals"
        description={
          <>
            Cash paid to members from their savings. Total in view: <Money paise={data.totalPaidPaise} className="font-medium text-foreground" />
          </>
        }
        actions={
          canRecord ? (
            <WithdrawalDialog
              members={members.map((m) => ({ _id: m._id, name: m.name, membershipNumber: m.membershipNumber, balancePaise: m.balancePaise ?? 0 }))}
              accounts={cashAccounts.map((a) => ({ _id: a._id, name: a.name, balancePaise: a.balancePaise }))}
              allowException={org.myRole === "admin" && org.settings.withdrawals.allowExceptions}
              defaultOpen={sp.new === "1"}
            />
          ) : null
        }
      />
      <FilterBar resetHref={`/org/${orgId}/withdrawals`}>
        <FilterField label="Member">
          <NativeSelect name="memberId" defaultValue={f.memberId}>
            <option value="">All members</option>
            {members.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
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
        <EmptyState icon={<ArrowUpFromLine />} title="No withdrawals yet" description="When a member takes cash out of their savings, record it here." />
      ) : (
        <TableWrap>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Voucher</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead>Member</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Balance after</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((w) => (
                <TableRow key={w._id}>
                  <TableCell>
                    <Link href={`/org/${orgId}/withdrawals/${w._id}`} className="font-mono text-xs font-medium text-primary hover:underline">
                      {w.number}
                    </Link>
                    <div className="text-xs text-muted-foreground sm:hidden">{formatDate(w.date)}</div>
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap sm:table-cell">{formatDate(w.date)}</TableCell>
                  <TableCell>
                    <span className="font-medium">{w.member?.name ?? "—"}</span>
                    {w.note && <div className="text-xs text-muted-foreground">{w.note}</div>}
                    {w.exceptionReason && <div className="text-xs text-warning-ink">Exception: {w.exceptionReason}</div>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Money paise={w.amountPaise} />
                  </TableCell>
                  <TableCell className="hidden text-right sm:table-cell">
                    <Money paise={w.balanceAfterPaise} colored />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={w.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {w.status === "paid" && can(org, "transactions.adjust") && (
                      <ActionButton path={`/orgs/${orgId}/withdrawals/${w._id}/reverse`} size="xs" variant="ghost" successMessage="Withdrawal reversed" confirm={{ title: `Reverse ${w.number}?`, description: "Use this only if the withdrawal was recorded by mistake. The member's balance and the cash are restored.", reason: "required", destructive: true, confirmLabel: "Reverse" }}>
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
      <Pagination page={data.page} pageSize={data.pageSize} total={data.total} baseHref={`/org/${orgId}/withdrawals`} params={f} />
    </>
  );
}
