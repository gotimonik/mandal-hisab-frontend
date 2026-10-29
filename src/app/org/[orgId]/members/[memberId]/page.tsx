import Link from "next/link";
import { CalendarDays, CheckCircle2, HandCoins, Landmark, Mail, MapPin, Phone, PiggyBank } from "lucide-react";
import { InviteMemberButton } from "@/features/members/invite-member";
import { api, qs } from "@/lib/server/api";
import { getAccounts, getOrg, can, getMoney } from "@/lib/server/data";
import type { FundLoanList, JoiningQuote, Member, MemberLedger } from "@/lib/types";
import { StatusBadge } from "@/components/app/status-badge";
import { Money } from "@/components/app/money";
import { FilterBar, FilterField } from "@/components/app/filter-bar";
import { SummaryBand } from "@/components/app/summary-band";
import { IconChip, MemberAvatar, SectionTitle } from "@/components/app/bits";
import type { Tone } from "@/lib/tones";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { FREQUENCY_LABEL, formatDate, label } from "@/lib/format";
import { MemberDialog } from "@/features/members/member-form";
import { StatementView, type Statement } from "@/features/statement/statement-view";
import { getT } from "@/i18n/server";
import { SavingsLedgerTable } from "@/features/savings/savings-ledger";
import { AdjustBalanceDialog, OpeningBalanceDialog } from "@/features/savings/balance-dialogs";
import { WithdrawalDialog } from "@/features/withdrawals/withdrawal-form";
import { JoiningDueCard, LeaveMandalDialog } from "@/features/members/membership-dialogs";

