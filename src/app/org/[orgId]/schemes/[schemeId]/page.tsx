import Link from "next/link";
import { api } from "@/lib/server/api";
import { getOrg, getActiveMembers, getAccounts, can, getMoney } from "@/lib/server/data";
import type { Scheme } from "@/lib/types";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Money } from "@/components/app/money";
import { ActionButton } from "@/components/app/action-button";
import { EmptyState } from "@/components/app/empty-state";
import { TableWrap } from "@/components/app/table-wrap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FREQUENCY_LABEL, formatDate, label } from "@/lib/format";
import { EnrollDialog, OverrideDialog, RevisionDialog } from "@/features/schemes/scheme-dialogs";
import { SummaryBand } from "@/components/app/summary-band";
import { IconChip, MemberAvatar } from "@/components/app/bits";
import { AlarmClock, CalendarRange, Coins, HandCoins, Repeat } from "lucide-react";
import { MemberProgress } from "@/features/schemes/member-progress";
import { RecordPaymentDialog } from "@/features/collections/record-payment";
import type { Tone } from "@/lib/tones";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function SchemePage({ params }: PageProps<"/org/[orgId]/schemes/[schemeId]">) {
  const { orgId, schemeId } = await params;
  const [org, data] = await Promise.all([getOrg(orgId), api<{ scheme: Scheme; enrollments: any[]; plannedSchedule: any[] }>(`/orgs/${orgId}/schemes/${schemeId}`)]);
  // getOrg is already in flight above (and cached), so this resolves without a second wait
  const money = await getMoney(orgId);
  const s = data.scheme;
  const manage = can(org, "schemes.manage");
  const enrolledIds = new Set(data.enrollments.map((e) => e.member._id));
  const candidates = manage ? (await getActiveMembers(orgId)).filter((m) => !enrolledIds.has(m._id)).map((m) => ({ _id: m._id, name: m.name, membershipNumber: m.membershipNumber })) : [];
  const path = `/orgs/${orgId}/schemes/${schemeId}/status`;
  // due/paid: installments due up to today; ahead: paid towards future months
  const totals = data.enrollments.reduce((t, e) => ({ due: t.due + (e.duePaise ?? 0), paid: t.paid + (e.paidPaise ?? 0), ahead: t.ahead + (e.paidAheadPaise ?? 0) }), { due: 0, paid: 0, ahead: 0 });
  // "Collect" on each member: record a payment for this scheme, amount pre-filled.
  const canCollect = can(org, "payments.record") && org.status === "active" && s.status === "active";
  const accounts = canCollect ? (await getAccounts(orgId)).filter((a) => a.isActive).map((a) => ({ _id: a._id, name: a.name })) : [];
  const enrolledMembers = data.enrollments.map((e) => ({ _id: e.member._id, name: e.member.name, membershipNumber: e.member.membershipNumber ?? "" }));
  const collectBtn = (e: any) => {
    if (!canCollect || e.status !== "active") return null;
    const owed = Math.max(0, e.duePaise - e.paidPaise);
    // what they owe now; if they're up to date, the next month's installment
    const amount = owed > 0 ? owed : (e.nextDue?.outstandingPaise ?? 0);
    return (
      <RecordPaymentDialog
        members={enrolledMembers}
        accounts={accounts}
        schemes={[{ _id: s._id, name: s.name }]}
        methods={org.settings.paymentMethods}
        defaultMemberId={e.member._id}
        defaultSchemeId={s._id}
        defaultAmountPaise={amount || undefined}
        trigger={{ label: <><HandCoins /> Collect</>, size: "xs", variant: owed > 0 ? "default" : "outline", ariaLabel: `Collect from ${e.member.name}` }}
      />
    );
  };
  const removeBtn = (e: any) =>
    e.status === "active" && manage ? (
      <ActionButton path={`/orgs/${orgId}/schemes/${schemeId}/exit`} body={{ memberId: e.member._id }} variant="ghost" size="xs" successMessage="Member removed from scheme" confirm={{ title: `Remove ${e.member.name}?`, description: "Their future unpaid installments are cancelled; history stays.", reason: "required", destructive: true, confirmLabel: "Remove" }}>
        Remove
      </ActionButton>
    ) : (
      <StatusBadge status={e.status} />
    );
  return (
    <>
      <PageHeader
        title={s.name}
        description={
          <>
            <StatusBadge status={s.status} /> <span className="ml-1">{s.description}</span>
          </>
        }
        actions={
          manage ? (
            <>
              {s.status === "draft" && (
                <ActionButton path={path} body={{ action: "activate" }} variant="default" successMessage="Scheme activated">
                  Activate
                </ActionButton>
              )}
              {s.status === "active" && (
                <ActionButton path={path} body={{ action: "pause" }} successMessage="Scheme paused" confirm={{ title: "Pause this scheme?", description: "Future unpaid installments are put on hold until you resume.", reason: "optional", confirmLabel: "Pause" }}>
                  Pause
                </ActionButton>
              )}
              {s.status === "paused" && (
                <ActionButton path={path} body={{ action: "resume" }} variant="default" successMessage="Scheme resumed" confirm={{ title: "Resume this scheme?", description: "Held future installments become due again. Installments that fell due while paused are waived." }}>
                  Resume
                </ActionButton>
              )}
              {s.status !== "closed" && (
                <ActionButton path={path} body={{ action: "close" }} variant="ghost" successMessage="Scheme closed" confirm={{ title: "Close this scheme?", description: "Future unpaid installments are cancelled. Paid history is kept.", reason: "required", destructive: true, confirmLabel: "Close scheme" }}>
                  Close
                </ActionButton>
              )}
              {s.status !== "closed" && <RevisionDialog schemeId={schemeId} />}
              {s.status !== "closed" && <EnrollDialog schemeId={schemeId} members={candidates} memberSpecific={s.amountMode === "member_specific"} startDate={s.startDate} />}
            </>
          ) : null
        }
      />
      <SummaryBand
        icon={<Coins />}
        label="Collected so far"
        value={<Money paise={totals.paid + totals.ahead} />}
        sub={`${data.enrollments.length} member${data.enrollments.length === 1 ? "" : "s"} enrolled${totals.ahead > 0 ? " · includes advance payments" : ""}`}
        stats={[
          { label: "Due so far", value: <Money paise={totals.due} short /> },
          { label: "Still to collect", value: <Money paise={Math.max(0, totals.due - totals.paid)} short /> },
          { label: "Paid ahead", value: <Money paise={totals.ahead} short /> },
        ]}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Info icon={<Coins />} tone="emerald" k="Amount" v={money.fmt(s.amountPaise)} sub={s.amountMode === "member_specific" ? "default; varies by member" : "per installment"} />
        <Info icon={<Repeat />} tone="indigo" k="Frequency" v={label(FREQUENCY_LABEL, s.frequency)} sub={s.customInterval ? `every ${s.customInterval.count} ${s.customInterval.unit}(s)` : s.dueDay ? `due on day ${s.dueDay}` : undefined} />
        <Info icon={<CalendarRange />} tone="sky" k="Period" v={`${formatDate(s.startDate)} →`} sub={s.endDate ? formatDate(s.endDate) : s.numberOfInstallments ? `${s.numberOfInstallments} installments` : s.targetAmountPaise ? `target ${money.fmt(s.targetAmountPaise)}` : "open-ended"} />
        <Info icon={<AlarmClock />} tone="amber" k="Grace / late fee" v={`${s.graceDays} days`} sub={s.lateFee.enabled ? (s.lateFee.type === "fixed" ? `${money.fmt(s.lateFee.value)} after ${s.lateFee.graceDays} days` : `${s.lateFee.value / 100}% after ${s.lateFee.graceDays} days`) : "no late fee"} />
      </div>

      <Tabs defaultValue="members" className="mt-6">
        <TabsList>
          <TabsTrigger value="members">Members ({data.enrollments.length})</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="history">Changes</TabsTrigger>
        </TabsList>
        <TabsContent value="members">
          {data.enrollments.length === 0 ? (
            <EmptyState title="No members enrolled" description="Enroll members to generate their installments." />
          ) : (
            <>
            <ul className="flex flex-col gap-2 md:hidden" aria-label="Enrolled members">
              {data.enrollments.map((e) => {
                const bal = e.duePaise - e.paidPaise;
                return (
                  <li key={e._id} className="rounded-2xl bg-card p-3.5 shadow-card ring-1 ring-foreground/[0.06]">
                    <div className="flex items-start gap-3">
                    <MemberAvatar name={e.member.name} />
                    <div className="min-w-0 flex-1">
                      <Link href={`/org/${orgId}/members/${e.member._id}`} className="block truncate font-semibold hover:underline">
                        {e.member.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        <Money paise={e.amountPaise ?? s.amountPaise} /> · paid <Money paise={e.paidPaise} /> of <Money paise={e.duePaise} />
                        {e.paidAheadPaise > 0 && (
                          <>
                            {" "}
                            · <span className="font-semibold text-emerald-700 dark:text-emerald-300">+<Money paise={e.paidAheadPaise} /> ahead</span>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {bal > 0 ? <Money paise={bal} className="text-sm font-bold text-destructive" /> : <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">Paid up</span>}
                      <div className="flex items-center gap-1">
                        {collectBtn(e)}
                        {removeBtn(e)}
                      </div>
                    </div>
                    </div>
                    {/* full card width, so the month chips have room */}
                    <MemberProgress e={e} />
                  </li>
                );
              })}
            </ul>
            <div className="hidden md:block">
            <TableWrap>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Due so far</TableHead>
                    <TableHead className="text-right">Paid so far</TableHead>
                    <TableHead className="text-right">Paid ahead</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.enrollments.map((e) => (
                    <TableRow key={e._id}>
                      <TableCell>
                        <div className="flex items-start gap-2.5">
                          <MemberAvatar name={e.member.name} size="sm" />
                          <div className="min-w-0">
                            <Link href={`/org/${orgId}/members/${e.member._id}`} className="font-semibold hover:underline">
                              {e.member.name}
                            </Link>
                            <div className="text-xs text-muted-foreground">
                              {e.member.membershipNumber} · from {formatDate(e.startDate)}
                            </div>
                            <MemberProgress e={e} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Money paise={e.amountPaise ?? s.amountPaise} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Money paise={e.duePaise} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Money paise={e.paidPaise} />
                      </TableCell>
                      <TableCell className="text-right">
                        {e.paidAheadPaise > 0 ? <Money paise={e.paidAheadPaise} className="font-semibold text-emerald-700 dark:text-emerald-300" /> : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Money paise={e.duePaise - e.paidPaise} className={e.duePaise - e.paidPaise > 0 ? "text-destructive" : ""} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {collectBtn(e)}
                          {removeBtn(e)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrap>
            </div>
            </>
          )}
        </TabsContent>
        <TabsContent value="schedule">
          <p className="mb-2 text-sm text-muted-foreground">Planned periods for this scheme (before member-specific changes). Change a single period without affecting the rest.</p>
          <TableWrap>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Due date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.plannedSchedule.map((p) => (
                  <TableRow key={p.sequence} className={p.skipped ? "text-muted-foreground line-through" : ""}>
                    <TableCell>{p.sequence}</TableCell>
                    <TableCell>{p.periodLabel}</TableCell>
                    <TableCell>{formatDate(p.dueDate)}</TableCell>
                    <TableCell className="text-right">
                      <Money paise={p.amountPaise} />
                      {p.source !== "scheme" && <span className="ml-1 text-xs text-muted-foreground">({p.source})</span>}
                    </TableCell>
                    <TableCell className="text-right">{manage && s.status !== "closed" && !p.skipped && <OverrideDialog schemeId={schemeId} sequence={p.sequence} dueDate={p.dueDate} label={p.periodLabel} />}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableWrap>
        </TabsContent>
        <TabsContent value="history">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card size="sm">
              <CardHeader>
                <CardTitle>Amount revisions</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                {s.amountRevisions.length === 0 ? (
                  <p className="text-muted-foreground">None.</p>
                ) : (
                  <ul className="divide-y">
                    {s.amountRevisions.map((r, i) => (
                      <li key={i} className="py-2">
                        From {formatDate(r.effectiveFrom)}: <Money paise={r.amountPaise} />
                        {r.reason && <span className="text-muted-foreground"> — {r.reason}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
            <Card size="sm">
              <CardHeader>
                <CardTitle>Period changes</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                {s.overrides.length === 0 ? (
                  <p className="text-muted-foreground">None.</p>
                ) : (
                  <ul className="divide-y">
                    {s.overrides.map((o) => (
                      <li key={o.sequence} className="py-2">
                        #{o.sequence}: {o.skip ? "skipped" : [o.dueDate && `due ${formatDate(o.dueDate)}`, o.amountPaise && money.fmt(o.amountPaise)].filter(Boolean).join(", ")}
                        <span className="text-muted-foreground"> — {o.reason}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

function Info({ k, v, sub, icon, tone }: { k: string; v: string; sub?: string; icon: React.ReactNode; tone: Tone }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-card p-3.5 shadow-card ring-1 ring-foreground/[0.06]">
      <IconChip tone={tone} size="sm">
        {icon}
      </IconChip>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{k}</p>
        <p className="truncate font-semibold">{v}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}
