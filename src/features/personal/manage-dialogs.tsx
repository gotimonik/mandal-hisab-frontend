"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, ChevronDown, Loader2, Pencil, Plus, Sparkles, Star, Tags, Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/app/field";
import { NativeSelect } from "@/components/app/native-select";
import { FormDialog, useDialogClose } from "@/components/app/form-dialog";
import { SubmitButton } from "@/components/app/form-bits";
import { Button } from "@/components/ui/button";
import { apiMutate } from "@/lib/api-client";
import { optionalRupees, rupeesOrZero } from "@/lib/schemas";
import { paiseToRupeeInput } from "@/lib/format";
import { TONE_CHIP, TONE_SOLID } from "@/lib/tones";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/client";
import { categoryName, TONES, WALLET_KINDS, walletName, type PCategory, type PWalletWithBalance, type WalletKind } from "./types";
import { CATEGORY_ICONS, categoryIconKey, IconByKey, suggestIcons } from "./icons";

export type DefaultField = "defaultWalletId" | "defaultExpenseCategoryId" | "defaultIncomeCategoryId";

/** "★ Default" next to a wallet / category name */
export function DefaultBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-500/12 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
      <Star className="size-2.5 fill-current" aria-hidden /> {label}
    </span>
  );
}

/** Make this wallet / category the one new entries start with (or stop it being that). */
export function useSetDefault() {
  const t = useT();
  const router = useRouter();
  const [pending, start] = useTransition();
  const set = (field: DefaultField, id: string | null) =>
    start(async () => {
      const res = await apiMutate({ path: "/me/personal/settings", method: "PATCH", body: { [field]: id } });
      if (!res.ok) return void toast.error(res.error);
      toast.success(id ? t("ph.def.set") : t("ph.def.cleared"));
      router.refresh();
    });
  return { set, pending };
}

export function DefaultButton({ field, id, isDefault }: { field: DefaultField; id: string; isDefault: boolean }) {
  const t = useT();
  const { set, pending } = useSetDefault();
  return (
    <Button variant="outline" size="sm" disabled={pending} aria-pressed={isDefault} onClick={() => set(field, isDefault ? null : id)} className={cn(isDefault && "text-amber-700 dark:text-amber-300")}>
      {pending ? <Loader2 className="animate-spin" /> : <Star className={cn(isDefault && "fill-current")} />}
      {isDefault ? t("ph.def.isDefault") : t("ph.def.make")}
    </Button>
  );
}

function useSave() {
  const router = useRouter();
  const t = useT();
  const close = useDialogClose();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (req: { path: string; method?: "POST" | "PATCH"; body: unknown }) =>
    start(async () => {
      setError(null);
      const res = await apiMutate(req);
      if (!res.ok) return setError(res.fieldErrors ? Object.values(res.fieldErrors)[0] : res.error);
      toast.success(t("ph.settings.saved"));
      close();
      router.refresh();
    });
  return { run, pending, error, setError };
}

