import Link from "next/link";
import { Building2, ChevronLeft, ChevronRight, NotebookPen, PiggyBank, Target } from "lucide-react";
import { api, qs } from "@/lib/server/api";
import { PageHeader } from "@/components/app/page-header";
import { SummaryBand } from "@/components/app/summary-band";
import { Money } from "@/components/app/money";
import { EmptyState } from "@/components/app/empty-state";
import { IconChip, ProgressBar, SectionTitle } from "@/components/app/bits";
import { buttonVariants } from "@/components/ui/button";
import { getT } from "@/i18n/server";
import { monthName } from "@/i18n/core";
import { TONE_SOLID } from "@/lib/tones";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AddEntryTiles, EntryRow } from "@/features/personal/entry-dialog";
import { DailyChart } from "@/features/personal/charts";
import { categoryName, walletName, type CategoryTotal, type Overview, type PCategory, type PWallet } from "@/features/personal/types";
import { CategoryIcon, WALLET_TONE, WalletIcon } from "@/features/personal/icons";
import { SectionTiles } from "@/features/personal/personal-nav";
import { BudgetBar, Card } from "@/features/personal/server-bits";
import { ReminderCard } from "@/features/personal/reminders";
import type { MandalSync, ReminderList } from "@/features/personal/types";
import type { T } from "@/i18n/core";

export const metadata = { title: "Personal Hisab" };

const shiftMonth = (ym: string, n: number) => {
  const d = new Date(Date.UTC(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1 + n, 1));
  return d.toISOString().slice(0, 7);
};

