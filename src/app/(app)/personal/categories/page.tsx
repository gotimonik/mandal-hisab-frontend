import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { api, qs } from "@/lib/server/api";
import { requestToday } from "@/lib/server/today";
import { PageHeader } from "@/components/app/page-header";
import { Money } from "@/components/app/money";
import { IconChip, ProgressBar, SectionTitle } from "@/components/app/bits";
import { getT } from "@/i18n/server";
import { monthName } from "@/i18n/core";
import { cn } from "@/lib/utils";
import { CategoryDialog, DefaultBadge } from "@/features/personal/manage-dialogs";
import { CategoryIcon } from "@/features/personal/icons";
import { thisMonthRange } from "@/features/personal/server-bits";
import { categoryName, type PCategory, type Summary } from "@/features/personal/types";
import type { T } from "@/i18n/core";

export const metadata = { title: "Personal Hisab · Categories" };

function CategoryTile({ c, total, t }: { c: PCategory; total: number; t: T }) {
  const budget = c.kind === "expense" ? c.monthlyBudgetPaise : null;
  const pct = budget ? (total / budget) * 100 : 0;
  return (
    <Link href={`/personal/categories/${c._id}`} className={cn("flex flex-col gap-2 rounded-2xl bg-card p-3.5 shadow-card ring-1 ring-foreground/[0.06] transition-[background-color,transform] hover:bg-muted/50 active:scale-[0.98]", c.isArchived && "opacity-60")}>
      <span className="flex items-start justify-between gap-2">
        <IconChip tone={c.tone} size="lg">
          <CategoryIcon category={c} />
        </IconChip>
        <ChevronRight className="size-4 text-muted-foreground" />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-bold">{categoryName(t, c)}</span>
          {c.isDefault && <DefaultBadge label={t("ph.def.badge")} />}
        </span>
        <Money paise={total} className={cn("text-base font-bold", c.kind === "income" && total > 0 && "text-success")} />
      </span>
      {budget ? <ProgressBar value={pct} className="h-1.5" barClassName={pct > 100 ? "bg-destructive" : pct >= 80 ? "bg-amber-500" : "bg-emerald-500"} label={categoryName(t, c)} /> : null}
    </Link>
  );
}

export default async function PersonalCategoriesPage() {
  const today = await requestToday();
  const [{ categories }, month, { t, lang }] = await Promise.all([api<{ categories: PCategory[] }>("/me/personal/categories"), api<Summary>(`/me/personal/summary${qs(thisMonthRange(today))}`), getT()]);
  const totals = new Map([...month.spending, ...month.income].filter((r) => r.category).map((r) => [r.category!._id, r.totalPaise]));
  const group = (kind: "expense" | "income") =>
    categories
      .filter((c) => c.kind === kind && !c.isArchived)
      .sort((a, b) => (totals.get(b._id) ?? 0) - (totals.get(a._id) ?? 0));
  const hidden = categories.filter((c) => c.isArchived);
  const grid = (rows: PCategory[]) => (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {rows.map((c) => (
        <CategoryTile key={c._id} c={c} total={totals.get(c._id) ?? 0} t={t} />
      ))}
    </div>
  );
  return (
    <>
      <PageHeader title={t("ph.tabs.categories")} description={t("ph.catPage.desc", { month: monthName(lang, today.slice(0, 7)) })} />
      <section className="mb-6">
        <SectionTitle action={<CategoryDialog kind="expense" />}>{t("ph.settings.spending")}</SectionTitle>
        {grid(group("expense"))}
      </section>
      <section className="mb-6">
        <SectionTitle action={<CategoryDialog kind="income" />}>{t("ph.settings.income")}</SectionTitle>
        {grid(group("income"))}
      </section>
      {hidden.length > 0 && (
        <section>
          <SectionTitle>{t("ph.catPage.hiddenTitle")}</SectionTitle>
          {grid(hidden)}
        </section>
      )}
    </>
  );
}
