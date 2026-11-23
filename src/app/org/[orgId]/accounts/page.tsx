import Link from "next/link";
import { ArrowDownLeft, ArrowRight, ArrowUpRight, CircleDollarSign, Landmark, Smartphone, Wallet } from "lucide-react";
import { getAccounts, getOrg, can } from "@/lib/server/data";
import { PageHeader } from "@/components/app/page-header";
import { Money } from "@/components/app/money";
import { StatusBadge } from "@/components/app/status-badge";
import { ActionButton } from "@/components/app/action-button";
import { IconChip } from "@/components/app/bits";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/tones";
import type { Account } from "@/lib/types";
import { NewAccountDialog, TransferDialog, AdjustDialog } from "@/features/accounts/account-dialogs";

import { getT } from "@/i18n/server";
import type { Key } from "@/i18n/core";

export const metadata = { title: "Accounts" };

const TYPE: Record<Account["type"], { icon: typeof Wallet; tone: Tone; label: Key }> = {
  cash: { icon: Wallet, tone: "emerald", label: "acc.type.cash" },
  bank: { icon: Landmark, tone: "sky", label: "acc.type.bank" },
  upi: { icon: Smartphone, tone: "violet", label: "acc.type.upi" },
  other: { icon: CircleDollarSign, tone: "slate", label: "acc.type.other" },
};

/** "HDFC Bank · ••1234 · HDFC0001234" / "mandal@upi" — what identifies the account. */
const detail = (a: Account) => (a.type === "bank" ? [a.bankName, a.accountNumberLast4 && `••${a.accountNumberLast4}`, a.ifsc].filter(Boolean).join(" · ") : a.type === "upi" ? (a.upiId ?? "") : "");

export default async function AccountsPage({ params }: PageProps<"/org/[orgId]/accounts">) {
  const { orgId } = await params;
  const { t } = await getT();
  const [org, accounts] = await Promise.all([getOrg(orgId), getAccounts(orgId)]);
  const active = accounts.filter((a) => a.isActive).map((a) => ({ _id: a._id, name: a.name }));
  const total = accounts.reduce((s, a) => s + a.balancePaise, 0);
  const writable = org.status === "active";
  const manage = can(org, "accounts.manage") && writable;
  // active accounts first, then by balance
  const sorted = [...accounts].sort((a, b) => Number(b.isActive) - Number(a.isActive) || b.balancePaise - a.balancePaise);

  return (
    <>
      <PageHeader
        title={t("acc.title")}
        description={t("acc.desc")}
        actions={
          writable ? (
            <>
              {can(org, "transactions.adjust") && active.length > 0 && <AdjustDialog accounts={active} />}
              {manage && active.length > 1 && <TransferDialog accounts={active} />}
              {manage && <NewAccountDialog />}
            </>
          ) : null
        }
      />

      <section aria-label={t("acc.total")} className="bg-hero-green relative mb-5 overflow-hidden rounded-3xl p-5 shadow-lg shadow-emerald-600/15 sm:p-6">
        <div className="pointer-events-none absolute -top-12 -right-10 size-40 rounded-full bg-white/10" />
        <p className="relative text-sm font-medium text-white/85">{t("acc.total")}</p>
        <Money paise={total} className="relative mt-0.5 block text-4xl font-extrabold tracking-tight" />
        <p className="relative mt-1 text-xs text-white/80">
          {active.length === 1 ? t("acc.active1") : t("acc.activeN", { n: active.length })}
          {t("acc.balNote")}
        </p>
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {sorted.map((a) => {
          const ty = TYPE[a.type];
          const Icon = ty.icon;
          const info = detail(a);
          return (
            <article key={a._id} className={cn("flex flex-col rounded-2xl bg-card shadow-card ring-1 ring-foreground/[0.06]", !a.isActive && "opacity-60")}>
              <div className="flex items-start gap-3 p-4 pb-3">
                <IconChip tone={ty.tone}>
                  <Icon />
                </IconChip>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-semibold">{a.name}</h2>
                  <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="rounded-md bg-muted px-1.5 py-0.5 font-medium">{t(ty.label)}</span>
                    {info && <span className="truncate">{info}</span>}
                    {!a.isActive && <StatusBadge status="inactive" />}
                  </p>
                </div>
              </div>

              <div className="px-4">
                <Money paise={a.balancePaise} colored={a.balancePaise < 0} className="block text-3xl font-bold tracking-tight" />
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-500/8 px-2.5 py-2">
                    <ArrowDownLeft className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span className="min-w-0">
                      <span className="block text-muted-foreground">{t("acc.in")}</span>
                      <Money paise={a.totalInPaise} className="font-semibold" />
                    </span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-rose-500/8 px-2.5 py-2">
                    <ArrowUpRight className="size-4 shrink-0 text-rose-600 dark:text-rose-400" />
                    <span className="min-w-0">
                      <span className="block text-muted-foreground">{t("acc.out")}</span>
                      <Money paise={a.totalOutPaise} className="font-semibold" />
                    </span>
                  </div>
                </div>
                <p className="mt-2.5 text-xs text-muted-foreground">
                  {t("acc.opened", { date: formatDate(a.openingDate) })} <Money paise={a.openingBalancePaise} />
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/60 px-2 py-1.5">
                <Link href={`/org/${orgId}/transactions?accountId=${a._id}`} className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-primary hover:bg-primary/5">
                  {t("acc.viewTxn")} <ArrowRight className="size-3.5" />
                </Link>
                {manage &&
                  (a.isActive ? (
                    <ActionButton
                      path={`/orgs/${orgId}/accounts/${a._id}`}
                      method="PATCH"
                      body={{ isActive: false }}
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground"
                      successMessage={t("acc.deactivated")}
                      confirm={{ title: t("acc.deactivateQ", { name: a.name }), description: t("acc.deactivateD"), confirmLabel: t("acc.deactivate") }}
                    >
                      {t("acc.deactivate")}
                    </ActionButton>
                  ) : (
                    <ActionButton path={`/orgs/${orgId}/accounts/${a._id}`} method="PATCH" body={{ isActive: true }} size="sm" variant="ghost" successMessage={t("acc.reactivated")}>
                      {t("acc.reactivate")}
                    </ActionButton>
                  ))}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
