import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { api, qs } from "@/lib/server/api";
import { requestToday } from "@/lib/server/today";
import { Money } from "@/components/app/money";
import { EmptyState } from "@/components/app/empty-state";
import { IconChip, SectionTitle } from "@/components/app/bits";
import { ActionButton } from "@/components/app/action-button";
import { Pagination } from "@/components/app/pagination";
import { getT } from "@/i18n/server";
import { formatINR } from "@/lib/format";
import { CategoryDialog } from "@/features/personal/manage-dialogs";
import { AddEntryTiles, EntryRow } from "@/features/personal/entry-dialog";
import { CategoryIcon } from "@/features/personal/icons";
import { MonthsChart } from "@/features/personal/charts";
import { BudgetBar, Card, monthsBack } from "@/features/personal/server-bits";
import { categoryName, type EntryList, type PCategory, type PWallet, type Summary } from "@/features/personal/types";

export const metadata = { title: "Personal Hisab · Category" };

export default async function PersonalCategoryPage({ params, searchParams }: PageProps<"/personal/categories/[categoryId]">) {
  const { categoryId } = await params;
  if (!/^[a-f0-9]{24}$/.test(categoryId)) notFound();
  const sp = await searchParams;
  const page = Math.max(1, Number(typeof sp.page === "string" ? sp.page : 1) || 1);
  const today = await requestToday();
  const [{ categories }, w, six, list, { t }] = await Promise.all([
    api<{ categories: PCategory[] }>("/me/personal/categories"),
    api<{ wallets: PWallet[] }>("/me/personal/wallets"),
    api<Summary>(`/me/personal/summary${qs({ from: monthsBack(today, 5), to: today, categoryId })}`),
    api<EntryList>(`/me/personal/entries${qs({ categoryId, page, pageSize: 30 })}`),
    getT(),
  ]);
  const c = categories.find((x) => x._id === categoryId);
  if (!c) notFound();
  const book = { wallets: w.wallets, categories };
  const thisMonth = six.months.find((m) => m.month === today.slice(0, 7));
  const monthTotal = c.kind === "expense" ? (thisMonth?.expensePaise ?? 0) : (thisMonth?.incomePaise ?? 0);
  const sixTotal = c.kind === "expense" ? six.totals.expensePaise : six.totals.incomePaise;

  return (
    <>
      <Link href="/personal/categories" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {t("ph.tabs.categories")}
      </Link>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <IconChip tone={c.tone} size="lg">
          <CategoryIcon category={c} />
        </IconChip>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold tracking-tight">{categoryName(t, c)}</h1>
          <p className="text-sm text-muted-foreground">
            {c.kind === "expense" ? t("ph.catPage.kindExpense") : t("ph.catPage.kindIncome")}
            {c.isArchived && ` · ${t("ph.settings.hidden")}`}
          </p>
        </div>
        <div className="flex w-full flex-wrap gap-1.5 sm:w-auto">
          <CategoryDialog category={c} label={t("ph.edit")} />
          <ActionButton path={`/me/personal/categories/${c._id}`} method="PATCH" body={{ isArchived: !c.isArchived }} successMessage={t("ph.settings.saved")}>
            {c.isArchived ? t("ph.settings.show") : t("ph.settings.hide")}
          </ActionButton>
          <ActionButton path={`/me/personal/categories/${c._id}`} method="DELETE" className="text-destructive" redirectTo="/personal/categories" successMessage={t("ph.settings.removed")} confirm={{ title: t("ph.settings.removeCategoryTitle"), description: t("ph.settings.removeDesc"), destructive: true, confirmLabel: t("ph.settings.remove") }}>
            {t("ph.settings.remove")}
          </ActionButton>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <Card className="p-3.5 sm:p-4">
          <p className="text-xs text-muted-foreground">{t("ph.thisMonth")}</p>
          <Money paise={monthTotal} className="text-xl font-bold" />
        </Card>
        <Card className="p-3.5 sm:p-4">
          <p className="text-xs text-muted-foreground">{t("ph.catPage.last6")}</p>
          <Money paise={sixTotal} className="text-xl font-bold" />
          <p className="text-[11px] text-muted-foreground">{t("ph.catPage.avg", { amount: formatINR(Math.round(sixTotal / 6)) })}</p>
        </Card>
      </div>

      {c.kind === "expense" && (
        <Card className="mb-4">
          {c.monthlyBudgetPaise ? (
            <BudgetBar label={t("ph.budget.title")} spent={monthTotal} budget={c.monthlyBudgetPaise} t={t} />
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">{t("ph.catPage.noBudget")}</p>
              <CategoryDialog category={c} label={t("ph.budgetsPage.setOne")} />
            </div>
          )}
        </Card>
      )}

      {six.months.length > 0 && (
        <Card className="mb-4">
          <SectionTitle>{t("ph.catPage.last6")}</SectionTitle>
          <MonthsChart months={six.months} only={c.kind} />
        </Card>
      )}

      {!c.isArchived && <AddEntryTiles book={book} compact only={[c.kind]} defaults={{ categoryId: c._id }} className="mb-4" />}

      <Card>
        <SectionTitle>{t("ph.catPage.entries")}</SectionTitle>
        {list.items.length === 0 ? (
          <EmptyState title={t("ph.catPage.none")} />
        ) : (
          <div className="-mx-2 flex flex-col">
            {list.items.map((e) => (
              <EntryRow key={e._id} entry={e} book={book} showDate />
            ))}
          </div>
        )}
      </Card>
      <Pagination page={list.page} pageSize={list.pageSize} total={list.total} baseHref={`/personal/categories/${c._id}`} params={{}} />
    </>
  );
}
