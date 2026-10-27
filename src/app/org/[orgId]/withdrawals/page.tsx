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
import { SummaryBand } from "@/components/app/summary-band";
import { MemberAvatar } from "@/components/app/bits";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
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
  const canReverse = can(org, "transactions.adjust");
  const cashAccounts = accounts.filter((a) => a.isActive).sort((a, b) => (a.type === "cash" ? -1 : 0) - (b.type === "cash" ? -1 : 0));
  const memberName = f.memberId ? members.find((m) => m._id === f.memberId)?.name : undefined;

  const voucher = (w: Withdrawal) => (
    <Link href={`/org/${orgId}/withdrawals/${w._id}`} className="font-mono text-xs font-semibold text-primary hover:underline">
      {w.number}
    </Link>
  );
  const reverse = (w: Withdrawal) =>
    w.status === "paid" && canReverse ? (
      <ActionButton path={`/orgs/${orgId}/withdrawals/${w._id}/reverse`} size="xs" variant="ghost" successMessage="Withdrawal reversed" confirm={{ title: `Reverse ${w.number}?`, description: "Use this only if the withdrawal was recorded by mistake. The member's balance and the cash are restored.", reason: "required", destructive: true, confirmLabel: "Reverse" }}>
        Reverse
      </ActionButton>
    ) : null;

  return (
    <>
      <PageHeader
        title="Withdrawals"
        description="Cash paid to members from their savings."
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
      <SummaryBand
        tone="warm"
        icon={<ArrowUpFromLine />}
        label={memberName ? `Paid out to ${memberName}` : "Paid out to members in view"}
        value={<Money paise={data.totalPaidPaise} />}
        sub={`${data.total} withdrawal${data.total === 1 ? "" : "s"}${f.from || f.to ? ` · ${f.from ? formatDate(f.from) : "start"} – ${f.to ? formatDate(f.to) : "today"}` : ""}`}
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
        <>
          <ul className="flex flex-col gap-2 md:hidden" aria-label="Withdrawals">
            {data.items.map((w) => (
              <li key={w._id} className={cn("rounded-2xl bg-card p-3.5 shadow-card ring-1 ring-foreground/[0.06]", w.status === "reversed" && "opacity-70")}>
                <div className="flex items-start gap-3">
                  <MemberAvatar name={w.member?.name ?? "?"} size="sm" />
                  <div className="min-w-0 flex-1 text-sm">
                    <span className="font-semibold">{w.member?.name ?? "—"}</span>
                    <p className="text-xs text-muted-foreground">
                      {voucher(w)} · {formatDate(w.date)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Balance after <Money paise={w.balanceAfterPaise} colored />
                    </p>
                    {w.note && <p className="truncate text-xs text-muted-foreground">{w.note}</p>}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Money paise={w.amountPaise} className="font-bold text-rose-600 dark:text-rose-300" />
                    <StatusBadge status={w.status} />
                  </div>
                </div>
                {w.exceptionReason && <p className="mt-2 rounded-lg bg-warning/10 px-2.5 py-1.5 text-xs text-warning-ink">Exception: {w.exceptionReason}</p>}
                <div className="mt-2 flex flex-wrap items-center justify-end gap-1 empty:hidden">{reverse(w)}</div>
              </li>
            ))}
          </ul>
          <div className="hidden md:block">
            <TableWrap>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Voucher</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Balance after</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((w) => (
                    <TableRow key={w._id} className={cn(w.status === "reversed" && "text-muted-foreground")}>
                      <TableCell className="max-w-72 whitespace-normal">
                        <div className="flex items-center gap-2.5">
                          <MemberAvatar name={w.member?.name ?? "?"} size="sm" />
                          <div className="min-w-0">
                            <span className="font-semibold">{w.member?.name ?? "—"}</span>
                            {w.note && <div className="text-xs text-muted-foreground">{w.note}</div>}
                            {w.exceptionReason && <div className="text-xs text-warning-ink">Exception: {w.exceptionReason}</div>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {voucher(w)}
                        <div className="text-xs text-muted-foreground">{formatDate(w.date)}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Money paise={w.amountPaise} className="font-semibold" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Money paise={w.balanceAfterPaise} colored />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={w.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">{reverse(w)}</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrap>
          </div>
        </>
      )}
      <Pagination page={data.page} pageSize={data.pageSize} total={data.total} baseHref={`/org/${orgId}/withdrawals`} params={f} />
    </>
  );
}
