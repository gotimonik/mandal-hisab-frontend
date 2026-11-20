import { api } from "@/lib/server/api";
import { getMoney, getOrg } from "@/lib/server/data";
import { PageHeader } from "@/components/app/page-header";
import { ShareDocument } from "@/components/app/share-document";
import { PrintButton } from "@/components/app/print-button";
import { OrgLogo } from "@/components/app/org-logo";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getT } from "@/i18n/server";
import { HandCoins, Percent, Users, Wallet } from "lucide-react";
import { monthLabelYM } from "@/lib/months";

export const metadata = { title: "Hisab sheet" };

interface Sheet {
  asOf: string;
  mandal: string;
  rows: { memberId: string; membershipNumber: string; name: string; shares: number; savingsPaise: number; haptaDuePaise: number; upadPaise: number; interestDuePaise: number; interestPrevDuePaise: number; interestMonthDuePaise: number; interestPaidMonthPaise: number; pendingPaise: number; sharePaise: number; netPaise: number }[];
  shareTotalPaise: number;
  netTotalPaise: number;
  holders: { accountId: string; name: string; type: string; balancePaise: number }[];
  movements: { date: string; from: string; to: string; amountPaise: number; note: string | null }[];
  totals: { shares: number; savingsPaise: number; haptaDuePaise: number; upadPaise: number; interestDuePaise: number; interestPrevDuePaise: number; interestMonthDuePaise: number; interestPaidMonthPaise: number; pendingPaise: number };
  month: string;
  cashPaise: number;
  totalPaise: number;
  members: number;
  byShares: boolean;
  parts: number;
  eachPaise: number;
}


/** the sheet's one colour: a calm green; red only for money someone still owes */
const GREEN = "#1d6b4a";

/** soft initial circles (dark text on a light tint: AA contrast) */
const AVATAR = ["bg-emerald-100 text-emerald-800", "bg-sky-100 text-sky-800", "bg-amber-100 text-amber-900", "bg-violet-100 text-violet-800", "bg-rose-100 text-rose-800", "bg-teal-100 text-teal-800"];

/** the sheet is drawn this wide when shared, whatever the screen */
const SHEET_WIDTH = 960;