function WalletForm({ wallet }: { wallet?: PWalletWithBalance }) {
  const t = useT();
  const { run, pending, error, setError } = useSave();
  const [name, setName] = useState(wallet ? walletName(t, wallet) : "");
  const [kind, setKind] = useState<WalletKind>(wallet?.kind ?? "cash");
  const [opening, setOpening] = useState(wallet ? paiseToRupeeInput(wallet.openingBalancePaise) : "");
  return (
    <form
      noValidate
      className="grid grid-cols-1 gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const o = rupeesOrZero.safeParse(opening);
        if (!o.success) return setError(o.error.issues[0].message);
        if (!name.trim()) return setError(t("ph.settings.vName"));
        // a starter wallet keeps its translated name unless the person actually changed it
        const nameChanged = !wallet || name.trim() !== walletName(t, wallet);
        const body = { ...(nameChanged ? { name: name.trim() } : {}), kind, openingBalance: o.data };
        run(wallet ? { path: `/me/personal/wallets/${wallet._id}`, method: "PATCH", body } : { path: "/me/personal/wallets", body });
      }}
    >
      <FormError message={error} />
      <Field label={t("ph.settings.name")} htmlFor="pw-name">
        <Input id="pw-name" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder={t("ph.settings.walletPh")} />
      </Field>
      <Field label={t("ph.settings.kind")} htmlFor="pw-kind">
        <NativeSelect id="pw-kind" value={kind} onChange={(e) => setKind(e.target.value as WalletKind)}>
          {WALLET_KINDS.map((k) => (
            <option key={k} value={k}>
              {t(`ph.settings.kinds.${k}`)}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field label={t("ph.settings.opening")} htmlFor="pw-open" hint={t("ph.settings.openingHint")}>
        <Input id="pw-open" inputMode="decimal" value={opening} onChange={(e) => setOpening(e.target.value)} placeholder="0" />
      </Field>
      <SubmitButton pending={pending} icon={<CheckCircle2 />}>
        {t("common.save")}
      </SubmitButton>
    </form>
  );
}

export function WalletDialog({ wallet, label }: { wallet?: PWalletWithBalance; label?: string }) {
  const t = useT();
  return (
    <FormDialog
      trigger={wallet ? (label ? <><Pencil /> {label}</> : <Pencil aria-label={t("ph.settings.editWallet")} />) : <><Plus /> {t("ph.settings.addWallet")}</>}
      triggerVariant={wallet && !label ? "ghost" : "outline"}
      triggerSize={wallet && !label ? "xs" : "sm"}
      title={wallet ? t("ph.settings.editWallet") : t("ph.settings.addWallet")}
      description={t("ph.settings.walletsDesc")}
      icon={<Wallet />}
      tone="sky"
    >
      <WalletForm wallet={wallet} />
    </FormDialog>
  );
}

function CategoryForm({ category, kind }: { category?: PCategory; kind: "expense" | "income" }) {
  const t = useT();
  const { run, pending, error, setError } = useSave();
  const [name, setName] = useState(category ? categoryName(t, category) : "");
  const [tone, setTone] = useState(category?.tone ?? "orange");
  const k0 = category?.kind ?? kind;
  // until the person picks one, the icon follows the name they type
  const [icon, setIcon] = useState<string | null>(category ? categoryIconKey(category) : null);
  const suggested = suggestIcons(name, k0);
  const shownIcon = icon ?? suggested[0];
  const [budget, setBudget] = useState(category?.monthlyBudgetPaise ? paiseToRupeeInput(category.monthlyBudgetPaise) : "");
  const k = k0;
  return (
    <form
      noValidate
      className="grid grid-cols-1 gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const b = optionalRupees.safeParse(budget);
        if (!b.success) return setError(b.error.issues[0].message);
        if (!name.trim()) return setError(t("ph.settings.vName"));
        const nameChanged = !category || name.trim() !== categoryName(t, category);
        const body = { ...(nameChanged ? { name: name.trim() } : {}), tone, icon: shownIcon, ...(k === "expense" ? { monthlyBudget: b.data || "0" } : {}) };
        run(category ? { path: `/me/personal/categories/${category._id}`, method: "PATCH", body } : { path: "/me/personal/categories", body: { ...body, kind: k } });
      }}
    >
      <FormError message={error} />
      <Field label={t("ph.settings.name")} htmlFor="pc-name">
        <Input id="pc-name" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      {/* icon: suggestions from the name first, then every icon */}
      <fieldset>
        <legend className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
          {t("ph.icons.title")}
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
            <Sparkles className="size-3" /> {name.trim().length >= 2 ? t("ph.icons.suggested") : t("ph.icons.popular")}
          </span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {suggested.map((key) => (
            <IconOption key={key} name={key} tone={tone} selected={shownIcon === key} onPick={setIcon} />
          ))}
        </div>
        <details className="group mt-2 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-semibold text-primary">
            {t("ph.icons.all")} <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-2 grid max-h-48 grid-cols-7 gap-1.5 overflow-y-auto rounded-xl bg-muted/40 p-2 sm:grid-cols-9">
            {CATEGORY_ICONS.map((i) => (
              <IconOption key={i.key} name={i.key} tone={tone} selected={shownIcon === i.key} onPick={setIcon} small />
            ))}
          </div>
        </details>
      </fieldset>
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">{t("ph.settings.colour")}</legend>
        <div className="flex flex-wrap gap-2">
          {TONES.map((c) => (
            <button key={c} type="button" aria-label={c} aria-pressed={tone === c} onClick={() => setTone(c)} className={cn("size-8 rounded-full ring-offset-2 ring-offset-background transition-shadow", TONE_SOLID[c], tone === c && "ring-2 ring-foreground")} />
          ))}
        </div>
      </fieldset>
      {k === "expense" && (
        <Field label={t("ph.settings.budget")} htmlFor="pc-budget" hint={t("ph.settings.budgetHint")}>
          <Input id="pc-budget" inputMode="decimal" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="—" />
        </Field>
      )}
      <SubmitButton pending={pending} icon={<CheckCircle2 />}>
        {t("common.save")}
      </SubmitButton>
    </form>
  );
}

