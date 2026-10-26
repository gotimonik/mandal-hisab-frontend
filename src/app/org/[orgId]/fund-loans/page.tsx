import Link from "next/link";
import { HandCoins } from "lucide-react";
import { api, qs } from "@/lib/server/api";
import { can, getAccounts, getActiveMembers, getOrg } from "@/lib/server/data";
import type { FundLoanList, UpadPaymentClaim, UpadRequest } from "@/lib/types";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Money } from "@/components/app/money";
import { EmptyState } from "@/components/app/empty-state";
import { TableWrap } from "@/components/app/table-wrap";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { METHOD_LABEL, formatDate, formatINR, label } from "@/lib/format";
import { MemberAvatar } from "@/components/app/bits";
import { GiveLoanDialog } from "@/features/fund-loans/give-loan-dialog";
import { LoanPaymentDialog } from "@/features/fund-loans/loan-payment-dialog";
import { ApproveRequestDialog } from "@/features/fund-loans/approve-request-dialog";
import { ActionButton } from "@/components/app/action-button";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Upad" };

const TABS = [
  ["active", "Active"],
  ["closed", "Closed"],
  ["all", "All"],
] as const;

export default async function FundLoansPage({ params, searchParams }: PageProps<"/org/[orgId]/fund-loans">) {
  const { orgId } = await params;
  const sp = await searchParams;
  const status = typeof sp.status === "string" && ["active", "closed", "all"].includes(sp.status) ? sp.status : "active";
  const [org, data] = await Promise.all([getOrg(orgId), api<FundLoanList>(`/orgs/${orgId}/fund-loans${qs({ status })}`)]);
  const live = org.status === "active";
  const canGive = can(org, "withdrawals.record") && live;
  const canCollect = can(org, "payments.record") && live;
  // everything else in one parallel batch
  const [members, accounts, requests, claims] = await Promise.all([
    canGive ? getActiveMembers(orgId) : Promise.resolve([]),
    canGive ? getAccounts(orgId) : Promise.resolve([]),
    canGive ? api<{ items: UpadRequest[]; availablePaise: number }>(`/orgs/${orgId}/upad-requests`) : Promise.resolve({ items: [] as UpadRequest[], availablePaise: 0 }),
    can(org, "payments.view") ? api<UpadPaymentClaim[]>(`/orgs/${orgId}/upad-payments`) : Promise.resolve([] as UpadPaymentClaim[]),
  ]);
  const canVerify = can(org, "payments.verify") && live;
  const t = data.totals;
  return (
    <>
      <PageHeader
        title="Upad"
        description="Members take upad from the Mandal's cash and pay interest every month on what is still outstanding."
        actions={
          canGive ? (
            <GiveLoanDialog
              members={members.map((m) => ({ _id: m._id, name: m.name, membershipNumber: m.membershipNumber }))}
              accounts={accounts.filter((a) => a.isActive).sort((a, b) => (a.type === "cash" ? -1 : 0) - (b.type === "cash" ? -1 : 0)).map((a) => ({ _id: a._id, name: a.name, balancePaise: a.balancePaise }))}
              defaultRate={data.defaultMonthlyRate}
              defaultOpen={sp.new === "1"}
            />
          ) : null
        }
      />
      <section aria-label="Upad totals" className="bg-hero-warm relative mb-5 overflow-hidden rounded-3xl p-5 shadow-lg shadow-orange-500/20">
        <div className="pointer-events-none absolute -top-12 -right-10 size-40 rounded-full bg-white/10" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-white/85">Upad given out</p>
            <p className="text-3xl font-extrabold tracking-tight tabular-nums">
              <Money paise={t.outstandingPaise} short />
            </p>
            <p className="text-sm text-white/85">
              {t.activeLoans} active upad · {data.defaultMonthlyRate}% / month
            </p>
          </div>
          <HandCoins className="size-9 opacity-80" />
        </div>
        <div className="relative mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-white/15 px-3 py-2">
            <p className="text-[11px] text-white/85">Interest due</p>
            <p className="text-lg font-bold tabular-nums">
              <Money paise={t.interestDuePaise} short />
            </p>
          </div>
          <div className="rounded-2xl bg-white/15 px-3 py-2">
            <p className="text-[11px] text-white/85">Interest received · shared</p>
            <p className="text-lg font-bold tabular-nums">
              <Money paise={t.interestPaidPaise} short />
            </p>
          </div>
        </div>
      </section>
      {claims.length > 0 && (
        <section className="mb-5" aria-label="Upad payments to verify">
          <h2 className="mb-1 text-base font-bold">Payments to verify ({claims.length})</h2>
          <p className="mb-2 text-sm text-muted-foreground">Members told us they paid. Check the money has arrived, then verify — a receipt is issued and the interest is shared among members.</p>
          <Card className="divide-y gap-0 p-0 ring-2 ring-orange-400/40">
            {claims.map((x) => (
              <div key={x._id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium">
                    {x.member?.name ?? "Member"} · {x.loanNumber}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {x.interestPaise > 0 && <>Interest <Money paise={x.interestPaise} /></>}
                    {x.interestPaise > 0 && x.principalPaise > 0 && " + "}
                    {x.principalPaise > 0 && <>upad returned <Money paise={x.principalPaise} /></>}
                    {" · "}
                    {formatDate(x.date)} · {label(METHOD_LABEL, x.method)}
                    {x.reference ? ` · ref ${x.reference}` : ""}
                    {x.notes ? ` · ${x.notes}` : ""}
                  </p>
                </div>
                {x.alreadyRecorded && (
                  <p className="w-full rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-800 sm:order-last dark:text-emerald-200">
                    Already recorded with Receive on {formatDate(x.alreadyRecorded.date)} (
                    {[x.alreadyRecorded.interestPaise ? `${formatINR(x.alreadyRecorded.interestPaise)} interest` : "", x.alreadyRecorded.principalPaise ? `${formatINR(x.alreadyRecorded.principalPaise)} upad` : ""].filter(Boolean).join(" + ")}). Close this so it isn&apos;t counted twice.
                  </p>
                )}
                {canVerify && x.alreadyRecorded ? (
                  <div className="flex gap-1">
                    <ActionButton path={`/orgs/${orgId}/upad-payments/${x._id}/settle`} size="xs" variant="default" successMessage="Closed — matched to the recorded payment" confirm={{ title: "Close this as already recorded?", description: "No new payment is created. The member is told it was received and gets the receipt.", confirmLabel: "Already recorded" }}>
                      Already recorded
                    </ActionButton>
                  </div>
                ) : canVerify && (
                  <div className="flex gap-1">
                    <ActionButton path={`/orgs/${orgId}/upad-payments/${x._id}/reject`} size="xs" variant="ghost" successMessage="Payment rejected" confirm={{ title: "Reject this payment?", reason: "required", reasonLabel: "Reason (shown to the member)", destructive: true, confirmLabel: "Reject" }}>
                      Reject
                    </ActionButton>
                    <ActionButton path={`/orgs/${orgId}/upad-payments/${x._id}/verify`} size="xs" variant="default" successMessage="Verified — receipt issued" confirm={{ title: `Verify ${x.member?.name ?? "this"} payment of ₹${((x.interestPaise + x.principalPaise) / 100).toLocaleString("en-IN")}?`, description: "Only if the money has reached the Mandal.", confirmLabel: "Verify" }}>
                      Verify
                    </ActionButton>
                  </div>
                )}
              </div>
            ))}
          </Card>
        </section>
      )}
      {requests.items.length > 0 && (
        <section className="mb-5" aria-label="Upad requests">
          <h2 className="mb-1 text-base font-bold">Requests waiting ({requests.items.length})</h2>
          <p className="mb-2 text-sm text-muted-foreground">
            Available in the Mandal now: <Money paise={requests.availablePaise} className="font-medium text-foreground" />
          </p>
          <Card className="divide-y gap-0 p-0 ring-2 ring-orange-400/40">
            {requests.items.map((r) => (
              <div key={r._id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium">
                    {r.member?.name ?? "Member"} · <Money paise={r.amountPaise} />
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.purpose ? `${r.purpose} · ` : ""}asked {formatDate(r.createdAt)}
                    {r.member?.balancePaise !== undefined ? <> · savings <Money paise={r.member.balancePaise} /></> : null}
                  </p>
                  {!r.withinAvailable && <p className="text-xs text-destructive">More than the cash available now</p>}
                </div>
                {live && (
                  <div className="flex gap-1">
                    <ActionButton path={`/orgs/${orgId}/upad-requests/${r._id}/reject`} size="xs" variant="ghost" successMessage="Request rejected" confirm={{ title: `Reject ${r.member?.name ?? "this member"}'s request?`, reason: "required", reasonLabel: "Reason (shown to the member)", destructive: true, confirmLabel: "Reject" }}>
                      Reject
                    </ActionButton>
                    <ApproveRequestDialog requestId={r._id} memberName={r.member?.name ?? "member"} amountPaise={r.amountPaise} defaultRate={data.defaultMonthlyRate} />
                  </div>
                )}
              </div>
            ))}
          </Card>
        </section>
      )}
      <div className="mb-3 flex gap-2 text-sm">
        {TABS.map(([k, l]) => (
          <Link key={k} href={`/org/${orgId}/fund-loans${qs({ status: k })}`} aria-current={status === k ? "page" : undefined} className={`rounded-full px-3.5 py-2 font-semibold ${status === k ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30" : "bg-card text-muted-foreground ring-1 ring-foreground/10 hover:text-foreground"}`}>
            {l}
          </Link>
        ))}
      </div>
      {data.items.length === 0 ? (
        <EmptyState icon={<HandCoins />} title={status === "active" ? "No upad given out right now" : "No upad"} description="When a member takes upad from the Mandal's cash, record it with Give upad." />
      ) : (
        <>
        <ul className="flex flex-col gap-2 md:hidden" aria-label="Upad list">
          {data.items.map((l) => (
            <li key={l._id} className="rounded-2xl bg-card p-3.5 shadow-card ring-1 ring-foreground/[0.06]">
              <Link href={`/org/${orgId}/fund-loans/${l._id}`} className="flex items-center gap-3">
                <MemberAvatar name={l.member?.name ?? "?"} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{l.member?.name ?? "—"}</span>
                  <span className="block truncate font-mono text-[11px] text-muted-foreground">{l.number}</span>
                </span>
                {l.status !== "active" && <StatusBadge status={l.status} />}
              </Link>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl bg-muted/60 px-3 py-2">
                  <p className="text-[11px] text-muted-foreground">Outstanding</p>
                  <p className="font-bold tabular-nums"><Money paise={l.outstandingPaise} short /></p>
                  <p className="text-[11px] text-muted-foreground">{l.monthlyRate}% · since {formatDate(l.date)}</p>
                </div>
                <div className={`rounded-xl px-3 py-2 ${l.interestDuePaise > 0 ? "bg-amber-500/12" : "bg-muted/60"}`}>
                  <p className="text-[11px] text-muted-foreground">Interest due</p>
                  <p className={`font-bold tabular-nums ${l.interestDuePaise > 0 ? "text-warning-ink" : ""}`}><Money paise={l.interestDuePaise} short /></p>
                  <p className="text-[11px] text-muted-foreground">{l.unpaidMonths.length > 0 ? `${l.unpaidMonths.length} month${l.unpaidMonths.length === 1 ? "" : "s"} unpaid` : "Nothing due"}</p>
                </div>
              </div>
              {canCollect && l.status === "active" && (
                <div className="mt-3 [&_button]:w-full">
                  <LoanPaymentDialog reported={claims.filter((x) => x.loanId === l._id && !x.alreadyRecorded)} loanId={l._id} number={l.number} memberName={l.member?.name ?? "member"} interestDuePaise={l.interestDuePaise} outstandingPaise={l.outstandingPaise} size="sm" label="Receive payment" />
                </div>
              )}
            </li>
          ))}
        </ul>
        <div className="hidden md:block">
        <TableWrap>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Upad</TableHead>
                <TableHead className="hidden sm:table-cell">Member</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Rate</TableHead>
                <TableHead className="text-right">Interest due</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden text-right sm:table-cell" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((l) => (
                <TableRow key={l._id}>
                  <TableCell>
                    <Link href={`/org/${orgId}/fund-loans/${l._id}`} className="font-mono text-xs font-medium text-primary hover:underline">
                      {l.number}
                    </Link>
                    <div className="font-medium sm:hidden">{l.member?.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      <Money paise={l.principalPaise} /> on {formatDate(l.date)}
                      <span className="sm:hidden"> · {l.monthlyRate}%{l.status !== "active" ? ` · ${l.status}` : ""}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden font-medium sm:table-cell">{l.member?.name ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <Money paise={l.outstandingPaise} />
                  </TableCell>
                  <TableCell className="hidden text-right sm:table-cell">{l.monthlyRate}%</TableCell>
                  <TableCell className="text-right">
                    <Money paise={l.interestDuePaise} className={l.interestDuePaise > 0 ? "font-medium text-warning-ink" : "text-muted-foreground"} />
                    {l.unpaidMonths.length > 1 && <div className="text-xs text-muted-foreground">{l.unpaidMonths.length} months</div>}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <StatusBadge status={l.status} />
                  </TableCell>
                  <TableCell className="hidden text-right sm:table-cell">
                    {canCollect && l.status === "active" && <LoanPaymentDialog reported={claims.filter((x) => x.loanId === l._id && !x.alreadyRecorded)} loanId={l._id} number={l.number} memberName={l.member?.name ?? "member"} interestDuePaise={l.interestDuePaise} outstandingPaise={l.outstandingPaise} size="xs" label="Receive" />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableWrap>
        </div>
        </>
      )}
    </>
  );
}