/** Spending (or income) by category, biggest first, as bars. */
function CategoryBars({ rows, total, t, empty }: { rows: CategoryTotal[]; total: number; t: T; empty: string }) {
  if (!rows.length) return <p className="py-2 text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((r, i) => {
        const pct = total ? Math.round((r.totalPaise / total) * 100) : 0;
        return (
          <li key={r.category?._id ?? i}>
            <Link href={r.category ? `/personal/categories/${r.category._id}` : "/personal/categories"} className="-mx-1.5 block rounded-xl px-1.5 py-1 hover:bg-muted/50">
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
              <span className="flex min-w-0 items-center gap-2 font-medium">
                <IconChip tone={r.category?.tone ?? "slate"} size="sm" className="size-7 rounded-lg [&_svg]:size-3.5">
                  <CategoryIcon category={r.category} />
                </IconChip>
                <span className="truncate">{categoryName(t, r.category)}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{pct}%</span>
              </span>
              <Money paise={r.totalPaise} className="font-semibold" />
            </div>
            <ProgressBar value={pct} className="h-2" barClassName={TONE_SOLID[r.category?.tone ?? "slate"].split(" ")[0]} label={categoryName(t, r.category)} />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default async function PersonalPage({ searchParams }: PageProps<"/personal">) {
  const sp = await searchParams;
  const month = typeof sp.month === "string" && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : undefined;
  // wallets and categories include hidden ones, so an old entry that uses one can still be edited
  const [o, w, c, rem, sync, { t, lang }] = await Promise.all([api<Overview>(`/me/personal/overview${qs({ month })}`), api<{ wallets: PWallet[] }>("/me/personal/wallets"), api<{ categories: PCategory[] }>("/me/personal/categories"), api<ReminderList>("/me/personal/reminders"), api<MandalSync>("/me/personal/mandal-sync").catch(() => null), getT()]);
  const comingUp = rem.reminders.filter((r) => r.status === "overdue" || r.status === "today" || r.status === "soon").slice(0, 4);
  const book = { wallets: w.wallets, categories: c.categories };
  const m = o.monthTotals;
  const isThisMonth = o.month === o.today.slice(0, 7);
  const nothingYet = o.recent.length === 0;

  return (
    <>
      <PageHeader title={t("ph.title")} description={t("ph.desc")} />

      <SummaryBand
        tone="green"
        icon={<PiggyBank />}
        label={t("ph.totalBalance")}
        value={<Money paise={o.totalBalancePaise} />}
        sub={t("ph.balanceToday")}
        statsLabel={isThisMonth ? t("ph.monthOnlyThis", { month: monthName(lang, o.month) }) : t("ph.monthOnly", { month: monthName(lang, o.month) })}
        statsNote={t("ph.monthOnlyNote", { month: monthName(lang, o.month) })}
        stats={[
          { label: t("ph.moneyIn"), value: <Money paise={m.incomePaise} short /> },
          { label: t("ph.spent"), value: <Money paise={m.expensePaise} short /> },
          { label: m.netPaise < 0 ? t("ph.overspent") : t("ph.saved"), value: <Money paise={m.netPaise} short /> },
        ]}
      />

      <AddEntryTiles book={book} openType={typeof sp.add === "string" ? sp.add : undefined} />

      <div className="mb-5">
        <SectionTiles
          stats={{
            wallets: formatINR(o.totalBalancePaise, { decimals: false }),
            categories: t("ph.sections.categoriesStat", { n: c.categories.filter((k) => !k.isArchived).length }),
            reminders: comingUp.length ? t("ph.rem.comingStat", { n: comingUp.length }) : undefined,
            budgets: o.overallBudget ? t("ph.budget.left", { amount: formatINR(Math.max(0, o.overallBudget.budgetPaise - o.overallBudget.spentPaise), { decimals: false }) }) : undefined,
            report: m.netPaise >= 0 ? `${t("ph.saved")} ${formatINR(m.netPaise, { decimals: false })}` : undefined,
          }}
        />
      </div>

      {sync && !sync.enabled && sync.mandals.some((x) => x.supported) && (
        <Link href="/personal/wallets#mandal" className="mb-5 flex items-center gap-3 rounded-2xl bg-violet-500/8 p-3.5 ring-1 ring-violet-500/20 transition-colors hover:bg-violet-500/12">
          <IconChip tone="violet" size="sm">
            <Building2 />
          </IconChip>
          <span className="min-w-0 flex-1 text-sm">
            <b>{t("ph.mandal.nudgeTitle")}</b>
            <span className="block text-xs text-muted-foreground">{t("ph.mandal.nudgeDesc")}</span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </Link>
      )}

      {comingUp.length > 0 && (
        <section className="mb-5" aria-label={t("ph.rem.comingUp")}>
          <SectionTitle action={<Link href="/personal/reminders" className="text-xs font-semibold text-primary hover:underline">{t("ph.seeAll")}</Link>}>{t("ph.rem.comingUp")}</SectionTitle>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {comingUp.map((r) => (
              <Link key={r._id} href="/personal/reminders" className="block rounded-2xl transition-transform active:scale-[0.99]">
                <ReminderCard r={r} categories={c.categories} wallets={w.wallets} compact />
              </Link>
            ))}
          </div>
        </section>
      )}

      {nothingYet ? (
        <EmptyState icon={<NotebookPen />} title={t("ph.emptyTitle")} description={t("ph.emptyDesc")} />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* month switcher + today */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between gap-2">
              <Link href={`/personal?month=${shiftMonth(o.month, -1)}`} aria-label={t("ph.prevMonth")} className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
                <ChevronLeft />
              </Link>
              <div className="text-center">
                <p className="font-bold">{monthName(lang, o.month)}</p>
                {m.previousExpensePaise > 0 && <p className="text-xs text-muted-foreground">{t("ph.lastMonthSpent", { amount: formatINR(m.previousExpensePaise) })}</p>}
              </div>
              {isThisMonth ? (
                <span className="size-9" />
              ) : (
                <Link href={`/personal?month=${shiftMonth(o.month, 1)}`} aria-label={t("ph.nextMonth")} className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
                  <ChevronRight />
                </Link>
              )}
            </div>
            {isThisMonth && (
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl bg-rose-500/8 px-3 py-2 ring-1 ring-rose-500/15">
                  <p className="text-xs text-muted-foreground">{t("ph.todaySpent")}</p>
                  <Money paise={o.todayTotals.expensePaise} className="text-base font-bold" />
                </div>
                <div className="rounded-xl bg-emerald-500/8 px-3 py-2 ring-1 ring-emerald-500/15">
                  <p className="text-xs text-muted-foreground">{t("ph.todayReceived")}</p>
                  <Money paise={o.todayTotals.incomePaise} className="text-base font-bold text-success" />
                </div>
              </div>
            )}
            {m.expensePaise > 0 && (
              <div className="mt-4">
                <p className="mb-1 text-xs font-semibold text-muted-foreground">{t("ph.daily")}</p>
                <DailyChart days={o.days} />
              </div>
            )}
          </Card>

          {/* budgets */}
          {(o.overallBudget || o.budgets.length > 0) && (
            <Card>
              <SectionTitle action={<Link href="/personal/budgets" className="text-xs font-semibold text-primary hover:underline">{t("ph.manage")}</Link>}>
                <span className="flex items-center gap-2">
                  <Target className="size-4 text-primary" /> {t("ph.budget.title")}
                </span>
              </SectionTitle>
              <ul className="flex flex-col gap-3">
                {o.overallBudget && (
                  <li>
                    <BudgetBar label={t("ph.budget.overall")} spent={o.overallBudget.spentPaise} budget={o.overallBudget.budgetPaise} t={t} />
                  </li>
                )}
                {o.budgets.map((b) => (
                  <li key={b.category._id}>
                    <BudgetBar label={categoryName(t, b.category)} spent={b.spentPaise} budget={b.budgetPaise} t={t} />
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card>
            <SectionTitle action={<Link href="/personal/categories" className="text-xs font-semibold text-primary hover:underline">{t("ph.seeAll")}</Link>}>{t("ph.spendingBy")}</SectionTitle>
            <CategoryBars rows={o.spending} total={m.expensePaise} t={t} empty={t("ph.noSpending")} />
          </Card>

          {o.income.length > 0 && (
            <Card>
              <SectionTitle>{t("ph.incomeBy")}</SectionTitle>
              <CategoryBars rows={o.income} total={m.incomePaise} t={t} empty={t("ph.noIncome")} />
            </Card>
          )}

          {/* wallets */}
          <Card>
            <SectionTitle action={<Link href="/personal/wallets" className="text-xs font-semibold text-primary hover:underline">{t("ph.manage")}</Link>}>{t("ph.wallets")}</SectionTitle>
            <ul className="flex flex-col gap-1">
              {o.wallets.map((w) => (
                <li key={w._id}>
                  <Link href={`/personal/wallets/${w._id}`} className={cn("flex items-center gap-3 rounded-xl px-1 py-1.5 hover:bg-muted/50", w.isArchived && "opacity-60")}>
                    <IconChip tone={WALLET_TONE[w.kind]} size="sm">
                      <WalletIcon kind={w.kind} />
                    </IconChip>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{walletName(t, w)}</span>
                    <Money paise={w.balancePaise} colored={w.balancePaise < 0} className="text-sm font-semibold" />
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
            {!o.overallBudget && o.budgets.length === 0 && (
              <Link href="/personal/budgets" className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                <Target className="size-3.5" /> {t("ph.budget.setOne")}
              </Link>
            )}
          </Card>

          {/* recent */}
          <Card className="lg:col-span-2">
            <SectionTitle action={<Link href="/personal/entries" className="text-xs font-semibold text-primary hover:underline">{t("ph.seeAll")}</Link>}>{t("ph.recent")}</SectionTitle>
            <div className="-mx-2 flex flex-col">
              {o.recent.map((e) => (
                <EntryRow key={e._id} entry={e} book={book} showDate />
              ))}
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