function IconOption({ name, tone, selected, onPick, small = false }: { name: string; tone: (typeof TONES)[number]; selected: boolean; onPick: (k: string) => void; small?: boolean }) {
  return (
    <button
      type="button"
      aria-label={name.replace(/-\d$/, "").replace(/-/g, " ")}
      aria-pressed={selected}
      onClick={() => onPick(name)}
      className={cn("flex items-center justify-center rounded-xl transition-[box-shadow,background-color]", small ? "size-9 [&_svg]:size-4" : "size-11 [&_svg]:size-5", selected ? cn(TONE_CHIP[tone], "ring-2 ring-current") : "bg-card text-muted-foreground ring-1 ring-foreground/10 hover:bg-muted hover:text-foreground")}
    >
      <IconByKey name={name} />
    </button>
  );
}

export function CategoryDialog({ category, kind = "expense", label, variant }: { category?: PCategory; kind?: "expense" | "income"; label?: string; variant?: "outline" | "ghost" | "default" }) {
  const t = useT();
  return (
    <FormDialog
      trigger={category ? (label ? <><Pencil /> {label}</> : <Pencil aria-label={t("ph.settings.editCategory")} />) : <><Plus /> {t("ph.settings.addCategory")}</>}
      triggerVariant={variant ?? (category && !label ? "ghost" : "outline")}
      triggerSize={category && !label ? "xs" : "sm"}
      title={category ? t("ph.settings.editCategory") : t("ph.settings.addCategory")}
      description={t("ph.settings.categoriesDesc")}
      icon={<Tags />}
      tone="orange"
    >
      <CategoryForm category={category} kind={kind} />
    </FormDialog>
  );
}

/** The overall monthly budget (empty = none). */
export function OverallBudgetForm({ budgetPaise }: { budgetPaise: number | null }) {
  const t = useT();
  const router = useRouter();
  const [value, setValue] = useState(budgetPaise ? paiseToRupeeInput(budgetPaise) : "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      noValidate
      className="flex flex-col gap-2 sm:flex-row sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        const b = optionalRupees.safeParse(value);
        if (!b.success) return setError(b.error.issues[0].message);
        start(async () => {
          setError(null);
          const res = await apiMutate({ path: "/me/personal/settings", method: "PATCH", body: { monthlyBudget: b.data || "0" } });
          if (!res.ok) return setError(res.error);
          toast.success(t("ph.settings.saved"));
          router.refresh();
        });
      }}
    >
      <Field label={t("ph.settings.budget")} htmlFor="ph-overall" error={error ?? undefined} className="sm:w-56">
        <Input id="ph-overall" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder="—" />
      </Field>
      <SubmitButton pending={pending} className="sm:w-auto" size="default">
        {t("ph.settings.saveBudget")}
      </SubmitButton>
    </form>
  );
}

/** Budgets page: push me at 80 % and when I go over. */
export function BudgetAlertsToggle({ on }: { on: boolean }) {
  const t = useT();
  const router = useRouter();
  const [value, setValue] = useState(on);
  const [pending, start] = useTransition();
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-muted/40 p-3">
      <input
        type="checkbox"
        role="switch"
        className="peer sr-only"
        checked={value}
        disabled={pending}
        onChange={(e) => {
          const v = e.target.checked;
          setValue(v);
          start(async () => {
            const res = await apiMutate({ path: "/me/personal/settings", method: "PATCH", body: { budgetAlerts: v } });
            if (!res.ok) {
              setValue(!v);
              return void toast.error(res.error);
            }
            toast.success(v ? t("ph.budgetsPage.alertsOn") : t("ph.budgetsPage.alertsOff"));
            router.refresh();
          });
        }}
      />
      <span aria-hidden className={cn("relative mt-0.5 h-6 w-10 shrink-0 rounded-full transition-colors peer-focus-visible:ring-3 peer-focus-visible:ring-ring/40", value ? "bg-emerald-500" : "bg-foreground/20")}>
        <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-[left]", value ? "left-[1.125rem]" : "left-0.5")} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{t("ph.budgetsPage.alerts")}</span>
        <span className="block text-xs text-muted-foreground">{t("ph.budgetsPage.alertsDesc")}</span>
      </span>
    </label>
  );
}
