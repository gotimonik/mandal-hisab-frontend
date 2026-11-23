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
import { formatDate } from "@/lib/format";
import { getT } from "@/i18n/server";
import { methodLabel } from "@/i18n/labels";
import type { Key } from "@/i18n/core";
import { RecordPaymentDialog } from "@/features/collections/record-payment";
import { SummaryBand } from "@/components/app/summary-band";
import { ChipLinks } from "@/components/app/chip-links";
import { IconChip, MemberAvatar } from "@/components/app/bits";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/tones";
import { VerifyDialog } from "@/features/collections/verify-dialog";

export const metadata = { title: "Collections" };

const KINDS = ["hapta", "membership_fee", "event", "other_income"] as const;
const KIND_LOOK: Record<string, { tone: Tone; icon: React.ReactNode }> = {
  hapta: { tone: "emerald", icon: <CalendarDays /> },
  membership_fee: { tone: "sky", icon: <Ticket /> },
  event: { tone: "violet", icon: <Sparkles /> },
  other_income: { tone: "indigo", icon: <ArrowDownToLine /> },
};
const look = (k: string) => KIND_LOOK[k] ?? { tone: "slate" as Tone, icon: <HandCoins /> };
const STATUSES = ["", "pending", "verified", "rejected", "reversed"] as const;

export default async function CollectionsPage({ params, searchParams }: PageProps<"/org/[orgId]/collections">) {
  const { orgId } = await params;
  const { t } = await getT();
  const kindLabel = (k: string) => ((KINDS as readonly string[]).includes(k) ? t(`ap.col.kind.${k}` as Key) : k);
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
          <Receipt className="size-3.5" /> {t("ap.receipt")}
        </Link>
      )}
      {p.status === "pending" && canVerify && (
        <>
          <ActionButton path={`/orgs/${orgId}/payments/${p._id}/reject`} size="xs" variant="ghost" successMessage={t("ap.col.rejected")} confirm={{ title: t("ap.col.rejectQ"), description: t("ap.col.rejectD"), reason: "required", destructive: true, confirmLabel: t("ap.reject") }}>
            {t("ap.reject")}
          </ActionButton>
          <VerifyDialog paymentId={p._id} accounts={accounts.filter((a) => a.isActive)} accountId={p.accountId} payer={p.payerName ?? ""} amountPaise={p.amountPaise} date={p.date} path={`/payments/${p._id}/verify`} />
        </>
      )}
      {p.status === "verified" && canReverse && (
        <ActionButton path={`/orgs/${orgId}/payments/${p._id}/reverse`} size="xs" variant="ghost" successMessage={t("ap.col.reversed")} confirm={{ title: t("ap.col.reverseQ"), description: t("ap.col.reverseD"), reason: "required", destructive: true, confirmLabel: t("ap.reverse") }}>
          {t("ap.reverse")}
        </ActionButton>
      )}
    </>
  );
  const methodLine = (p: Payment) => [methodLabel(t, p.method), p.reference, p.accountName && `→ ${p.accountName}`].filter(Boolean).join(" · ");

  return (
    <>
      <PageHeader
        title={t("ap.col.title")}
        description={t("ap.col.desc")}
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
        label={f.status === "pending" ? t("ap.col.waiting") : t("ap.col.listedTotal")}
        value={<Money paise={data.totalAmountPaise} />}
        sub={`${data.total === 1 ? t("ap.record1") : t("ap.records", { n: data.total })}${f.from || f.to ? ` · ${f.from ? formatDate(f.from) : t("ap.start")} – ${f.to ? formatDate(f.to) : t("ap.today")}` : ""}`}
      />
      <ChipLinks label={t("ap.status")} current={f.status} items={STATUSES.map((k) => ({ key: k, label: k ? t(`ap.col.st.${k}` as Key) : t("ap.all"), href: href({ status: k, page: "" }) }))} />
      <FilterBar resetHref={`/org/${orgId}/collections`}>
        {f.status && <input type="hidden" name="status" value={f.status} />}
        <FilterField label={t("ap.type")}>
          <NativeSelect name="kind" defaultValue={f.kind}>
            <option value="">{t("ap.all")}</option>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {kindLabel(k)}
              </option>
            ))}
          </NativeSelect>
        </FilterField>
        <FilterField label={t("ap.method")}>
          <NativeSelect name="method" defaultValue={f.method}>
            <option value="">{t("ap.all")}</option>
            {org.settings.paymentMethods.map((m) => (
              <option key={m} value={m}>
                {methodLabel(t, m)}
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
        <EmptyState icon={<HandCoins />} title={t("ap.col.none")} description={t("ap.col.noneD")} />
      ) : (
        <>
          <ul className="flex flex-col gap-2 md:hidden" aria-label={t("ap.col.title")}>
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
                        {formatDate(p.date)} · {kindLabel(p.kind)}
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
                  {p.source === "member_request" && <p className="mt-1 text-xs text-muted-foreground">{t("ap.col.reportedByMember")}</p>}
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
                    <TableHead>{t("ap.payer")}</TableHead>
                    <TableHead>{t("ap.type")}</TableHead>
                    <TableHead>{t("ap.method")}</TableHead>
                    <TableHead className="text-right">{t("ap.amount")}</TableHead>
                    <TableHead>{t("ap.status")}</TableHead>
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
                                {p.source === "member_request" ? t("ap.col.reportedShort") : ""}
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
                              {kindLabel(p.kind)}
                              {p.eventName && <span className="block text-xs text-muted-foreground">{p.eventName}</span>}
                            </span>
                          </span>
                        </TableCell>
                        <TableCell className="max-w-56 whitespace-normal text-sm">
                          {methodLabel(t, p.method)}
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
