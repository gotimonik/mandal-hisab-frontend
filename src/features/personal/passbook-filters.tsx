"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/app/native-select";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { walletName, type PWallet } from "./types";
import { passbookPresets } from "./passbook-presets";

/** Period and wallet for the passbook; changing either shows the new passbook. */
export function PassbookFilters({ today, from, to, walletId, wallets }: { today: string; from: string; to: string; walletId: string; wallets: PWallet[] }) {
  const t = useT();
  const router = useRouter();
  const [pending, start] = useTransition();
  const presets = passbookPresets(today);
  const preset = presets.find((p) => p.from === from && p.to === to)?.key ?? "custom";
  const [custom, setCustom] = useState(preset === "custom");
  const [f, setF] = useState(from);
  const [tt, setT] = useState(to);
  const go = (q: { from: string; to: string; wallet: string }) =>
    start(() => {
      const sp = new URLSearchParams({ from: q.from, to: q.to });
      if (q.wallet) sp.set("wallet", q.wallet);
      router.push(`/personal/passbook?${sp.toString()}`, { scroll: false });
    });
  return (
    <div className="no-print mb-4 flex flex-col gap-3 rounded-2xl bg-card p-3.5 shadow-card ring-1 ring-foreground/[0.06]">
      <div className="flex flex-wrap items-center gap-1.5">
        {presets.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => {
              setCustom(false);
              go({ from: p.from, to: p.to, wallet: walletId });
            }}
            className={cn("rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition-colors", !custom && preset === p.key ? "bg-primary text-primary-foreground ring-primary" : "bg-card ring-foreground/10 hover:bg-muted")}
          >
            {t(`ph.passbook.presets.${p.key}`)}
          </button>
        ))}
        <button type="button" onClick={() => setCustom(true)} className={cn("rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition-colors", custom ? "bg-primary text-primary-foreground ring-primary" : "bg-card ring-foreground/10 hover:bg-muted")}>
          {t("ph.passbook.presets.custom")}
        </button>
        {pending && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
      </div>
      {custom && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="flex flex-col gap-1 text-xs font-medium">
            {t("ph.passbook.from")}
            <Input type="date" value={f} max={today} onChange={(e) => setF(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium">
            {t("ph.passbook.to")}
            <Input type="date" value={tt} max={today} onChange={(e) => setT(e.target.value)} />
          </label>
          <Button type="button" className="col-span-2 sm:col-span-1" disabled={!f || !tt || f > tt || pending} onClick={() => go({ from: f, to: tt, wallet: walletId })}>
            {t("ph.passbook.show")}
          </Button>
        </div>
      )}
      <label className="flex flex-col gap-1 text-xs font-medium sm:max-w-xs">
        {t("ph.passbook.wallet")}
        <NativeSelect value={walletId} onChange={(e) => go({ from, to, wallet: e.target.value })}>
          <option value="">{t("ph.passbook.allWallets")}</option>
          {wallets.map((w) => (
            <option key={w._id} value={w._id}>
              {walletName(t, w)}
            </option>
          ))}
        </NativeSelect>
      </label>
    </div>
  );
}
