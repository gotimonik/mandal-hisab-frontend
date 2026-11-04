import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { notFound } from "next/navigation";
import { ArrowLeft, BookText } from "lucide-react";
import { api, qs } from "@/lib/server/api";
import { requestToday } from "@/lib/server/today";
import { SummaryBand } from "@/components/app/summary-band";
import { Money } from "@/components/app/money";
import { EmptyState } from "@/components/app/empty-state";
import { IconChip, SectionTitle } from "@/components/app/bits";
import { ActionButton } from "@/components/app/action-button";
import { Pagination } from "@/components/app/pagination";
import { getT } from "@/i18n/server";
import { DefaultButton, WalletDialog } from "@/features/personal/manage-dialogs";
import { AddEntryTiles, EntryRow } from "@/features/personal/entry-dialog";
import { WALLET_TONE, WalletIcon } from "@/features/personal/icons";
import { Card, thisMonthRange } from "@/features/personal/server-bits";
import { walletName, type EntryList, type PCategory, type PWalletWithBalance, type Summary } from "@/features/personal/types";

export const metadata = { title: "Personal Hisab · Wallet" };

export default async function PersonalWalletPage({ params, searchParams }: PageProps<"/personal/wallets/[walletId]">) {
  const { walletId } = await params;
  if (!/^[a-f0-9]{24}$/.test(walletId)) notFound();
  const sp = await searchParams;
  const page = Math.max(1, Number(typeof sp.page === "string" ? sp.page : 1) || 1);
  const today = await requestToday();
  const [{ wallets }, c, month, list, { t }] = await Promise.all([
    api<{ wallets: PWalletWithBalance[] }>("/me/personal/wallets"),
    api<{ categories: PCategory[] }>("/me/personal/categories"),
    api<Summary>(`/me/personal/summary${qs({ ...thisMonthRange(today), walletId })}`),
    api<EntryList>(`/me/personal/entries${qs({ walletId, page, pageSize: 30 })}`),
    getT(),
  ]);
  const w = wallets.find((x) => x._id === walletId);
  if (!w) notFound();
  const book = { wallets, categories: c.categories };
  const name = walletName(t, w);

  return (
    <>
      <Link href="/personal/wallets" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {t("ph.tabs.wallets")}
      </Link>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <IconChip tone={WALLET_TONE[w.kind]} size="lg">
          <WalletIcon kind={w.kind} />
        </IconChip>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold tracking-tight">{name}</h1>
          <p className="text-sm text-muted-foreground">
            {t(`ph.settings.kinds.${w.kind}`)}
            {w.isArchived && ` · ${t("ph.settings.hidden")}`}
          </p>
        </div>
        <div className="flex w-full flex-wrap gap-1.5 sm:w-auto">
          <WalletDialog wallet={w} label={t("ph.edit")} />
          <Link href={`/personal/passbook?wallet=${w._id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <BookText /> {t("ph.passbook.title")}
          </Link>
          {!w.isArchived && <DefaultButton field="defaultWalletId" id={w._id} isDefault={!!w.isDefault} />}
          <ActionButton path={`/me/personal/wallets/${w._id}`} method="PATCH" body={{ isArchived: !w.isArchived }} successMessage={t("ph.settings.saved")}>
            {w.isArchived ? t("ph.settings.show") : t("ph.settings.hide")}
          </ActionButton>
          <ActionButton path={`/me/personal/wallets/${w._id}`} method="DELETE" className="text-destructive" redirectTo="/personal/wallets" successMessage={t("ph.settings.removed")} confirm={{ title: t("ph.settings.removeWalletTitle"), description: t("ph.settings.removeDesc"), destructive: true, confirmLabel: t("ph.settings.remove") }}>
            {t("ph.settings.remove")}
          </ActionButton>
        </div>
      </div>

      <SummaryBand
        tone="green"
        label={t("ph.walletPage.balance")}
        value={<Money paise={w.balancePaise} />}
        sub={t("ph.walletPage.monthNote")}
        stats={[
          { label: t("ph.walletPage.startedWith"), value: <Money paise={w.openingBalancePaise} short /> },
          { label: t("ph.walletPage.inMonth"), value: <Money paise={month.totals.incomePaise} short /> },
          { label: t("ph.walletPage.outMonth"), value: <Money paise={month.totals.expensePaise} short /> },
        ]}
      />

      {!w.isArchived && <AddEntryTiles book={book} compact defaults={{ walletId: w._id }} className="mb-4" />}

      <Card>
        <SectionTitle>{t("ph.walletPage.entries")}</SectionTitle>
        {list.items.length === 0 ? (
          <EmptyState title={t("ph.walletPage.none")} />
        ) : (
          <div className="-mx-2 flex flex-col">
            {list.items.map((e) => (
              <EntryRow key={e._id} entry={e} book={book} showDate />
            ))}
          </div>
        )}
      </Card>
      <Pagination page={list.page} pageSize={list.pageSize} total={list.total} baseHref={`/personal/wallets/${w._id}`} params={{}} />
    </>
  );
}
