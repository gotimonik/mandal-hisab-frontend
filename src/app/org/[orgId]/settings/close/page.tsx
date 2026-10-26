import Link from "next/link";
import { AlertTriangle, CheckCircle2, ChevronRight, Lock } from "lucide-react";
import { api } from "@/lib/server/api";
import { getOrg, getMoney } from "@/lib/server/data";
import { PageHeader } from "@/components/app/page-header";
import { Money } from "@/components/app/money";
import { ActionButton } from "@/components/app/action-button";
import { PrintButton } from "@/components/app/print-button";
import { TableWrap } from "@/components/app/table-wrap";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { monthLabelYM } from "@/lib/months";
import { cn } from "@/lib/utils";

export const metadata = { title: "Close & settle" };

interface Preview {
  endMonth: string | null;
  state: { startedAt: string; closedAt: string | null; distributions: { at: string; totalPaise: number; perShare: number; shares: number }[]; paidOut: number } | null;
  accounts: { _id: string; name: string; balancePaise: number }[];
  totals: { cashPaise: number; upadOutstandingPaise: number; memberFundsPaise: number; mandalOwnPaise: number; totalShares: number; perSharePaise: number; netPayoutPaise: number };
  blockers: { key: string; label: string; amountPaise?: number; count?: number; link: string }[];
  rows: { memberId: string; name: string; membershipNumber: string; status: string; shares: number; savingsPaise: number; mandalSharePaise: number; upadOwedPaise: number; netPaise: number; paidOut: { at: string; netPaise: number } | null }[];
  canStart: boolean;
  canClose: boolean;
}

