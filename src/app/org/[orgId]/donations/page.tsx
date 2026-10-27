import Link from "next/link";
import { Heart, Receipt } from "lucide-react";
import { api, qs } from "@/lib/server/api";
import { getAccounts, getOrg, can } from "@/lib/server/data";
import type { Paged } from "@/lib/types";
import { PageHeader } from "@/components/app/page-header";
import { FilterBar, FilterField } from "@/components/app/filter-bar";
import { Pagination } from "@/components/app/pagination";
import { StatusBadge } from "@/components/app/status-badge";
import { Money } from "@/components/app/money";
import { EmptyState } from "@/components/app/empty-state";
import { TableWrap } from "@/components/app/table-wrap";
import { ActionButton } from "@/components/app/action-button";
import { SummaryBand } from "@/components/app/summary-band";
import { ChipLinks } from "@/components/app/chip-links";
import { IconChip, MemberAvatar } from "@/components/app/bits";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { METHOD_LABEL, formatDate, label } from "@/lib/format";
import { cn } from "@/lib/utils";
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

const STATUSES = [
  ["", "All"],
  ["pending", "Pending"],
  ["verified", "Verified"],
  ["reversed", "Reversed"],
] as const;

export default async function DonationsPage({ params, searchParams }: PageProps<"/org/[orgId]/donations">) {
  const { orgId } = await params;
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const f = { status: str("status"), from: str("from"), to: str("to"), eventName: str("eventName") };
  const page = Number(sp.page ?? 1) || 1;
  const [org, data, accounts] = await Promise.all([getOrg(orgId), api<Paged<Donation> & { verifiedTotalPaise: number }>(`/orgs/${orgId}/donations${qs({ ...f, page })}`), getAccounts(orgId)]);
  const active = accounts.filter((a) => a.isActive).map((a) => ({ _id: a._id, name: a.name }));
  const href = (over: Record<string, string>) => `/org/${orgId}/donations${qs({ ...f, ...over })}`;
  const canVerify = can(org, "payments.verify");
  const canReverse = can(org, "payments.reverse");

  const actions = (d: Donation) => (
    <>
      {d.receiptId && (
        <Link href={`/org/${orgId}/receipts/${d.receiptId}`} className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300">
          <Receipt className="size-3.5" /> Receipt
        </Link>
      )}
      {d.status === "pending" && canVerify && <VerifyDialog paymentId={d._id} accounts={active} accountId={d.accountId} payer={d.donorName} amountPaise={d.amountPaise} date={d.date} path={`/donations/${d._id}/verify`} />}
      {(d.status === "verified" || d.status === "pending") && canReverse && (
        <ActionButton path={`/orgs/${orgId}/donations/${d._id}/reverse`} size="xs" variant="ghost" successMessage="Donation reversed" confirm={{ title: d.status === "pending" ? "Reject this donation?" : "Reverse this donation?", reason: "required", destructive: true, confirmLabel: d.status === "pending" ? "Reject" : "Reverse" }}>
          {d.status === "pending" ? "Reject" : "Reverse"}
        </ActionButton>
      )}
    </>
  );
  const methodLine = (d: Donation) => [label(METHOD_LABEL, d.method), d.reference].filter(Boolean).join(" · ");

  return (
    <>
      <PageHeader
        title="Donations"
        description="Money given to the Mandal by donors, for events or general use."
        actions={can(org, "donations.record") && org.status === "active" ? <DonationDialog accounts={active} methods={org.settings.paymentMethods} /> : null}
      />
      <SummaryBand
        tone="green"
        icon={<Heart />}
        label="Verified donations in view"
        value={<Money paise={data.verifiedTotalPaise} />}
        sub={`${data.total} record${data.total === 1 ? "" : "s"}${f.from || f.to ? ` · ${f.from ? formatDate(f.from) : "start"} – ${f.to ? formatDate(f.to) : "today"}` : ""}`}
      />
      <ChipLinks label="Status" current={f.status} items={STATUSES.map(([k, l]) => ({ key: k, label: l, href: href({ status: k, page: "" }) }))} />
      <FilterBar resetHref={`/org/${orgId}/donations`}>
        {f.status && <input type="hidden" name="status" value={f.status} />}
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
        <EmptyState icon={<Heart />} title="No donations recorded" description="Try another status or date range." />
      ) : (
        <>
          <ul className="flex flex-col gap-2 md:hidden" aria-label="Donations">
            {data.items.map((d) => (
              <li key={d._id} className={cn("rounded-2xl bg-card p-3.5 shadow-card ring-1 ring-foreground/[0.06]", d.status === "pending" && "ring-2 ring-amber-400/40", d.status === "reversed" && "opacity-70")}>
                <div className="flex items-start gap-3">
                  <IconChip tone="pink" size="sm">
                    <Heart />
                  </IconChip>
                  <div className="min-w-0 flex-1 text-sm">
                    <span className="font-semibold">{d.donorName}</span>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(d.date)}
                      {d.eventName ? ` · ${d.eventName}` : ""}
                    </p>
                    {d.purpose && <p className="truncate text-xs text-muted-foreground">{d.purpose}</p>}
                    <p className="truncate text-xs text-muted-foreground">
                      {methodLine(d)}
                      
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Money paise={d.amountPaise} className="font-bold" />
                    <StatusBadge status={d.status} />
                  </div>
                </div>
                {d.reversalReason && <p className="mt-2 rounded-lg bg-muted/60 px-2.5 py-1.5 text-xs text-muted-foreground">{d.reversalReason}</p>}
                <div className="mt-2 flex flex-wrap items-center justify-end gap-1 empty:hidden">{actions(d)}</div>
              </li>
            ))}
          </ul>
          <div className="hidden md:block">
            <TableWrap>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Donor</TableHead>
                    <TableHead>Event / purpose</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((d) => (
                    <TableRow key={d._id} className={cn(d.status === "reversed" && "text-muted-foreground")}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <MemberAvatar name={d.donorName} size="sm" />
                          <div className="min-w-0">
                            <span className="font-semibold">{d.donorName}</span>
                            <div className="text-xs text-muted-foreground">
                              {formatDate(d.date)}
                              
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-56 whitespace-normal">
                        <span className="inline-flex items-center gap-2">
                          <IconChip tone="pink" size="sm">
                            <Heart />
                          </IconChip>
                          <span>
                            {d.eventName ?? "General"}
                            {d.purpose && <span className="block text-xs text-muted-foreground">{d.purpose}</span>}
                          </span>
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {label(METHOD_LABEL, d.method)}
                        {d.reference && <div className="text-xs text-muted-foreground">{d.reference}</div>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Money paise={d.amountPaise} className="font-semibold" />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={d.status} />
                        {d.reversalReason && <div className="max-w-40 truncate text-xs text-muted-foreground">{d.reversalReason}</div>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">{actions(d)}</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrap>
          </div>
        </>
      )}
      <Pagination page={data.page} pageSize={data.pageSize} total={data.total} baseHref={`/org/${orgId}/donations`} params={f} />
    </>
  );
}
