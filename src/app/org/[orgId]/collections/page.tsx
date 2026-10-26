import Link from "next/link";
import { ArrowDownToLine, CalendarDays, HandCoins, Receipt, Sparkles, Ticket } from "lucide-react";
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
import { SummaryBand } from "@/components/app/summary-band";
import { ChipLinks } from "@/components/app/chip-links";
import { IconChip, MemberAvatar } from "@/components/app/bits";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/tones";
import { VerifyDialog } from "@/features/collections/verify-dialog";

export const metadata = { title: "Collections" };

const KIND: Record<string, string> = { hapta: "Hapta", membership_fee: "Membership fee", event: "Event", other_income: "Other income" };
const KIND_LOOK: Record<string, { tone: Tone; icon: React.ReactNode }> = {
  hapta: { tone: "emerald", icon: <CalendarDays /> },
  membership_fee: { tone: "sky", icon: <Ticket /> },
  event: { tone: "violet", icon: <Sparkles /> },
  other_income: { tone: "indigo", icon: <ArrowDownToLine /> },
};
const look = (k: string) => KIND_LOOK[k] ?? { tone: "slate" as Tone, icon: <HandCoins /> };
const STATUSES = [
  ["", "All"],
  ["pending", "To verify"],
  ["verified", "Verified"],
  ["rejected", "Rejected"],
  ["reversed", "Reversed"],
] as const;

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
  const href = (over: Record<string, string>) => `/org/${orgId}/collections${qs({ ...f, ...over })}`;
  const payer = (p: Payment) =>
    p.memberId ? (
      <Link href={`/org/${orgId}/members/${p.memberId}`} className="font-semibold hover:underline">
        {p.payerName}
      </Link>
    ) : (
      <span className="font-semibold">{p.payerName}</span>
    );
  const actions = (p: Payment) => (
    <>
      {p.receiptId && (
        <Link href={`/org/${orgId}/receipts/${p.receiptId}`} className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300">
          <Receipt className="size-3.5" /> Receipt
        </Link>
      )}
      {p.status === "pending" && canVerify && (
        <>
          <ActionButton path={`/orgs/${orgId}/payments/${p._id}/reject`} size="xs" variant="ghost" successMessage="Payment rejected" confirm={{ title: "Reject this payment?", description: "It will not count towards any dues.", reason: "required", destructive: true, confirmLabel: "Reject" }}>
            Reject
          </ActionButton>
          <VerifyDialog paymentId={p._id} accounts={accounts.filter((a) => a.isActive)} accountId={p.accountId} payer={p.payerName ?? ""} amountPaise={p.amountPaise} date={p.date} path={`/payments/${p._id}/verify`} />
        </>
      )}
      {p.status === "verified" && canReverse && (
        <ActionButton path={`/orgs/${orgId}/payments/${p._id}/reverse`} size="xs" variant="ghost" successMessage="Payment reversed" confirm={{ title: "Reverse this payment?", description: "A reversal entry is posted, the receipt is cancelled and the member's dues are restored. The original record is kept.", reason: "required", destructive: true, confirmLabel: "Reverse" }}>
          Reverse
        </ActionButton>
      )}
    </>
  );
  const methodLine = (p: Payment) => [label(METHOD_LABEL, p.method), p.reference, p.accountName && `→ ${p.accountName}`].filter(Boolean).join(" · ");

  return (
    <>
      <PageHeader
        title="Collections"
        description="All money received — hapta, fees, events and other income."
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
      <SummaryBand
        tone="green"
        icon={<HandCoins />}
        label={f.status === "pending" ? "Waiting for verification" : "Total of the listed collections"}
        value={<Money paise={data.totalAmountPaise} />}
        sub={`${data.total} record${data.total === 1 ? "" : "s"}${f.from || f.to ? ` · ${f.from ? formatDate(f.from) : "start"} – ${f.to ? formatDate(f.to) : "today"}` : ""}`}
      />
      <ChipLinks label="Status" current={f.status} items={STATUSES.map(([k, l]) => ({ key: k, label: l, href: href({ status: k, page: "" }) }))} />
      <FilterBar resetHref={`/org/${orgId}/collections`}>
        {f.status && <input type="hidden" name="status" value={f.status} />}
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
      {data.items.length === 0 ? (
        <EmptyState icon={<HandCoins />} title="No collections found" description="Try another status or date range." />
      ) : (
        <>
          <ul className="flex flex-col gap-2 md:hidden" aria-label="Collections">
            {data.items.map((p) => {
              const lk = look(p.kind);
              return (
                <li key={p._id} className={cn("rounded-2xl bg-card p-3.5 shadow-card ring-1 ring-foreground/[0.06]", p.status === "pending" && "ring-2 ring-amber-400/40", (p.status === "rejected" || p.status === "reversed") && "opacity-70")}>
                  <div className="flex items-start gap-3">
                    <IconChip tone={lk.tone} size="sm">
                      {lk.icon}
                    </IconChip>
                    <div className="min-w-0 flex-1 text-sm">
                      {payer(p)}
                      <p className="text-xs text-muted-foreground">
                        {formatDate(p.date)} · {KIND[p.kind] ?? p.kind}
                        {p.eventName ? ` · ${p.eventName}` : ""}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{methodLine(p)}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Money paise={p.amountPaise} className="font-bold" />
                      <StatusBadge status={p.status} />
                    </div>
                  </div>
                  {(p.rejectedReason || p.reversalReason) && <p className="mt-2 rounded-lg bg-muted/60 px-2.5 py-1.5 text-xs text-muted-foreground">{p.rejectedReason ?? p.reversalReason}</p>}
                  {p.source === "member_request" && <p className="mt-1 text-xs text-muted-foreground">Reported by the member</p>}
                  <div className="mt-2 flex flex-wrap items-center justify-end gap-1 empty:hidden">{actions(p)}</div>
                </li>
              );
            })}
          </ul>
          <div className="hidden md:block">
            <TableWrap>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((p) => {
                    const lk = look(p.kind);
                    return (
                      <TableRow key={p._id} className={cn((p.status === "rejected" || p.status === "reversed") && "text-muted-foreground")}>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <MemberAvatar name={p.payerName ?? "?"} size="sm" />
                            <div className="min-w-0">
                              {payer(p)}
                              <div className="text-xs text-muted-foreground">
                                {formatDate(p.date)}
                                {p.source === "member_request" ? " · reported by member" : ""}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-2">
                            <IconChip tone={lk.tone} size="sm">
                              {lk.icon}
                            </IconChip>
                            <span>
                              {KIND[p.kind] ?? p.kind}
                              {p.eventName && <span className="block text-xs text-muted-foreground">{p.eventName}</span>}
                            </span>
                          </span>
                        </TableCell>
                        <TableCell className="max-w-56 whitespace-normal text-sm">
                          {label(METHOD_LABEL, p.method)}
                          {(p.reference || p.accountName) && <div className="text-xs text-muted-foreground">{[p.reference, p.accountName && `→ ${p.accountName}`].filter(Boolean).join(" · ")}</div>}
                        </TableCell>
                        <TableCell className="text-right">
                          <Money paise={p.amountPaise} className="font-semibold" />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={p.status} />
                          {(p.rejectedReason || p.reversalReason) && <div className="max-w-40 truncate text-xs text-muted-foreground">{p.rejectedReason ?? p.reversalReason}</div>}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">{actions(p)}</div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableWrap>
          </div>
        </>
      )}
      <Pagination page={data.page} pageSize={data.pageSize} total={data.total} baseHref={`/org/${orgId}/collections`} params={f} />
    </>
  );
}