export default async function HisabSheetPage({ params }: PageProps<"/org/[orgId]/members/sheet">) {
  const { orgId } = await params;
  const [org, s, money, { t }] = await Promise.all([getOrg(orgId), api<Sheet>(`/orgs/${orgId}/members-sheet`), getMoney(orgId), getT()]);
  const date = formatDate(s.asOf);
  const monthName = monthLabelYM(s.month);
  const showHapta = s.totals.haptaDuePaise > 0;
  const nil = <span className="text-zinc-400" aria-label="0">—</span>;
  const amount = (p: number, className?: string) => (p ? <span className={cn("whitespace-nowrap tabular-nums", className)}>{money.short(p)}</span> : nil);
  const stats: { value: number; label: string; icon: React.ReactNode; card: string; chip: string; number: string }[] = [
    { value: s.eachPaise, label: s.byShares ? t("sheet.eachShare") : t("sheet.eachMember"), icon: <Users />, card: "bg-emerald-50 ring-emerald-200", chip: "bg-emerald-600 text-white", number: "text-emerald-800" },
    { value: s.cashPaise, label: t("sheet.cash"), icon: <Wallet />, card: "bg-sky-50 ring-sky-200", chip: "bg-sky-600 text-white", number: "text-sky-900" },
    { value: s.totals.upadPaise, label: t("sheet.upad"), icon: <HandCoins />, card: "bg-orange-50 ring-orange-200", chip: "bg-orange-500 text-white", number: "text-orange-900" },
    { value: s.totals.interestDuePaise, label: t("sheet.eqInterest"), icon: <Percent />, card: "bg-rose-50 ring-rose-200", chip: "bg-rose-500 text-white", number: "text-rose-800" },
  ];
  const showCash = s.holders.length > 1 || s.movements.length > 0;
  const td = "px-1.5 py-3 text-center";

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={t("sheet.title")}
        description={t("sheet.desc")}
        actions={
          <div className="no-print flex gap-2">
            <ShareDocument targetId="hisab-sheet" paged pageWidth={SHEET_WIDTH} fileName={`${s.mandal} hisab ${s.asOf.slice(0, 10)}`} title={`${s.mandal} — ${t("sheet.title")}`} text={t("sheet.shareText", { mandal: s.mandal, date })} path={`/org/${orgId}/members/sheet`} />
            <PrintButton />
          </div>
        }
      />
      <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 print:overflow-visible">
        <article id="hisab-sheet" className="w-[960px] max-w-none rounded-3xl bg-white px-8 py-7 text-zinc-900 shadow-card ring-1 ring-zinc-200 md:w-auto md:min-w-[760px] print:w-auto print:min-w-0 print:rounded-none print:p-0 print:shadow-none print:ring-0">
          {/* the Mandal */}
          <header data-row className="-mx-3 -mt-2 mb-5 flex items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-white px-4 py-4 ring-1 ring-emerald-100">
            <div className="flex min-w-0 items-center gap-3.5">
              <OrgLogo logoUrl={org.logoUrl} className="size-14 rounded-full shadow-sm ring-2 ring-white">
                <span className="flex size-14 items-center justify-center rounded-full text-2xl font-bold text-white" style={{ backgroundColor: GREEN }}>
                  {s.mandal.slice(0, 1)}
                </span>
              </OrgLogo>
              <div className="min-w-0">
                <h2 className="truncate text-[26px] leading-tight font-bold" style={{ color: GREEN }}>
                  {s.mandal}
                </h2>
                <p className="text-[15px] text-zinc-500">
                  {t("sheet.title")} · {t("sheet.asOf", { date })}
                </p>
              </div>
            </div>
            <p className="shrink-0 rounded-full bg-white px-3.5 py-1.5 text-[14px] font-medium text-emerald-800 shadow-sm ring-1 ring-emerald-100">{t("sheet.members", { n: s.members, shares: s.totals.shares })}</p>
          </header>

          {/* four numbers, each in its own soft card */}
          <section data-row aria-label={t("sheet.title")} className="grid grid-cols-4 gap-3">
            {stats.map((x) => (
              <div key={x.label} className={cn("rounded-2xl px-4 py-4 ring-1", x.card)}>
                <span aria-hidden className={cn("mb-3 flex size-9 items-center justify-center rounded-xl shadow-sm [&_svg]:size-[18px]", x.chip)}>
                  {x.icon}
                </span>
                <p className={cn("text-[26px] leading-none font-bold tabular-nums", x.number)}>{money.short(x.value)}</p>
                <p className="mt-1.5 text-[14px] text-zinc-600">{x.label}</p>
              </div>
            ))}
          </section>
          <p data-row className="mt-3 text-center text-[14px] text-zinc-600">
            {t("sheet.div", { total: money.short(s.totalPaise), n: s.parts })} = {money.short(s.eachPaise)}
            {showHapta && (
              <>
                {" · "}
                {t("sheet.hapta")} <b className="text-rose-600">{money.short(s.totals.haptaDuePaise)}</b>
              </>
            )}
          </p>

          {/* two boxes: upad interest this month, and who holds the cash */}
          <section data-row className={cn("mt-5 grid gap-3", showCash ? "grid-cols-2" : "grid-cols-1")}>
            <div className="rounded-2xl bg-amber-50/60 px-4 py-3.5 ring-1 ring-amber-200">
              <h3 className="text-[15px] font-bold text-amber-950">
                {t("sheet.intGroup")} <span className="font-medium text-amber-800">· {monthName}</span>
              </h3>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                {[
                  { label: t("sheet.subPrev"), value: s.totals.interestPrevDuePaise, tone: "text-rose-700" },
                  { label: t("sheet.subMonth"), value: s.totals.interestMonthDuePaise, tone: "text-amber-800" },
                  { label: t("sheet.subPaid"), value: s.totals.interestPaidMonthPaise, tone: "text-emerald-700" },
                ].map((x) => (
                  <div key={x.label} className="rounded-xl bg-white px-2 py-2.5 ring-1 ring-amber-100">
                    <dd className={cn("text-[20px] leading-tight font-bold tabular-nums", x.value ? x.tone : "text-zinc-400")}>{money.short(x.value)}</dd>
                    <dt className="mt-1 text-[13px] text-zinc-600">{x.label}</dt>
                  </div>
                ))}
              </dl>
            </div>
            {showCash && (
              <div className="rounded-2xl bg-sky-50/60 px-4 py-3.5 ring-1 ring-sky-200">
                <h3 className="text-[15px] font-bold text-sky-950">{t("sheet.holdersTitle")}</h3>
                <ul className="mt-2 divide-y divide-sky-100 text-[14px]">
                  {s.holders.map((h) => (
                    <li key={h.accountId} className="flex items-center justify-between gap-2 py-1.5">
                      <span className="truncate text-zinc-800">{h.name}</span>
                      <span className="font-semibold text-sky-900 tabular-nums">{money.short(h.balancePaise)}</span>
                    </li>
                  ))}
                  <li className="flex justify-between gap-2 pt-2 font-bold text-sky-950">
                    <span>{t("sheet.holdersTotal")}</span>
                    <span className="tabular-nums">{money.short(s.holders.reduce((a, h) => a + h.balancePaise, 0))}</span>
                  </li>
                </ul>
                {s.movements.some((m) => m.note) && (
                  <ul className="mt-2 space-y-0.5 border-t border-dashed border-sky-200 pt-2 text-[13px] text-zinc-600">
                    {s.movements
                      .filter((m) => m.note)
                      .map((m, i) => (
                        <li key={i}>
                          {formatDate(m.date)} · {m.to} {money.short(m.amountPaise)} — “{m.note}”
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            )}
          </section>

          {/* every member */}
          <div className="mt-6 overflow-hidden rounded-2xl ring-1 ring-emerald-200">
          <table className="w-full table-fixed border-collapse text-[14.5px]">
            <caption className="sr-only">{t("sheet.title")}</caption>
            <colgroup>
              <col className="w-[3rem]" />
              <col className="w-[11.5rem]" />
              <col />
              <col />
              <col />
              <col />
              <col />
              {showHapta && <col />}
              <col className="w-[7.4rem]" />
            </colgroup>
            <thead className="text-[13px] leading-tight">
              <tr data-row className="bg-emerald-50 text-emerald-900">
                <th scope="col" rowSpan={2} className="px-2 py-2.5 text-center font-semibold">{t("sheet.colNo")}</th>
                <th scope="col" rowSpan={2} className="px-2 py-2.5 text-center font-semibold">{t("sheet.colName")}</th>
                <th scope="col" rowSpan={2} className="px-2 py-2.5 text-center font-semibold">{t("sheet.colSavings")}</th>
                <th scope="col" rowSpan={2} className="px-2 py-2.5 text-center font-semibold">{t("sheet.colUpad")}</th>
                <th scope="colgroup" colSpan={3} className="bg-amber-50 px-2 pt-2.5 pb-1 text-center font-bold text-amber-950">{t("sheet.intGroup")}</th>
                {showHapta && <th scope="col" rowSpan={2} className="px-2 py-2.5 text-center font-semibold">{t("sheet.colHapta")}</th>}
                <th scope="col" rowSpan={2} className="px-2 py-2.5 text-center font-semibold">{t("sheet.colNet")}</th>
              </tr>
              <tr className="bg-amber-50 text-amber-900">
                <th scope="col" className="px-1.5 pb-2.5 text-center font-medium">{t("sheet.subPrev")}</th>
                <th scope="col" className="px-1.5 pb-2.5 text-center font-medium">{t("sheet.subMonth")}</th>
                <th scope="col" className="px-1.5 pb-2.5 text-center font-medium">{t("sheet.subPaid")}</th>
              </tr>
            </thead>
            <tbody>
              {s.rows.length === 0 && (
                <tr data-row>
                  <td colSpan={showHapta ? 9 : 8} className="py-8 text-center text-zinc-500">
                    {t("sheet.none")}
                  </td>
                </tr>
              )}
              {s.rows.map((r, i) => {
                return (
                  <tr key={r.memberId} data-row className={cn("border-t border-zinc-100", i % 2 === 1 && "bg-zinc-50/60")}>
                    <td className={cn(td, "text-[13px] text-zinc-500 tabular-nums")}>{r.membershipNumber.replace(/^M0*/, "")}</td>
                    <th scope="row" className={cn(td, "font-semibold")}>
                      <span className="inline-flex max-w-full items-center gap-2">
                        <span aria-hidden className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold", AVATAR[i % AVATAR.length])}>{r.name.slice(0, 1)}</span>
                        <span className="truncate">{r.name}</span>
                        {r.shares > 1 && <span className="shrink-0 rounded-md bg-violet-100 px-1.5 text-[13px] font-semibold text-violet-800">{t("sheet.sharesX", { n: r.shares })}</span>}
                      </span>
                    </th>
                    <td className={td}>{amount(r.savingsPaise)}</td>
                    <td className={td}>{r.upadPaise ? <span className="rounded-lg bg-orange-50 px-2 py-0.5 font-semibold whitespace-nowrap text-orange-800 tabular-nums ring-1 ring-orange-200">{money.short(r.upadPaise)}</span> : nil}</td>
                    <td className={cn(td, "bg-amber-50/30")}>{r.interestPrevDuePaise ? <span className="rounded-lg px-1.5 py-0.5 font-semibold whitespace-nowrap tabular-nums ring-1 bg-rose-50 text-rose-700 ring-rose-200">{money.short(r.interestPrevDuePaise)}</span> : nil}</td>
                    <td className={cn(td, "bg-amber-50/30")}>{r.interestMonthDuePaise ? <span className="rounded-lg px-1.5 py-0.5 font-semibold whitespace-nowrap tabular-nums ring-1 bg-amber-50 text-amber-800 ring-amber-200">{money.short(r.interestMonthDuePaise)}</span> : nil}</td>
                    <td className={cn(td, "bg-amber-50/30")}>{r.interestPaidMonthPaise ? <span className="rounded-lg px-1.5 py-0.5 font-semibold whitespace-nowrap tabular-nums ring-1 bg-emerald-50 text-emerald-800 ring-emerald-200">{money.short(r.interestPaidMonthPaise)}</span> : nil}</td>
                    {showHapta && <td className={td}>{amount(r.haptaDuePaise, "font-semibold text-rose-600")}</td>}
                    <td className={td}>
                      <span className={cn("inline-block rounded-full px-3 py-1 text-[14.5px] font-bold whitespace-nowrap tabular-nums", r.netPaise < 0 ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-900")}>{money.short(r.netPaise)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr data-row className="bg-emerald-50 text-[15px] font-bold text-emerald-950">
                <td className={td} />
                <td className={td}>{t("sheet.total")}</td>
                <td className={cn(td, "tabular-nums")}>{money.short(s.totals.savingsPaise)}</td>
                <td className={cn(td, "tabular-nums")}>{money.short(s.totals.upadPaise)}</td>
                <td className={cn(td, "tabular-nums text-rose-700")}>{money.short(s.totals.interestPrevDuePaise)}</td>
                <td className={cn(td, "tabular-nums text-amber-800")}>{money.short(s.totals.interestMonthDuePaise)}</td>
                <td className={cn(td, "tabular-nums text-emerald-800")}>{money.short(s.totals.interestPaidMonthPaise)}</td>
                {showHapta && <td className={cn(td, "tabular-nums text-rose-600")}>{money.short(s.totals.haptaDuePaise)}</td>}
                <td className={cn(td, "tabular-nums")}>{money.short(s.netTotalPaise)}</td>
              </tr>
            </tfoot>
          </table>
          </div>

          <footer data-row className="mt-5 flex items-center justify-between gap-3 text-[13px] text-zinc-600">
            <span>
              {t("sheet.legendNet")} · <span className="text-rose-700">{t("sheet.legendRed")}</span>
            </span>
            <span className="font-semibold" style={{ color: GREEN }}>
              MandalHisab
            </span>
          </footer>
        </article>
      </div>
    </div>
  );
}
