import Link from "next/link";
import { ChevronRight, Wallet } from "lucide-react";
import { api } from "@/lib/server/api";
import { PageHeader } from "@/components/app/page-header";
import { SummaryBand } from "@/components/app/summary-band";
import { Money } from "@/components/app/money";
import { IconChip, SectionTitle } from "@/components/app/bits";
import { getT } from "@/i18n/server";
import { cn } from "@/lib/utils";
import { WalletDialog } from "@/features/personal/manage-dialogs";
import { WALLET_TONE, WalletIcon } from "@/features/personal/icons";
import { walletName, type MandalSync, type PWalletWithBalance } from "@/features/personal/types";
import { MandalSyncCard } from "@/features/personal/mandal-sync";
import type { T } from "@/i18n/core";

export const metadata = { title: "Personal Hisab · Wallets" };

function WalletCard({ w, t }: { w: PWalletWithBalance; t: T }) {
  return (
    <Link href={`/personal/wallets/${w._id}`} className={cn("flex items-center gap-3 rounded-2xl bg-card p-3.5 shadow-card ring-1 ring-foreground/[0.06] transition-[background-color,transform] hover:bg-muted/50 active:scale-[0.99]", w.isArchived && "opacity-70")}>
      <IconChip tone={WALLET_TONE[w.kind]} size="lg">
        <WalletIcon kind={w.kind} />
      </IconChip>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{walletName(t, w)}</span>
        <span className="block text-xs text-muted-foreground">
          {t(`ph.settings.kinds.${w.kind}`)} · {t("ph.entries", { n: w.entryCount })}
        </span>
      </span>
      <Money paise={w.balancePaise} colored={w.balancePaise < 0} className="text-base font-bold" />
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

export default async function PersonalWalletsPage() {
  const [{ wallets }, sync, { t }] = await Promise.all([api<{ wallets: PWalletWithBalance[] }>("/me/personal/wallets"), api<MandalSync>("/me/personal/mandal-sync"), getT()]);
  const active = wallets.filter((w) => !w.isArchived);
  const hidden = wallets.filter((w) => w.isArchived);
  return (
    <>
      <PageHeader title={t("ph.tabs.wallets")} description={t("ph.settings.walletsDesc")} actions={<WalletDialog />} />
      <SummaryBand tone="green" icon={<Wallet />} label={t("ph.walletPage.total")} value={<Money paise={wallets.reduce((a, w) => a + w.balancePaise, 0)} />} sub={t("ph.walletPage.count", { n: active.length })} />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {active.map((w) => (
          <WalletCard key={w._id} w={w} t={t} />
        ))}
      </div>
      <div className="mt-6">
        <MandalSyncCard sync={sync} wallets={wallets} />
      </div>
      {hidden.length > 0 && (
        <section className="mt-6">
          <SectionTitle>{t("ph.walletPage.hiddenTitle")}</SectionTitle>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {hidden.map((w) => (
              <WalletCard key={w._id} w={w} t={t} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
