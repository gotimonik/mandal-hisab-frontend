import Link from "next/link";
import { Target } from "lucide-react";
import { api } from "@/lib/server/api";
import { PageHeader } from "@/components/app/page-header";
import { IconChip, SectionTitle } from "@/components/app/bits";
import { Money } from "@/components/app/money";
import { getT } from "@/i18n/server";
import { monthName } from "@/i18n/core";
import { cn } from "@/lib/utils";
import { BudgetAlertsToggle, CategoryDialog, OverallBudgetForm } from "@/features/personal/manage-dialogs";
import { CategoryIcon } from "@/features/personal/icons";
import { BudgetBar, Card } from "@/features/personal/server-bits";
import { categoryName, type Overview, type PCategory } from "@/features/personal/types";

export const metadata = { title: "Personal Hisab · Budgets" };

export default async function PersonalBudgetsPage() {
  const [o, c, { t, lang }] = await Promise.all([api<Overview>("/me/personal/overview"), api<{ categories: PCategory[]; monthlyBudgetPaise: number | null; budgetAlerts: boolean }>("/me/personal/categories"), getT()]);
  const spent = new Map(o.spending.filter((r) => r.category).map((r) => [r.category!._id, r.totalPaise]));
  const cats = c.categories.filter((k) => k.kind === "expense" && !k.isArchived);
  const withBudget = cats.filter((k) => k.monthlyBudgetPaise);
  const without = cats.filter((k) => !k.monthlyBudgetPaise);

  return (
    <>
      <PageHeader title={t("ph.tabs.budgets")} description={t("ph.budgetsPage.desc", { month: monthName(lang, o.month) })} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card id="overall">
          <div className="mb-3 flex items-start gap-3">
            <IconChip tone="rose">
              <Target />
            </IconChip>
            <div className="min-w-0">
              <h2 className="font-semibold">{t("ph.settings.overall")}</h2>
              <p className="text-sm text-muted-foreground">{t("ph.settings.overallDesc")}</p>
            </div>
          </div>
          {o.overallBudget && (
            <div className="mb-4">
              <BudgetBar label={monthName(lang, o.month)} spent={o.overallBudget.spentPaise} budget={o.overallBudget.budgetPaise} t={t} />
            </div>
          )}
          <OverallBudgetForm budgetPaise={c.monthlyBudgetPaise} />
          <div className="mt-4">
            <BudgetAlertsToggle on={c.budgetAlerts} />
          </div>
        </Card>

        <Card>
          <SectionTitle>{t("ph.budgetsPage.categoryBudgets")}</SectionTitle>
          {withBudget.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("ph.budgetsPage.noneYet")}</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {withBudget.map((k) => (
                <li key={k._id} className="flex items-start gap-2">
                  <Link href={`/personal/categories/${k._id}`} className="min-w-0 flex-1 rounded-xl hover:bg-muted/40">
                    <BudgetBar
                      label={categoryName(t, k)}
                      icon={
                        <IconChip tone={k.tone} size="sm" className="size-7">
                          <CategoryIcon category={k} />
                        </IconChip>
                      }
                      spent={spent.get(k._id) ?? 0}
                      budget={k.monthlyBudgetPaise!}
                      t={t}
                    />
                  </Link>
                  <CategoryDialog category={k} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {without.length > 0 && (
        <section className="mt-6">
          <SectionTitle>{t("ph.budgetsPage.addFor")}</SectionTitle>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {without.map((k) => (
              <li key={k._id} className={cn("flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card ring-1 ring-foreground/[0.06]")}>
                <IconChip tone={k.tone} size="sm">
                  <CategoryIcon category={k} />
                </IconChip>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{categoryName(t, k)}</span>
                  <span className="block text-xs text-muted-foreground">
                    {t("ph.thisMonth")}: <Money paise={spent.get(k._id) ?? 0} />
                  </span>
                </span>
                <CategoryDialog category={k} label={t("ph.budgetsPage.setOne")} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
