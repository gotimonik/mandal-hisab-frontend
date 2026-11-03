"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, CheckCircle2, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/app/field";
import { NativeSelect } from "@/components/app/native-select";
import { SubmitButton } from "@/components/app/form-bits";
import { IconChip } from "@/components/app/bits";
import { apiMutate } from "@/lib/api-client";
import { todayISO } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/client";
import { walletName, type MandalSync, type PWallet } from "./types";

/** "Add my Mandal money to my Personal Hisab": on / off, which wallet, from when. */
export function MandalSyncCard({ sync, wallets }: { sync: MandalSync; wallets: PWallet[] }) {
  const t = useT();
  const router = useRouter();
  const active = wallets.filter((w) => !w.isArchived);
  const [enabled, setEnabled] = useState(sync.enabled);
  const [walletId, setWalletId] = useState(sync.walletId ?? active[0]?._id ?? "");
  const [fromDate, setFromDate] = useState(sync.fromDate ?? `${todayISO().slice(0, 7)}-01`);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const save = (on: boolean) =>
    start(async () => {
      setError(null);
      const res = await apiMutate<{ result?: { added?: number } }>({ path: "/me/personal/mandal-sync", method: "PATCH", body: { enabled: on, walletId: walletId || null, fromDate } });
      if (!res.ok) {
        setEnabled(sync.enabled);
        return setError(res.error);
      }
      toast.success(on ? t("ph.mandal.onToast", { n: res.data.result?.added ?? 0 }) : t("ph.mandal.offToast"));
      router.refresh();
    });
  const none = sync.mandals.length === 0;

  return (
    <section id="mandal" className="scroll-mt-20 rounded-2xl bg-card p-4 shadow-card ring-1 ring-violet-500/20 sm:p-5">
      <div className="mb-3 flex items-start gap-3">
        <IconChip tone="violet">
          <Building2 />
        </IconChip>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">{t("ph.mandal.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("ph.mandal.desc")}</p>
        </div>
      </div>

      {none ? (
        <p className="flex items-start gap-2 rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" /> {t("ph.mandal.noneLinked")}
        </p>
      ) : (
        <>
          <ul className="mb-3 flex flex-col gap-1.5">
            {sync.mandals.map((m) => (
              <li key={m.organizationId} className="flex items-center justify-between gap-2 rounded-xl bg-muted/40 px-3 py-2 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{m.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{m.supported ? t("ph.mandal.asMember", { name: m.memberName }) : t("ph.mandal.notRupees")}</span>
                </span>
                {m.entries > 0 && <span className="shrink-0 text-xs text-muted-foreground">{t("ph.entries", { n: m.entries })}</span>}
              </li>
            ))}
          </ul>

          <label className="mb-3 flex cursor-pointer items-start gap-3 rounded-2xl bg-muted/40 p-3">
            <input
              type="checkbox"
              role="switch"
              className="peer sr-only"
              checked={enabled}
              disabled={pending}
              onChange={(e) => {
                setEnabled(e.target.checked);
                if (!e.target.checked) save(false);
              }}
            />
            <span aria-hidden className={cn("relative mt-0.5 h-6 w-10 shrink-0 rounded-full transition-colors peer-focus-visible:ring-3 peer-focus-visible:ring-ring/40", enabled ? "bg-violet-500" : "bg-foreground/20")}>
              <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-[left]", enabled ? "left-[1.125rem]" : "left-0.5")} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{t("ph.mandal.toggle")}</span>
              <span className="block text-xs text-muted-foreground">{t("ph.mandal.toggleDesc")}</span>
            </span>
          </label>

          {enabled && (
            <form
              noValidate
              className="grid grid-cols-1 gap-3 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                save(true);
              }}
            >
              <FormError message={error} />
              <Field label={t("ph.mandal.wallet")} htmlFor="ms-wallet" hint={t("ph.mandal.walletHint")}>
                <NativeSelect id="ms-wallet" value={walletId} onChange={(e) => setWalletId(e.target.value)}>
                  {active.map((w) => (
                    <option key={w._id} value={w._id}>
                      {walletName(t, w)}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label={t("ph.mandal.from")} htmlFor="ms-from" hint={t("ph.mandal.fromHint")}>
                <Input id="ms-from" type="date" max={todayISO()} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </Field>
              <SubmitButton pending={pending} icon={<CheckCircle2 />} className="sm:col-span-2">
                {sync.enabled ? t("ph.mandal.save") : t("ph.mandal.start")}
              </SubmitButton>
            </form>
          )}
          {!enabled && error && <FormError message={error} />}
        </>
      )}
      <p className="mt-3 text-xs text-muted-foreground">{t("ph.mandal.howItCounts")}</p>
    </section>
  );
}
