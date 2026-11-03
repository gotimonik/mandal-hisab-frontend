import { BellOff, BellRing, HandCoins, Smartphone } from "lucide-react";
import { api } from "@/lib/server/api";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { IconChip, SectionTitle } from "@/components/app/bits";
import { getT } from "@/i18n/server";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ReminderCard, ReminderDialog } from "@/features/personal/reminders";
import { Card } from "@/features/personal/server-bits";
import type { PCategory, PReminder, PWallet, ReminderList } from "@/features/personal/types";

export const metadata = { title: "Personal Hisab · Reminders" };

export default async function PersonalRemindersPage({ searchParams }: PageProps<"/personal/reminders">) {
  const sp = await searchParams;
  // looking at this page = the alerts below are read
  const [list, w, c, { t }] = await Promise.all([api<ReminderList>("/me/personal/reminders?markRead=1"), api<{ wallets: PWallet[] }>("/me/personal/wallets"), api<{ categories: PCategory[] }>("/me/personal/categories"), getT()]);
  const groups: { key: string; title: string; rows: PReminder[] }[] = [
    { key: "overdue", title: t("ph.rem.groups.overdue"), rows: list.reminders.filter((r) => r.status === "overdue") },
    { key: "today", title: t("ph.rem.groups.today"), rows: list.reminders.filter((r) => r.status === "today") },
    { key: "soon", title: t("ph.rem.groups.soon"), rows: list.reminders.filter((r) => r.status === "soon") },
    { key: "later", title: t("ph.rem.groups.later"), rows: list.reminders.filter((r) => r.status === "later") },
  ];
  const done = list.reminders.filter((r) => r.status === "done");
  const card = (r: PReminder) => <ReminderCard key={r._id} r={r} categories={c.categories} wallets={w.wallets} />;

  return (
    <>
      <PageHeader title={t("ph.tabs.reminders")} description={t("ph.rem.desc")} actions={
          <div className="flex flex-wrap gap-2">
            <ReminderDialog kind="receive" categories={c.categories} wallets={w.wallets} defaultOpen={sp.new === "receive"} />
            <ReminderDialog categories={c.categories} wallets={w.wallets} defaultOpen={sp.new === "1"} />
          </div>
        }
      />

      <div className="mb-5 flex items-start gap-3 rounded-2xl bg-amber-500/8 p-3.5 ring-1 ring-amber-500/20">
        <IconChip tone="amber" size="sm">
          <Smartphone />
        </IconChip>
        <p className="text-sm">
          <b>{t("ph.rem.howTitle")}</b>
          <span className="block text-xs text-muted-foreground">{t("ph.rem.howDesc")}</span>
        </p>
      </div>

      {list.reminders.length === 0 ? (
        <EmptyState icon={<BellRing />} title={t("ph.rem.emptyTitle")} description={t("ph.rem.emptyDesc")} action={<ReminderDialog categories={c.categories} wallets={w.wallets} />} />
      ) : (
        <div className="flex flex-col gap-6">
          {groups
            .filter((g) => g.rows.length)
            .map((g) => (
              <section key={g.key} aria-label={g.title}>
                <SectionTitle>{g.title}</SectionTitle>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">{g.rows.map(card)}</div>
              </section>
            ))}
          {done.length > 0 && (
            <details className="group">
              <summary className="mb-2 cursor-pointer list-none text-sm font-bold text-muted-foreground [&::-webkit-details-marker]:hidden">
                {t("ph.rem.groups.done", { n: done.length })}
              </summary>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">{done.map(card)}</div>
            </details>
          )}
        </div>
      )}

      <section className="mt-8" aria-label={t("ph.rem.alerts")}>
        <SectionTitle>{t("ph.rem.alerts")}</SectionTitle>
        <Card>
          {list.alerts.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <BellOff className="size-4" /> {t("ph.rem.noAlerts")}
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border/60">
              {list.alerts.map((a) => (
                <li key={a._id} className="flex items-start gap-3 py-2.5">
                  <IconChip tone={a.type.startsWith("personal.budget") ? (a.type.endsWith("over") ? "rose" : "amber") : a.type === "personal.collect" ? "emerald" : "sky"} size="sm">
                    {a.type === "personal.collect" ? <HandCoins /> : <BellRing />}
                  </IconChip>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm", a.unread ? "font-bold" : "font-medium")}>{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.body}</p>
                    <p className="text-[11px] text-muted-foreground">{formatDateTime(a.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </>
  );
}
