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
import { formatDate } from "@/lib/format";
import { EnrollDialog, OverrideDialog, RevisionDialog } from "@/features/schemes/scheme-dialogs";
import { SummaryBand } from "@/components/app/summary-band";
import { IconChip, MemberAvatar } from "@/components/app/bits";
import { AlarmClock, CalendarRange, Coins, HandCoins, Repeat } from "lucide-react";
import { MemberProgress } from "@/features/schemes/member-progress";
import { RecordPaymentDialog } from "@/features/collections/record-payment";
import type { Tone } from "@/lib/tones";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { getT } from "@/i18n/server";
import { frequencyLabel } from "@/i18n/labels";
export default async function SchemePage({ params }: PageProps<"/org/[orgId]/schemes/[schemeId]">) {
  const { orgId, schemeId } = await params;
  const { t } = await getT();
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
        trigger={{ label: <><HandCoins /> {t("schd.collect")}</>, size: "xs", variant: owed > 0 ? "default" : "outline", ariaLabel: t("schd.collectFrom", { name: e.member.name }) }}
      />
    );
  };
  const removeBtn = (e: any) =>
    e.status === "active" && manage ? (
      <ActionButton path={`/orgs/${orgId}/schemes/${schemeId}/exit`} body={{ memberId: e.member._id }} variant="ghost" size="xs" successMessage={t("schd.removed")} confirm={{ title: t("schd.removeQ", { name: e.member.name }), description: t("schd.removeD"), reason: "required", destructive: true, confirmLabel: t("schd.remove") }}>
        {t("schd.remove")}
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
                <ActionButton path={path} body={{ action: "activate" }} variant="default" successMessage={t("schd.activated")}>
                  {t("schd.activate")}
                </ActionButton>
              )}
              {s.status === "active" && (
                <ActionButton path={path} body={{ action: "pause" }} successMessage={t("schd.paused")} confirm={{ title: t("schd.pauseQ"), description: t("schd.pauseD"), reason: "optional", confirmLabel: t("schd.pause") }}>
                  {t("schd.pause")}
                </ActionButton>
              )}
              {s.status === "paused" && (
                <ActionButton path={path} body={{ action: "resume" }} variant="default" successMessage={t("schd.resumed")} confirm={{ title: t("schd.resumeQ"), description: t("schd.resumeD") }}>
                  {t("schd.resume")}
                </ActionButton>
              )}
              {s.status !== "closed" && (
                <ActionButton path={path} body={{ action: "close" }} variant="ghost" successMessage={t("schd.closed")} confirm={{ title: t("schd.closeQ"), description: t("schd.closeD"), reason: "required", destructive: true, confirmLabel: t("schd.closeBtn") }}>
                  {t("schd.close")}
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
        label={t("schd.collectedSoFar")}
        value={<Money paise={totals.paid + totals.ahead} />}
        sub={`${data.enrollments.length === 1 ? t("schd.enrolled1") : t("schd.enrolledN", { n: data.enrollments.length })}${totals.ahead > 0 ? t("schd.inclAdvance") : ""}`}
        stats={[
          { label: t("schd.dueSoFar"), value: <Money paise={totals.due} short /> },
          { label: t("schd.toCollect"), value: <Money paise={Math.max(0, totals.due - totals.paid)} short /> },
          { label: t("schd.ahead"), value: <Money paise={totals.ahead} short /> },
        ]}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Info icon={<Coins />} tone="emerald" k={t("schd.amount")} v={money.fmt(s.amountPaise)} sub={s.amountMode === "member_specific" ? t("schd.varies") : t("schd.perInst")} />
        <Info icon={<Repeat />} tone="indigo" k={t("schd.frequency")} v={frequencyLabel(t, s.frequency)} sub={s.customInterval ? t("schd.every", { count: s.customInterval.count, unit: s.customInterval.unit }) : s.dueDay ? t("schd.dueOnDay", { day: s.dueDay }) : undefined} />
        <Info icon={<CalendarRange />} tone="sky" k={t("schd.period")} v={`${formatDate(s.startDate)} →`} sub={s.endDate ? formatDate(s.endDate) : s.numberOfInstallments ? t("schd.nInst", { n: s.numberOfInstallments }) : s.targetAmountPaise ? t("schd.target", { amount: money.fmt(s.targetAmountPaise) }) : t("schd.openEnded")} />
        <Info icon={<AlarmClock />} tone="amber" k={t("schd.grace")} v={t("schd.days", { n: s.graceDays })} sub={s.lateFee.enabled ? t("schd.feeAfter", { fee: s.lateFee.type === "fixed" ? money.fmt(s.lateFee.value) : `${s.lateFee.value / 100}%`, n: s.lateFee.graceDays }) : t("schd.noFee")} />
      </div>

      <Tabs defaultValue="members" className="mt-6">
        <TabsList>
          <TabsTrigger value="members">{t("schd.tabMembers", { n: data.enrollments.length })}</TabsTrigger>
          <TabsTrigger value="schedule">{t("schd.tabSchedule")}</TabsTrigger>
          <TabsTrigger value="history">{t("schd.tabChanges")}</TabsTrigger>
        </TabsList>
        <TabsContent value="members">
          {data.enrollments.length === 0 ? (
            <EmptyState title={t("schd.noMembers")} description={t("schd.noMembersD")} />
          ) : (
            <>
            <ul className="flex flex-col gap-2 md:hidden" aria-label={t("schd.enrolledAria")}>
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
                        <Money paise={e.amountPaise ?? s.amountPaise} /> · {t("schd.paid")} <Money paise={e.paidPaise} /> {t("schd.of")} <Money paise={e.duePaise} />
                        {e.paidAheadPaise > 0 && (
                          <>
                            {" "}
                            · <span className="font-semibold text-emerald-700 dark:text-emerald-300">+<Money paise={e.paidAheadPaise} /> {t("schd.aheadShort")}</span>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {bal > 0 ? <Money paise={bal} className="text-sm font-bold text-destructive" /> : <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">{t("schd.paidUp")}</span>}
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
                    <TableHead>{t("schd.member")}</TableHead>
                    <TableHead className="text-right">{t("schd.amount")}</TableHead>
                    <TableHead className="text-right">{t("schd.dueSoFar")}</TableHead>
                    <TableHead className="text-right">{t("schd.paidSoFar")}</TableHead>
                    <TableHead className="text-right">{t("schd.ahead")}</TableHead>
                    <TableHead className="text-right">{t("schd.balance")}</TableHead>
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
                              {e.member.membershipNumber} · {t("schd.fromDate", { date: formatDate(e.startDate) })}
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
          <p className="mb-2 text-sm text-muted-foreground">{t("schd.scheduleNote")}</p>
          <TableWrap>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>{t("schd.period")}</TableHead>
                  <TableHead>{t("schd.dueDate")}</TableHead>
                  <TableHead className="text-right">{t("schd.amount")}</TableHead>
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
                <CardTitle>{t("schd.revisions")}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                {s.amountRevisions.length === 0 ? (
                  <p className="text-muted-foreground">{t("schd.none")}</p>
                ) : (
                  <ul className="divide-y">
                    {s.amountRevisions.map((r, i) => (
                      <li key={i} className="py-2">
                        {t("schd.fromRev", { date: formatDate(r.effectiveFrom) })} <Money paise={r.amountPaise} />
                        {r.reason && <span className="text-muted-foreground"> — {r.reason}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
            <Card size="sm">
              <CardHeader>
                <CardTitle>{t("schd.periodChanges")}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                {s.overrides.length === 0 ? (
                  <p className="text-muted-foreground">{t("schd.none")}</p>
                ) : (
                  <ul className="divide-y">
                    {s.overrides.map((o) => (
                      <li key={o.sequence} className="py-2">
                        #{o.sequence}: {o.skip ? t("schd.skipped") : [o.dueDate && t("schd.dueX", { date: formatDate(o.dueDate) }), o.amountPaise && money.fmt(o.amountPaise)].filter(Boolean).join(", ")}
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