/** A small card: coloured icon chip + title, then its content. */
function InfoCard({ tone, icon, title, children }: { tone: Tone; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-card p-4 shadow-card ring-1 ring-foreground/[0.06]">
      <div className="mb-2 flex items-center gap-2.5">
        <IconChip tone={tone} size="sm">
          {icon}
        </IconChip>
        <h2 className="font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function MemberPage({ params, searchParams }: PageProps<"/org/[orgId]/members/[memberId]">) {
  const { orgId, memberId } = await params;
  const sp = await searchParams;
  const from = typeof sp.from === "string" ? sp.from : "";
  const to = typeof sp.to === "string" ? sp.to : "";
  const orgP = getOrg(orgId);
  const [org, detail, statement, ledger, fundLoans, invitations] = await Promise.all([
    orgP,
    api<{ member: Member; enrollments: any[]; loans: any[] }>(`/orgs/${orgId}/members/${memberId}`),
    api<Statement>(`/orgs/${orgId}/members/${memberId}/statement${qs({ from, to })}`),
    api<MemberLedger>(`/orgs/${orgId}/members/${memberId}/ledger${qs({ from, to })}`),
    api<FundLoanList>(`/orgs/${orgId}/fund-loans${qs({ status: "all", memberId })}`),
    orgP.then((o) => (can(o, "memberships.manage") ? api<{ _id: string; email: string; memberId: string | null; createdAt: string }[]>(`/orgs/${orgId}/invitations`) : [])),
  ]);
  // getOrg is already in flight above (and cached), so this resolves without a second wait
  const money = await getMoney(orgId);
  const { t: tr } = await getT();
  const pendingInvite = invitations.find((i) => i.memberId === memberId);
  const canInvite = can(org, "memberships.manage") && org.status !== "archived";
  const memberLoans = fundLoans.items.filter((l) => l.status !== "cancelled");
  const m = detail.member;
  const live = org.status === "active";
  const canAdjust = can(org, "members.balanceAdjust") && live;
  const canWithdraw = can(org, "withdrawals.record") && live;
  const joiningDue = m.joining?.status === "due";
  const [allAccounts, joiningQuote] = await Promise.all([
    canWithdraw || canAdjust ? getAccounts(orgId) : Promise.resolve([]),
    joiningDue ? api<JoiningQuote>(`/orgs/${orgId}/members/${memberId}/joining`) : Promise.resolve(null),
  ]);
  const accounts = allAccounts.filter((a) => a.isActive);
  const accountOptions = accounts.map((a) => ({ _id: a._id, name: a.name, balancePaise: a.balancePaise }));
  return (
    <>
      {/* Same layout as PageHeader, with the member's avatar beside the name */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <MemberAvatar name={m.name} className="size-12 text-base" />
          <div className="min-w-0">
            <div className="mb-0.5 text-xs font-semibold tracking-wide text-primary uppercase">Member no. {m.membershipNumber}</div>
            <h1 className="truncate text-2xl font-bold tracking-tight sm:text-[1.7rem]">{m.name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground">
              Joined {formatDate(m.joiningDate)}
              {(m.haptaShares ?? 1) > 1 && org.settings.monthlyHapta && (
                <>
                  {" "}
                  · <b className="text-foreground">{m.haptaShares} haptas a month</b> ({money.fmt(org.settings.monthlyHapta.amountPaise * m.haptaShares!)})
                </>
              )}{" "}
              {m.joining?.status === "paid" && (
                <>
                  {" "}
                  · joined partway (paid <Money paise={m.joining.totalPaise} />)
                </>
              )}
              · <StatusBadge status={m.status} />
            </p>
          </div>
        </div>
        <div className="no-print flex flex-wrap items-center gap-2">
          <>
            {can(org, "members.manage") && <MemberDialog orgId={orgId} member={m} />}
            {can(org, "payments.record") && (
              <Link href={`/org/${orgId}/collections?new=1&memberId=${m._id}`} className={buttonVariants({ variant: "outline" })}>
                <HandCoins /> Record payment
              </Link>
            )}
            {canWithdraw && accounts.length > 0 && m.status !== "left" && (
              <WithdrawalDialog
                members={[{ _id: m._id, name: m.name, membershipNumber: m.membershipNumber, balancePaise: ledger.currentBalancePaise }]}
                defaultMemberId={m._id}
                accounts={accounts.map((a) => ({ _id: a._id, name: a.name, balancePaise: a.balancePaise }))}
                allowException={org.myRole === "admin" && org.settings.withdrawals.allowExceptions}
                triggerLabel="Withdrawal"
              />
            )}
            {canWithdraw && can(org, "members.manage") && m.status !== "left" && <LeaveMandalDialog memberId={m._id} memberName={m.name} accounts={accountOptions} />}
          </>
        </div>
      </div>
      {joiningQuote?.due && <JoiningDueCard memberId={m._id} quote={joiningQuote} accounts={accountOptions} canCollect={canAdjust} />}
      {m.status === "left" && m.leaving?.status === "done" && (
        <section className="mb-5 rounded-2xl bg-muted/60 p-4 text-sm ring-1 ring-foreground/[0.06]">
          <h2 className="font-semibold">
            Left the Mandal on {formatDate(m.leaving.date)} — paid <Money paise={m.leaving.netPaise} />
          </h2>
          <p className="text-muted-foreground">
            Savings <Money paise={m.leaving.savingsPaise} /> + share of the Mandal&apos;s own money <Money paise={m.leaving.mandalSharePaise} />
            {m.leaving.upadSettledPaise > 0 && (
              <>
                {" "}
                − upad <Money paise={m.leaving.upadSettledPaise} />
              </>
            )}
            {m.leaving.reason ? ` · ${m.leaving.reason}` : ""}
          </p>
        </section>
      )}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        <InfoCard tone="sky" icon={<Phone />} title="Contact">
          <div className="flex flex-col gap-1.5 text-sm">
            <span className="flex items-center gap-2">
              <Phone className="size-3.5 shrink-0 text-muted-foreground" />
              {m.phone ? (
                <a href={`tel:${m.phone}`} className="hover:underline">
                  {m.phone}
                </a>
              ) : (
                <span className="text-muted-foreground">No phone</span>
              )}
            </span>
            <span className="flex min-w-0 items-center gap-2">
              <Mail className="size-3.5 shrink-0 text-muted-foreground" />
              <span className={m.email ? "truncate" : "text-muted-foreground"}>{m.email ?? "No email"}</span>
            </span>
            {m.address && (
              <span className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="mt-0.5 size-3.5 shrink-0" />
                {m.address}
              </span>
            )}
            {m.notes && <p className="mt-2 text-muted-foreground">{m.notes}</p>}
            <div className="mt-2 rounded-xl bg-secondary/50 p-3">
              {m.userId ? (
                <span className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="size-4" /> Signs in to the app
                </span>
              ) : pendingInvite ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs">
                    <span className="block font-medium">Invitation sent {formatDate(pendingInvite.createdAt)}</span>
                    <span className="text-muted-foreground">to {pendingInvite.email} · waiting for them to join</span>
                  </span>
                  {canInvite && <InviteMemberButton orgId={orgId} memberId={m._id} memberName={m.name} email={pendingInvite.email} again />}
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">No app login yet</span>
                  {canInvite && <InviteMemberButton orgId={orgId} memberId={m._id} memberName={m.name} email={m.email} />}
                </div>
              )}
            </div>
          </div>
        </InfoCard>
        <InfoCard tone="indigo" icon={<CalendarDays />} title="Hapta schemes">
          {detail.enrollments.length === 0 ? (
            <p className="rounded-xl bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground">Not enrolled in any scheme.</p>
          ) : (
            <ul className="divide-y text-sm">
              {detail.enrollments.map((e) => (
                <li key={e._id} className="flex items-center justify-between gap-2 py-2">
                  <Link href={`/org/${orgId}/schemes/${e.scheme._id}`} className="min-w-0 hover:underline">
                    <span className="block truncate font-medium">{e.scheme.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {label(FREQUENCY_LABEL, e.scheme.frequency)} · <Money paise={e.amountPaise ?? e.scheme.amountPaise} />
                    </span>
                  </Link>
                  <StatusBadge status={e.status} />
                </li>
              ))}
            </ul>
          )}
        </InfoCard>
        <InfoCard tone="violet" icon={<Landmark />} title="Loans">
          {detail.loans.length === 0 ? (
            <p className="rounded-xl bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground">No loans.</p>
          ) : (
            <ul className="divide-y text-sm">
              {detail.loans.map((l) => (
                <li key={l._id} className="flex items-center justify-between gap-2 py-2">
                  <Link href={`/org/${orgId}/loans/${l._id}`} className="hover:underline">
                    <span className="block font-medium">{l.loanNumber}</span>
                    <span className="text-xs text-muted-foreground">
                      Outstanding <Money paise={l.outstandingPrincipalPaise} />
                    </span>
                  </Link>
                  <StatusBadge status={l.status} />
                </li>
              ))}
            </ul>
          )}
        </InfoCard>
      </div>
      <SectionTitle
        className="mt-8"
        action={
          canAdjust ? (
            <div className="flex flex-wrap gap-2">
              {ledger.totals.openingCreditsPaise === 0 && <OpeningBalanceDialog memberId={m._id} />}
              <AdjustBalanceDialog memberId={m._id} />
            </div>
          ) : undefined
        }
      >
        Savings
      </SectionTitle>
      <SummaryBand
        tone="green"
        icon={<PiggyBank />}
        label={tr("savings.balance")}
        value={<Money paise={ledger.currentBalancePaise} />}
        sub={
          [ledger.totals.openingCreditsPaise ? tr("savings.inclOpeningX", { amount: money.fmt(ledger.totals.openingCreditsPaise) }) : "", ledger.totals.adjustmentsPaise ? tr("savings.adjustmentsX", { amount: money.fmt(ledger.totals.adjustmentsPaise) }) : ""]
            .filter(Boolean)
            .join(" · ") || undefined
        }
        stats={[
          { label: tr("savings.haptaPaid"), value: <Money paise={ledger.totals.haptaPaise} /> },
          { label: tr("savings.interestEarned"), value: <Money paise={ledger.totals.interestPaise} /> },
          { label: tr("savings.withdrawn"), value: <Money paise={ledger.totals.withdrawalsPaise} /> },
        ]}
      />
      {memberLoans.length > 0 && (
        <div className="mb-4 rounded-2xl bg-card p-2 text-sm shadow-card ring-1 ring-foreground/[0.06]">
          <div className="flex items-center gap-2.5 px-2 pt-1.5 pb-2">
            <IconChip tone="orange" size="sm">
              <HandCoins />
            </IconChip>
            <h3 className="font-semibold">Upad</h3>
          </div>
          <ul className="flex flex-col">
            {memberLoans.map((l) => (
              <li key={l._id}>
                <Link href={`/org/${orgId}/fund-loans/${l._id}`} className="flex items-center justify-between gap-2 rounded-xl px-2 py-2.5 hover:bg-muted/60">
                  <span>
                    <span className="font-mono text-xs">{l.number}</span> · <Money paise={l.principalPaise} /> @ {l.monthlyRate}%
                    <span className="block text-xs text-muted-foreground">
                      Outstanding <Money paise={l.outstandingPaise} /> · interest due <Money paise={l.interestDuePaise} />
                    </span>
                  </span>
                  <StatusBadge status={l.status} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <FilterBar resetHref={`/org/${orgId}/members/${memberId}`}>
        <FilterField label="From">
          <Input type="date" name="from" defaultValue={from} />
        </FilterField>
        <FilterField label="To">
          <Input type="date" name="to" defaultValue={to} />
        </FilterField>
      </FilterBar>
      <div className="mb-8">
        <SavingsLedgerTable l={ledger} csvHref={`/api/export${qs({ path: `/orgs/${orgId}/members/${memberId}/ledger`, from, to })}`} />
      </div>
      <SectionTitle>Dues statement</SectionTitle>
      <StatementView s={statement} csvHref={`/api/export${qs({ path: `/orgs/${orgId}/members/${memberId}/statement`, from, to })}`} />
    </>
  );
}
