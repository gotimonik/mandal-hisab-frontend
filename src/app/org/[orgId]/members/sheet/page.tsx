import { api } from "@/lib/server/api";
import { getMoney, getOrg } from "@/lib/server/data";
import { PageHeader } from "@/components/app/page-header";
import { ShareDocument } from "@/components/app/share-document";
import { PrintButton } from "@/components/app/print-button";
import { OrgLogo } from "@/components/app/org-logo";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getT } from "@/i18n/server";

export const metadata = { title: "Hisab sheet" };

interface Sheet {
  asOf: string;
  mandal: string;
  rows: { memberId: string; membershipNumber: string; name: string; shares: number; savingsPaise: number; haptaDuePaise: number; upadPaise: number; interestDuePaise: number; pendingPaise: number; sharePaise: number; netPaise: number }[];
  shareTotalPaise: number;
  netTotalPaise: number;
  holders: { accountId: string; name: string; type: string; balancePaise: number }[];
  movements: { date: string; from: string; to: string; amountPaise: number; note: string | null }[];
  totals: { shares: number; savingsPaise: number; haptaDuePaise: number; upadPaise: number; interestDuePaise: number; pendingPaise: number };
  cashPaise: number;
  totalPaise: number;
  members: number;
  byShares: boolean;
  parts: number;
  eachPaise: number;
}

// No. · Name · Shares · Savings · Upad · Interest due · Hapta due · Share · Net
const COLS = "grid grid-cols-[2.9rem_minmax(6.5rem,1fr)_2.3rem_repeat(6,minmax(4.3rem,auto))] items-center gap-x-1.5";

