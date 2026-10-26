import Link from "next/link";
import { api } from "@/lib/server/api";
import { getOrg, getActiveMembers, can } from "@/lib/server/data";
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
import { FREQUENCY_LABEL, formatDate, formatINR, label } from "@/lib/format";
import { EnrollDialog, OverrideDialog, RevisionDialog } from "@/features/schemes/scheme-dialogs";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function SchemePage({ params }: PageProps<"/org/[orgId]/schemes/[schemeId]">) {
  const { orgId, schemeId } = await params;
  const [org, data] = await Promise.all([getOrg(orgId), api<{ scheme: Scheme; enrollments: any[]; plannedSchedule: any[] }>(`/orgs/${orgId}/schemes/${schemeId}`)]);
  const s = data.scheme;
  const manage = can(org, "schemes.manage");
  const enrolledIds = new Set(data.enrollments.map((e) => e.member._id));
  const candidates = manage ? (await getActiveMembers(orgId)).filter((m) => !enrolledIds.has(m._id)).map((m) => ({ _id: m._id, name: m.name, membershipNumber: m.membershipNumber })) : [];
  const path = `/orgs/${orgId}/schemes/${schemeId}/status`;
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
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Info k="Amount" v={formatINR(s.amountPaise)} sub={s.amountMode === "member_specific" ? "default; varies by member" : "per installment"} />
        <Info k="Frequency" v={label(FREQUENCY_LABEL, s.frequency)} sub={s.customInterval ? `every ${s.customInterval.count} ${s.customInterval.unit}(s)` : s.dueDay ? `due on day ${s.dueDay}` : undefined} />
        <Info k="Period" v={`${formatDate(s.startDate)} →`} sub={s.endDate ? formatDate(s.endDate) : s.numberOfInstallments ? `${s.numberOfInstallments} installments` : s.targetAmountPaise ? `target ${formatINR(s.targetAmountPaise)}` : "open-ended"} />
        <Info k="Grace / late fee" v={`${s.graceDays} days`} sub={s.lateFee.enabled ? (s.lateFee.type === "fixed" ? `${formatINR(s.lateFee.value)} after ${s.lateFee.graceDays} days` : `${s.lateFee.value / 100}% after ${s.lateFee.graceDays} days`) : "no late fee"} />
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
            <TableWrap>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Due so far</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.enrollments.map((e) => (
                    <TableRow key={e._id}>
                      <TableCell>
                        <Link href={`/org/${orgId}/members/${e.member._id}`} className="font-medium hover:underline">
                          {e.member.name}
                        </Link>
                        <div className="text-xs text-muted-foreground">
                          {e.member.membershipNumber} · from {formatDate(e.startDate)}
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
                        <Money paise={e.duePaise - e.paidPaise} className={e.duePaise - e.paidPaise > 0 ? "text-destructive" : ""} />
                      </TableCell>
                      <TableCell className="text-right">
                        {e.status === "active" && manage ? (
                          <ActionButton path={`/orgs/${orgId}/schemes/${schemeId}/exit`} body={{ memberId: e.member._id }} variant="ghost" size="xs" successMessage="Member removed from scheme" confirm={{ title: `Remove ${e.member.name}?`, description: "Their future unpaid installments are cancelled; history stays.", reason: "required", destructive: true, confirmLabel: "Remove" }}>
                            Remove
                          </ActionButton>
                        ) : (
                          <StatusBadge status={e.status} />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrap>
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
          <div className="grid gap-4 lg:grid-cols-2">
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
                        #{o.sequence}: {o.skip ? "skipped" : [o.dueDate && `due ${formatDate(o.dueDate)}`, o.amountPaise && formatINR(o.amountPaise)].filter(Boolean).join(", ")}
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

function Info({ k, v, sub }: { k: string; v: string; sub?: string }) {
  return (
    <Card size="sm" className="gap-0.5 px-4">
      <span className="text-xs text-muted-foreground">{k}</span>
      <span className="font-semibold">{v}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </Card>
  );
}
