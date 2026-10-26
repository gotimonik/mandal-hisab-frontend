import Link from "next/link";
import { CheckCircle2, HandCoins } from "lucide-react";
import { InviteMemberButton } from "@/features/members/invite-member";
import { api, qs } from "@/lib/server/api";
import { getAccounts, getOrg, can, getMoney } from "@/lib/server/data";
import type { FundLoanList, Member, MemberLedger } from "@/lib/types";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Money } from "@/components/app/money";
import { FilterBar, FilterField } from "@/components/app/filter-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { FREQUENCY_LABEL, formatDate, label } from "@/lib/format";
import { MemberDialog } from "@/features/members/member-form";
import { StatementView, type Statement } from "@/features/statement/statement-view";
import { SavingsLedgerTable, SavingsSummary } from "@/features/savings/savings-ledger";
import { AdjustBalanceDialog, OpeningBalanceDialog } from "@/features/savings/balance-dialogs";
import { WithdrawalDialog } from "@/features/withdrawals/withdrawal-form";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function MemberPage({ params, searchParams }: PageProps<"/org/[orgId]/members/[memberId]">) {
  const { orgId, memberId } = await params;
  const money = await getMoney(orgId);
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
  const pendingInvite = invitations.find((i) => i.memberId === memberId);
  const canInvite = can(org, "memberships.manage") && org.status !== "archived";
  const memberLoans = fundLoans.items.filter((l) => l.status !== "cancelled");
  const m = detail.member;
  const live = org.status === "active";
  const canAdjust = can(org, "members.balanceAdjust") && live;
  const accounts = can(org, "withdrawals.record") && live ? (await getAccounts(orgId)).filter((a) => a.isActive) : [];
  return (
    <>
      <PageHeader
        title={m.name}
        description={
          <>
            Member no. {m.membershipNumber} · joined {formatDate(m.joiningDate)}
            {(m.haptaShares ?? 1) > 1 && org.settings.monthlyHapta && (
              <>
                {" "}
                · <b className="text-foreground">{m.haptaShares} haptas a month</b> ({money.fmt(org.settings.monthlyHapta.amountPaise * m.haptaShares!)})
              </>
            )}{" "}
            · <StatusBadge status={m.status} />
          </>
        }
        actions={
          <>
            {can(org, "members.manage") && <MemberDialog orgId={orgId} member={m} />}
            {can(org, "payments.record") && (
              <Link href={`/org/${orgId}/collections?new=1&memberId=${m._id}`} className={buttonVariants({ variant: "outline" })}>
                <HandCoins /> Record payment
              </Link>
            )}
            {accounts.length > 0 && (
              <WithdrawalDialog
                members={[{ _id: m._id, name: m.name, membershipNumber: m.membershipNumber, balancePaise: ledger.currentBalancePaise }]}
                defaultMemberId={m._id}
                accounts={accounts.map((a) => ({ _id: a._id, name: a.name, balancePaise: a.balancePaise }))}
                allowException={org.myRole === "admin" && org.settings.withdrawals.allowExceptions}
                triggerLabel="Withdrawal"
              />
            )}
          </>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <span>{m.phone ?? "No phone"}</span>
            <span>{m.email ?? "No email"}</span>
            {m.address && <span className="text-muted-foreground">{m.address}</span>}
            {m.notes && <p className="mt-2 text-muted-foreground">{m.notes}</p>}
            <div className="mt-3 rounded-xl bg-secondary/50 p-3">
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
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Hapta schemes</CardTitle>
          </CardHeader>
          <CardContent>
            {detail.enrollments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Not enrolled in any scheme.</p>
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
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Loans</CardTitle>
          </CardHeader>
          <CardContent>
            {detail.loans.length === 0 ? (
              <p className="text-sm text-muted-foreground">No loans.</p>
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
          </CardContent>
        </Card>
      </div>
      <div className="mt-8 mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Savings</h2>
        {canAdjust && (
          <div className="flex gap-2">
            {ledger.totals.openingCreditsPaise === 0 && <OpeningBalanceDialog memberId={m._id} />}
            <AdjustBalanceDialog memberId={m._id} />
          </div>
        )}
      </div>
      <SavingsSummary l={ledger} currency={money.code} />
      {memberLoans.length > 0 && (
        <div className="mt-3 rounded-xl text-sm ring-1 ring-foreground/10">
          <p className="border-b px-3 py-2 font-medium">Upad</p>
          <ul className="divide-y">
            {memberLoans.map((l) => (
              <li key={l._id}>
                <Link href={`/org/${orgId}/fund-loans/${l._id}`} className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-muted/50">
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
      <h2 className="mb-3 text-lg font-semibold">Dues statement</h2>
      <StatementView s={statement} csvHref={`/api/export${qs({ path: `/orgs/${orgId}/members/${memberId}/statement`, from, to })}`} />
    </>
  );
}