export default async function HisabSheetPage({ params }: PageProps<"/org/[orgId]/members/sheet">) {
  const { orgId } = await params;
  const [org, s, money, { t }] = await Promise.all([getOrg(orgId), api<Sheet>(`/orgs/${orgId}/members-sheet`), getMoney(orgId), getT()]);
  const amt = (p: number, strong = false) => (p ? <span className={cn("tabular-nums", strong && "font-semibold")}>{money.short(p)}</span> : <span className="text-zinc-400">—</span>);
  const date = formatDate(s.asOf);
  const summary: [string, number, string][] = [
    [t("sheet.cash"), s.cashPaise, "bg-emerald-50"],
    [t("sheet.upad"), s.totals.upadPaise, "bg-orange-50"],
    [t("sheet.hapta"), s.totals.haptaDuePaise, "bg-indigo-50"],
    [t("sheet.interest"), s.totals.interestDuePaise, "bg-amber-50"],
  ];

  return (
    <div className="max-w-5xl">
      <PageHeader
        title={t("sheet.title")}
        description={t("sheet.desc")}
        actions={
          <div className="no-print flex gap-2">
            <ShareDocument targetId="hisab-sheet" paged fileName={`${s.mandal} hisab ${s.asOf.slice(0, 10)}`} title={`${s.mandal} — ${t("sheet.title")}`} text={t("sheet.shareText", { mandal: s.mandal, date })} path={`/org/${orgId}/members/sheet`} />
            <PrintButton />
          </div>
        }
      />
      <div className="overflow-x-auto print:overflow-visible">
        <article id="hisab-sheet" className="@container min-w-[720px] rounded-2xl bg-white p-4 text-zinc-900 ring-1 ring-zinc-200 print:min-w-0 print:rounded-none print:p-0 print:ring-0 sm:p-6 [&_*]:border-zinc-200">
          <header data-row className="flex items-start justify-between gap-3 border-b pb-3">
            <div className="flex items-center gap-3">
              <OrgLogo logoUrl={org.logoUrl} className="size-10 rounded-lg">
                {null}
              </OrgLogo>
              <div>
                <h2 className="text-lg font-bold">{s.mandal}</h2>
                <p className="text-sm text-zinc-600">{t("sheet.title")} · {t("sheet.asOf", { date })}</p>
              </div>
            </div>
            <p className="text-right text-xs text-zinc-600">{t("sheet.members", { n: s.members, shares: s.totals.shares })}</p>
          </header>

          <div data-row className="grid grid-cols-[1fr_auto] gap-3 py-3">
            <dl className="grid grid-cols-2 gap-2 text-sm">
              {summary.map(([label, p, bg]) => (
                <div key={label} className={cn("rounded-lg px-3 py-2", bg)}>
                  <dt className="text-xs text-zinc-600">{label}</dt>
                  <dd className="font-semibold tabular-nums">{money.fmt(p)}</dd>
                </div>
              ))}
              <div className="col-span-2 flex items-center justify-between rounded-lg bg-zinc-100 px-3 py-2">
                <dt className="text-xs font-semibold text-zinc-700">{t("sheet.grand")}</dt>
                <dd className="font-bold tabular-nums">{money.fmt(s.totalPaise)}</dd>
              </div>
            </dl>
            <div className="flex min-w-44 flex-col justify-center rounded-xl bg-emerald-700 px-4 py-3 text-white">
              <p className="text-xs text-white/85">{s.byShares ? t("sheet.eachShare") : t("sheet.eachMember")}</p>
              <p className="text-2xl font-extrabold tabular-nums">{money.short(s.eachPaise)}</p>
              <p className="text-xs text-white/85">{t("sheet.div", { total: money.short(s.totalPaise), n: s.parts })}</p>
            </div>
          </div>

          {(s.holders.length > 1 || s.movements.length > 0) && (
            <div data-row className="mb-3 grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 text-xs">
              <section className="rounded-lg border p-2.5">
                <h3 className="mb-1.5 font-semibold text-zinc-700">{t("sheet.holdersTitle")}</h3>
                <ul className="divide-y">
                  {s.holders.map((h) => (
                    <li key={h.accountId} className="flex justify-between gap-2 py-1">
                      <span className="truncate">{h.name}</span>
                      <span className="tabular-nums font-medium">{money.fmt(h.balancePaise)}</span>
                    </li>
                  ))}
                  <li className="flex justify-between gap-2 pt-1.5 font-bold">
                    <span>{t("sheet.holdersTotal")}</span>
                    <span className="tabular-nums">{money.fmt(s.holders.reduce((a, h) => a + h.balancePaise, 0))}</span>
                  </li>
                </ul>
              </section>
              {s.movements.length > 0 && (
                <section className="rounded-lg border p-2.5">
                  <h3 className="mb-1.5 font-semibold text-zinc-700">{t("sheet.movesTitle")}</h3>
                  <ul className="divide-y">
                    {s.movements.map((mv, i) => (
                      <li key={i} className="py-1">
                        <span className="flex justify-between gap-2">
                          <span className="min-w-0 truncate">
                            <span className="text-zinc-500">{formatDate(mv.date)}</span> · {mv.from} → <b>{mv.to}</b>
                          </span>
                          <span className="tabular-nums font-medium">{money.fmt(mv.amountPaise)}</span>
                        </span>
                        {mv.note && <span className="block text-[11px] text-zinc-600">“{mv.note}”</span>}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}

          <div data-row className={cn(COLS, "border-y bg-zinc-50 px-1 py-1.5 text-[11px] font-semibold text-zinc-600")}>
            <span>{t("sheet.colNo")}</span>
            <span>{t("sheet.colName")}</span>
            <span className="text-right">{t("sheet.colShares")}</span>
            <span className="text-right">{t("sheet.colSavings")}</span>
            <span className="text-right">{t("sheet.colUpad")}</span>
            <span className="text-right">{t("sheet.colInterest")}</span>
            <span className="text-right">{t("sheet.colHapta")}</span>
            <span className="text-right">{t("sheet.colShare")}</span>
            <span className="text-right">{t("sheet.colNet")}</span>
          </div>
          {s.rows.length === 0 && (
            <p data-row className="border-b px-1 py-4 text-center text-zinc-500">
              {t("sheet.none")}
            </p>
          )}
          {s.rows.map((r, i) => (
            <div key={r.memberId} data-row className={cn(COLS, "border-b px-1 py-1.5 text-xs", i % 2 === 1 && "bg-zinc-50/60")}>
              <span className="font-mono text-[11px] text-zinc-500">{r.membershipNumber}</span>
              <span className="truncate font-medium">{r.name}</span>
              <span className="text-right tabular-nums">{r.shares}</span>
              <span className="text-right">{amt(r.savingsPaise)}</span>
              <span className="text-right text-orange-700">{amt(r.upadPaise)}</span>
              <span className="text-right text-amber-700">{amt(r.interestDuePaise)}</span>
              <span className={cn("text-right", r.haptaDuePaise > 0 && "text-rose-700")}>{amt(r.haptaDuePaise)}</span>
              <span className="text-right text-emerald-800">{amt(r.sharePaise)}</span>
              <span className={cn("text-right", r.netPaise < 0 && "text-rose-700")}>{amt(r.netPaise, true)}</span>
            </div>
          ))}
          <div data-row className={cn(COLS, "border-b-2 bg-zinc-100 px-1 py-2 text-xs font-bold")}>
            <span />
            <span>{t("sheet.total")}</span>
            <span className="text-right tabular-nums">{s.totals.shares}</span>
            <span className="text-right">{amt(s.totals.savingsPaise)}</span>
            <span className="text-right">{amt(s.totals.upadPaise)}</span>
            <span className="text-right">{amt(s.totals.interestDuePaise)}</span>
            <span className="text-right">{amt(s.totals.haptaDuePaise)}</span>
            <span className="text-right">{amt(s.shareTotalPaise)}</span>
            <span className="text-right">{amt(s.netTotalPaise)}</span>
          </div>
          <p data-row className="mt-2 text-[11px] text-zinc-500">
            {t("sheet.netNote")} · MandalHisab
          </p>
        </article>
      </div>
    </div>
  );
}