function Step({ n, title, done, children, description }: { n: number; title: string; done?: boolean; description?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2.5 font-bold">
          <span className={cn("flex size-7 items-center justify-center rounded-full text-sm", done ? "bg-emerald-500 text-white" : "bg-secondary text-primary")}>{done ? <CheckCircle2 className="size-4" /> : n}</span>
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default async function ClosePage({ params }: PageProps<"/org/[orgId]/settings/close">) {
  const { orgId } = await params;
  const money = await getMoney(orgId);
  const [org, p] = await Promise.all([getOrg(orgId), api<Preview>(`/orgs/${orgId}/settlement`)]);
  const started = !!p.state;
  const closed = !!p.state?.closedAt;
  const live = org.status === "active";
  const unpaidHapta = p.blockers.find((b) => b.key === "hapta");
  const openItems = p.blockers.filter((b) => !b.key.startsWith("short:"));
  const toPay = p.rows.filter((r) => !r.paidOut && (r.savingsPaise !== 0 || r.upadOwedPaise !== 0 || r.mandalSharePaise !== 0));

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Close & settle the Mandal"
        description={p.endMonth ? `Runs until ${monthLabelYM(p.endMonth)}` : "Share out the money by hapta shares, pay every member, then close."}
        actions={<PrintButton />}
      />

      {closed && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-emerald-500/10 p-4 text-sm text-emerald-800 dark:text-emerald-200">
          <Lock className="size-5 shrink-0" />
          Closed and settled on {formatDate(p.state!.closedAt)}. Everything stays available to read.
        </div>
      )}

      <section className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Totals">
        {[
          ["Cash in the Mandal", p.totals.cashPaise],
          ["Upad still out", p.totals.upadOutstandingPaise],
          ["Members' savings", p.totals.memberFundsPaise],
          ["Mandal's own money", p.totals.mandalOwnPaise],
        ].map(([l, v]) => (
          <div key={l as string} className="rounded-2xl bg-card p-3.5 shadow-card ring-1 ring-foreground/[0.06]">
            <p className="text-xs text-muted-foreground">{l}</p>
            <p className="text-lg font-bold tabular-nums">
              <Money paise={v as number} />
            </p>
          </div>
        ))}
      </section>

      <Step n={1} title="Finish what's still open" done={openItems.length === 0} description="Everything must be collected, verified or waived before money is shared out.">
        {openItems.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="size-4" /> Nothing open.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {openItems.map((b) => (
              <li key={b.key}>
                <Link href={b.link} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-muted/60">
                  <AlertTriangle className="size-4 shrink-0 text-amber-600" />
                  <span className="min-w-0 flex-1 text-sm font-medium">{b.label}</span>
                  {b.amountPaise !== undefined ? <Money paise={b.amountPaise} className="text-sm font-bold" /> : b.count ? <span className="text-sm font-bold">{b.count}</span> : null}
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
        {unpaidHapta && live && (
          <div className="mt-3">
            <ActionButton
              path={`/orgs/${orgId}/settlement/waive-hapta`}
              successMessage="Unpaid hapta waived"
              confirm={{ title: `Waive ${money.fmt(unpaidHapta.amountPaise ?? 0)} of unpaid hapta?`, description: "All hapta not yet paid up to today is waived. Members' savings stay as they are.", reason: "required", reasonLabel: "Why (e.g. members agreed)", confirmLabel: "Waive", destructive: true }}
            >
              Waive all unpaid hapta…
            </ActionButton>
          </div>
        )}
      </Step>

      <Step
        n={2}
        title="Share out the Mandal's own money"
        done={started && p.totals.mandalOwnPaise === 0}
        description="Donations, other income and anything not in members' savings, shared by hapta shares (a member paying 3 haptas gets 3 parts). Future hapta stops."
      >
        <p className="mb-3 text-sm">
          <Money paise={p.totals.mandalOwnPaise} className="font-bold" /> ÷ {p.totals.totalShares} share{p.totals.totalShares === 1 ? "" : "s"} = <Money paise={p.totals.perSharePaise} className="font-bold" /> per share
          {p.totals.mandalOwnPaise < 0 && <span className="text-destructive"> (a loss — it is taken off members&apos; balances)</span>}
        </p>
        {p.state?.distributions.map((d, i) => (
          <p key={i} className="mb-1 text-xs text-muted-foreground">
            Shared {money.fmt(d.totalPaise)} on {formatDate(d.at)} ({money.fmt(d.perShare)} per share)
          </p>
        ))}
        {live && !closed && (!started || p.totals.mandalOwnPaise !== 0) && (
          <ActionButton
            path={`/orgs/${orgId}/settlement/start`}
            variant="default"
            successMessage={started ? "Shared out" : "Closing started — money shared out"}
            confirm={{
              title: started ? `Share out the remaining ${money.fmt(p.totals.mandalOwnPaise)}?` : "Start closing the Mandal?",
              description: `${money.fmt(p.totals.mandalOwnPaise)} is added to members' balances by hapta shares. ${started ? "" : "No new hapta will be created after today. "}This can't be undone automatically.`,
              confirmLabel: started ? "Share out" : "Start closing",
            }}
          >
            {started ? "Share out the remaining money" : "Start closing & share out"}
          </ActionButton>
        )}
        {!started && !p.canStart && <p className="mt-2 text-xs text-muted-foreground">Finish step 1 first.</p>}
      </Step>

      <Step n={3} title="Pay each member" done={started && toPay.length === 0} description="Each member gets their savings + their share; upad they still owe is taken off. A payout voucher is recorded for each.">
        <TableWrap>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead className="text-right">Savings</TableHead>
                <TableHead className="text-right">+ Share</TableHead>
                <TableHead className="text-right">− Upad</TableHead>
                <TableHead className="text-right">Payout</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {p.rows.map((r) => (
                <TableRow key={r.memberId}>
                  <TableCell>
                    <span className="font-semibold">{r.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {r.membershipNumber}
                      {r.shares > 1 ? ` · ${r.shares} shares` : ""}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Money paise={r.savingsPaise} />
                  </TableCell>
                  <TableCell className="text-right">{r.mandalSharePaise ? <Money paise={r.mandalSharePaise} /> : "—"}</TableCell>
                  <TableCell className="text-right">{r.upadOwedPaise ? <Money paise={-r.upadOwedPaise} className="text-rose-600 dark:text-rose-300" /> : "—"}</TableCell>
                  <TableCell className="text-right">
                    <Money paise={r.paidOut ? r.paidOut.netPaise : r.netPaise} className={cn("font-bold", r.netPaise < 0 && !r.paidOut && "text-destructive")} />
                  </TableCell>
                  <TableCell className="text-right">
                    {r.paidOut ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="size-3.5" /> Paid {formatDate(r.paidOut.at)}
                      </span>
                    ) : started && live && r.netPaise >= 0 && (r.savingsPaise !== 0 || r.upadOwedPaise !== 0) ? (
                      <ActionButton
                        path={`/orgs/${orgId}/settlement/payouts/${r.memberId}`}
                        body={{ idempotencyKey: `settle-payout:${r.memberId}` }}
                        size="xs"
                        variant="default"
                        successMessage={`${r.name} paid out`}
                        confirm={{ title: `Pay ${money.fmt(r.netPaise)} to ${r.name}?`, description: `Savings ${money.fmt(r.savingsPaise)}${r.upadOwedPaise ? ` − upad ${money.fmt(r.upadOwedPaise)} (settled from the payout)` : ""}. Paid from the cash account; a payout voucher is recorded.`, confirmLabel: "Pay out" }}
                      >
                        Pay out
                      </ActionButton>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} className="font-semibold">
                  Still to pay
                </TableCell>
                <TableCell className="text-right font-bold">
                  <Money paise={p.totals.netPayoutPaise} />
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </TableWrap>
        {!started && <p className="mt-2 text-xs text-muted-foreground">Payouts open after step 2.</p>}
      </Step>

      <Step n={4} title="Close the Mandal" done={closed} description="When everyone is paid and every account is at zero, close it. It becomes read-only; nothing is deleted.">
        {closed ? (
          <p className="text-sm">Closed on {formatDate(p.state!.closedAt)}.</p>
        ) : (
          <>
            {!p.canClose && started && (
              <p className="mb-2 text-xs text-muted-foreground">
                {p.accounts.filter((a) => a.balancePaise !== 0).map((a) => `${a.name}: ${money.fmt(a.balancePaise)}`).join(" · ") || "Pay everyone out first."}
              </p>
            )}
            {live && (
              <ActionButton
                path={`/orgs/${orgId}/settlement/close`}
                variant={p.canClose ? "destructive" : "outline"}
                successMessage="The Mandal is closed"
                confirm={{ title: `Close ${org.name}?`, description: "It becomes read-only for everyone. All history stays available.", confirmLabel: "Close the Mandal", destructive: true }}
              >
                <Lock /> Close the Mandal
              </ActionButton>
            )}
          </>
        )}
      </Step>
    </div>
  );
}
