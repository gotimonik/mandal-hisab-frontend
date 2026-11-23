import Link from "next/link";
import { AlertTriangle, CheckCircle2, ChevronRight, Lock, Scale } from "lucide-react";
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
import { getT } from "@/i18n/server";
import { monthName } from "@/i18n/core";
import { cn } from "@/lib/utils";
import { SummaryBand } from "@/components/app/summary-band";
import { IconChip, MemberAvatar } from "@/components/app/bits";

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
  const { t, lang } = await getT();
  const [org, p] = await Promise.all([getOrg(orgId), api<Preview>(`/orgs/${orgId}/settlement`)]);
  // getOrg is already in flight above (and cached), so this resolves without a second wait
  const money = await getMoney(orgId);
  const started = !!p.state;
  const closed = !!p.state?.closedAt;
  const live = org.status === "active";
  const unpaidHapta = p.blockers.find((b) => b.key === "hapta");
  const openItems = p.blockers.filter((b) => !b.key.startsWith("short:"));
  const toPay = p.rows.filter((r) => !r.paidOut && (r.savingsPaise !== 0 || r.upadOwedPaise !== 0 || r.mandalSharePaise !== 0));
  type Row = Preview["rows"][number];
  const payout = (r: Row) =>
    r.paidOut ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 className="size-3.5" /> {t("close.paid", { date: formatDate(r.paidOut.at) })}
      </span>
    ) : started && live && r.netPaise >= 0 && (r.savingsPaise !== 0 || r.upadOwedPaise !== 0) ? (
      <ActionButton
        path={`/orgs/${orgId}/settlement/payouts/${r.memberId}`}
        body={{ idempotencyKey: `settle-payout:${r.memberId}` }}
        size="xs"
        variant="default"
        successMessage={t("close.paidOut", { name: r.name })}
        confirm={{
          title: t("close.payQ", { amount: money.fmt(r.netPaise), name: r.name }),
          description: r.upadOwedPaise ? t("close.payDescUpad", { savings: money.fmt(r.savingsPaise), upad: money.fmt(r.upadOwedPaise) }) : t("close.payDesc", { savings: money.fmt(r.savingsPaise) }),
          confirmLabel: t("close.payOut"),
        }}
      >
        {t("close.payOut")}
      </ActionButton>
    ) : null;

  return (
    <div className="max-w-4xl">
      <PageHeader title={t("close.title")} description={p.endMonth ? t("close.runsUntil", { month: monthName(lang, p.endMonth) }) : t("close.desc")} actions={<PrintButton />} />

      {closed && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-emerald-500/10 p-4 text-sm text-emerald-800 dark:text-emerald-200">
          <Lock className="size-5 shrink-0" />
          {t("close.closedOn", { date: formatDate(p.state!.closedAt) })}
        </div>
      )}

      <SummaryBand
        tone={closed ? "green" : "warm"}
        icon={<Scale />}
        label={closed ? t("close.settledToPay") : t("close.stillToPayMembers")}
        value={<Money paise={p.totals.netPayoutPaise} />}
        sub={
          <>
            {t("close.membersSavings")} <Money paise={p.totals.memberFundsPaise} /> · {p.totals.totalShares === 1 ? t("close.sharesOne") : t("close.sharesN", { n: p.totals.totalShares })}
          </>
        }
        stats={[
          { label: t("close.cash"), value: <Money paise={p.totals.cashPaise} /> },
          { label: t("close.upadOut"), value: <Money paise={p.totals.upadOutstandingPaise} /> },
          { label: t("close.mandalOwn"), value: <Money paise={p.totals.mandalOwnPaise} /> },
        ]}
      />

      <Step n={1} title={t("close.s1")} done={openItems.length === 0} description={t("close.s1d")}>
        {openItems.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="size-4" /> {t("close.nothingOpen")}
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {openItems.map((b) => (
              <li key={b.key}>
                <Link href={b.link} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-muted/60">
                  <IconChip tone="amber" size="sm">
                    <AlertTriangle />
                  </IconChip>
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
              successMessage={t("close.waived")}
              confirm={{
                title: t("close.waiveQ", { amount: money.fmt(unpaidHapta.amountPaise ?? 0) }),
                description: t("close.waiveDesc"),
                reason: "required",
                reasonLabel: t("close.waiveWhy"),
                confirmLabel: t("close.waive"),
                destructive: true,
              }}
            >
              {t("close.waiveAll")}
            </ActionButton>
          </div>
        )}
      </Step>

      <Step
        n={2}
        title={t("close.s2")}
        done={started && p.totals.mandalOwnPaise === 0}
        description={t("close.s2d")}
      >
        <p className="mb-3 text-sm">
          <Money paise={p.totals.mandalOwnPaise} className="font-bold" /> ÷ {p.totals.totalShares === 1 ? t("close.shareOne") : t("close.shareN", { n: p.totals.totalShares })} = <Money paise={p.totals.perSharePaise} className="font-bold" /> {t("close.perShare")}
          {p.totals.mandalOwnPaise < 0 && <span className="text-destructive">{t("close.loss")}</span>}
        </p>
        {p.state?.distributions.map((d, i) => (
          <p key={i} className="mb-1 text-xs text-muted-foreground">
            {t("close.sharedOn", { amount: money.fmt(d.totalPaise), date: formatDate(d.at), per: money.fmt(d.perShare) })}
          </p>
        ))}
        {live && !closed && (!started || p.totals.mandalOwnPaise !== 0) && (
          <ActionButton
            path={`/orgs/${orgId}/settlement/start`}
            variant="default"
            successMessage={started ? t("close.sharedOut") : t("close.closingStarted")}
            confirm={{
              title: started ? t("close.shareRemainingQ", { amount: money.fmt(p.totals.mandalOwnPaise) }) : t("close.startQ"),
              description: started ? t("close.shareDesc", { amount: money.fmt(p.totals.mandalOwnPaise) }) : t("close.startDesc", { amount: money.fmt(p.totals.mandalOwnPaise) }),
              confirmLabel: started ? t("close.shareOut") : t("close.startClosing"),
            }}
          >
            {started ? t("close.shareRemaining") : t("close.startAndShare")}
          </ActionButton>
        )}
        {!started && !p.canStart && <p className="mt-2 text-xs text-muted-foreground">{t("close.finish1")}</p>}
      </Step>

      <Step n={3} title={t("close.s3")} done={started && toPay.length === 0} description={t("close.s3d")}>
        <ul className="flex flex-col gap-2 md:hidden print:hidden" aria-label={t("close.payouts")}>
          {p.rows.map((r) => (
            <li key={r.memberId} className={cn("rounded-2xl bg-card p-3.5 shadow-card ring-1 ring-foreground/[0.06]", r.paidOut && "opacity-80")}>
              <div className="flex items-start gap-3">
                <MemberAvatar name={r.name} size="sm" />
                <div className="min-w-0 flex-1 text-sm">
                  <span className="font-semibold">{r.name}</span>
                  <p className="text-xs text-muted-foreground">
                    {r.membershipNumber}
                    {r.shares > 1 ? t("close.nShares", { n: r.shares }) : ""}
                  </p>
                </div>
                <Money paise={r.paidOut ? r.paidOut.netPaise : r.netPaise} className={cn("shrink-0 font-bold", r.netPaise < 0 && !r.paidOut && "text-destructive")} />
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1.5 text-xs">
                <div className="rounded-lg bg-muted/60 px-2 py-1.5">
                  <span className="block text-muted-foreground">{t("close.savings")}</span>
                  <Money paise={r.savingsPaise} className="font-semibold" />
                </div>
                <div className="rounded-lg bg-emerald-500/8 px-2 py-1.5">
                  <span className="block text-muted-foreground">{t("close.plusShare")}</span>
                  {r.mandalSharePaise ? <Money paise={r.mandalSharePaise} className="font-semibold" /> : "—"}
                </div>
                <div className="rounded-lg bg-rose-500/8 px-2 py-1.5">
                  <span className="block text-muted-foreground">{t("close.minusUpad")}</span>
                  {r.upadOwedPaise ? <Money paise={-r.upadOwedPaise} className="font-semibold text-rose-600 dark:text-rose-300" /> : "—"}
                </div>
              </div>
              <div className="mt-2 flex justify-end empty:hidden">{payout(r)}</div>
            </li>
          ))}
          <li className="flex items-center justify-between rounded-2xl bg-secondary/50 px-3.5 py-3 text-sm font-semibold">
            {t("close.stillToPay")} <Money paise={p.totals.netPayoutPaise} className="font-bold" />
          </li>
        </ul>
        <div className="hidden md:block print:block">
          <TableWrap>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("close.member")}</TableHead>
                  <TableHead className="text-right">{t("close.savings")}</TableHead>
                  <TableHead className="text-right">{t("close.plusShare")}</TableHead>
                  <TableHead className="text-right">{t("close.minusUpad")}</TableHead>
                  <TableHead className="text-right">{t("close.payout")}</TableHead>
                  <TableHead className="text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {p.rows.map((r) => (
                  <TableRow key={r.memberId}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <MemberAvatar name={r.name} size="sm" />
                        <div className="min-w-0">
                          <span className="font-semibold">{r.name}</span>
                          <span className="block text-xs text-muted-foreground">
                            {r.membershipNumber}
                            {r.shares > 1 ? t("close.nShares", { n: r.shares }) : ""}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Money paise={r.savingsPaise} />
                    </TableCell>
                    <TableCell className="text-right">{r.mandalSharePaise ? <Money paise={r.mandalSharePaise} /> : "—"}</TableCell>
                    <TableCell className="text-right">{r.upadOwedPaise ? <Money paise={-r.upadOwedPaise} className="text-rose-600 dark:text-rose-300" /> : "—"}</TableCell>
                    <TableCell className="text-right">
                      <Money paise={r.paidOut ? r.paidOut.netPaise : r.netPaise} className={cn("font-bold", r.netPaise < 0 && !r.paidOut && "text-destructive")} />
                    </TableCell>
                    <TableCell className="text-right">{payout(r)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4} className="font-semibold">
                    {t("close.stillToPay")}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    <Money paise={p.totals.netPayoutPaise} />
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          </TableWrap>
        </div>
        {!started && <p className="mt-2 text-xs text-muted-foreground">{t("close.after2")}</p>}
      </Step>

      <Step n={4} title={t("close.s4")} done={closed} description={t("close.s4d")}>
        {closed ? (
          <p className="text-sm">{t("close.closedOnShort", { date: formatDate(p.state!.closedAt) })}</p>
        ) : (
          <>
            {!p.canClose && started && (
              <p className="mb-2 text-xs text-muted-foreground">
                {p.accounts
                  .filter((a) => a.balancePaise !== 0)
                  .map((a) => `${a.name}: ${money.fmt(a.balancePaise)}`)
                  .join(" · ") || t("close.payFirst")}
              </p>
            )}
            {live && (
              <ActionButton
                path={`/orgs/${orgId}/settlement/close`}
                variant={p.canClose ? "destructive" : "outline"}
                successMessage={t("close.isClosed")}
                confirm={{ title: t("close.closeQ", { name: org.name }), description: t("close.closeDesc"), confirmLabel: t("close.closeBtn"), destructive: true }}
              >
                <Lock /> {t("close.closeBtn")}
              </ActionButton>
            )}
          </>
        )}
      </Step>
    </div>
  );
}
