"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import Link from "next/link";
import { Building2, Landmark, PiggyBank, Plus, Save, ShieldCheck, SlidersHorizontal, Tags, UserPlus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ActionButton } from "@/components/app/action-button";
import { StartAllInstallmentsDialog } from "@/features/fund-loans/start-all-installments-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FormError } from "@/components/app/field";
import { NativeSelect } from "@/components/app/native-select";
import { useApiSubmit } from "@/components/app/use-api-form";
import { FormSection, MoreOptions, SubmitButton, FormNote } from "@/components/app/form-bits";

import type { ManagerPermissions, Org } from "@/lib/types";
import { LogoPicker } from "./logo-picker";
import { SettingsPanel } from "./settings-tabs";
import { FORM_TABS } from "./settings-tab-ids";
import { paiseToRupeeInput } from "@/lib/format";
import { useMoney } from "@/components/app/currency";
import { CURRENCIES, DEFAULT_CURRENCY, moneyFmt } from "@/lib/currency";
import { useLang, useT } from "@/i18n/client";
import { intlLocale } from "@/i18n/core";

const PERMS: (keyof ManagerPermissions)[] = [
  "canVerifyPayments",
  "canManageSchemes",
  "canCreateLoans",
  "canApproveLoans",
  "canModifyInterest",
  "canApproveExpenses",
  "canManageAccounts",
  "canAccessSensitiveReports",
  "canRecordWithdrawals",
  "canDistributeInterest",
];

interface V {
  name: string;
  nameEnglish: string;
  description: string;
  haptaTreatment: "member_savings" | "income";
  interestMode: "manual" | "rate";
  interestRate: string;
  interestBasis: "previous_month_closing" | "hapta_contributions";
  allowWithdrawalExceptions: boolean;
  loanRate: string;
  loanDueDay: number;
  allowUpadRequests: boolean;
  upadInstallmentsOn: boolean;
  upadInstallmentCount: number;
  upadInstallmentMin: string;
  discoverable: boolean;
  allowJoinRequests: boolean;
  autoCreateMember: boolean;
  address: string;
  city: string;
  state: string;
  pincode: string;
  contactPhone: string;
  contactEmail: string;
  registrationNumber: string;
  registrationDetails: string;
  financialYearStartMonth: number;
  currency: string;
  timezone: string;
  receiptPrefix: string;
  requirePaymentVerification: boolean;
  threshold: string;
  reminderDays: string;
  overdueReminderEveryDays: number;
  installmentHorizonMonths: number;
  managerPermissions: ManagerPermissions;
  upiEnabled: boolean;
  upiAccountId: string;
  categories: { key: string; name: string; isActive: boolean; isNew?: boolean }[];
}

export function SettingsForm({ org, upiAccounts = [] }: { org: Org; upiAccounts?: { _id: string; name: string; upiId: string }[] }) {
  const money = useMoney();
  const t = useT();
  const lang = useLang();
  // month names in the person's language
  const months = Array.from({ length: 12 }, (_, i) => new Intl.DateTimeFormat(intlLocale(lang), { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2026, i, 1))));
  const s = org.settings;
  const form = useForm<V>({
    defaultValues: {
      name: org.name,
      nameEnglish: org.nameEnglish ?? "",
      description: org.description ?? "",
      haptaTreatment: s.haptaTreatment,
      interestMode: s.interest.defaultMode,
      interestRate: s.interest.monthlyRate,
      interestBasis: s.interest.basis,
      allowWithdrawalExceptions: s.withdrawals.allowExceptions,
      loanRate: s.fundLoans.defaultMonthlyRate,
      loanDueDay: s.fundLoans.dueDay,
      allowUpadRequests: s.fundLoans.allowMemberRequests ?? true,
      upadInstallmentsOn: !!s.fundLoans.installments?.enabled,
      upadInstallmentCount: s.fundLoans.installments?.count ?? 10,
      upadInstallmentMin: paiseToRupeeInput(s.fundLoans.installments?.minAmountPaise ?? 0),
      discoverable: s.membership.discoverable,
      allowJoinRequests: s.membership.allowJoinRequests,
      autoCreateMember: s.membership.autoCreateMember,
      address: org.address ?? "",
      city: org.city ?? "",
      state: org.state ?? "",
      pincode: org.pincode ?? "",
      contactPhone: org.contactPhone ?? "",
      contactEmail: org.contactEmail ?? "",
      registrationNumber: org.registrationNumber ?? "",
      registrationDetails: org.registrationDetails ?? "",
      financialYearStartMonth: s.financialYearStartMonth,
      currency: s.currency || DEFAULT_CURRENCY,
      timezone: s.timezone,
      receiptPrefix: s.receiptPrefix,
      requirePaymentVerification: s.requirePaymentVerification,
      threshold: paiseToRupeeInput(s.expenseApprovalThresholdPaise),
      reminderDays: s.reminderDaysBefore.join(", "),
      overdueReminderEveryDays: s.overdueReminderEveryDays,
      installmentHorizonMonths: s.installmentHorizonMonths,
      managerPermissions: { ...s.managerPermissions, canRecordWithdrawals: !!s.managerPermissions.canRecordWithdrawals, canDistributeInterest: !!s.managerPermissions.canDistributeInterest },
      upiEnabled: !!s.upi?.enabled,
      upiAccountId: s.upi?.accountId ?? upiAccounts[0]?._id ?? "",
      categories: s.expenseCategories,
    },
  });
  const cats = useFieldArray({ control: form.control, name: "categories" });
  const { submit, pending, error, setError } = useApiSubmit(form);
  const [newCat, setNewCat] = useState("");
  const perms = form.watch("managerPermissions");

  const onSubmit = form.handleSubmit((v) => {
    const days = v.reminderDays
      .split(/[,\s]+/)
      .filter(Boolean)
      .map(Number);
    if (days.some((d) => !Number.isInteger(d) || d < 0 || d > 30)) return setError(t("setf.err.reminderDays"));
    if (!/^\d+(\.\d{1,2})?$/.test(v.threshold || "0")) return setError(t("setf.err.threshold"));
    if (!/^\d{1,3}(\.\d{1,4})?$/.test(v.interestRate.trim())) return setError(t("setf.err.interestRate"));
    if (!/^\d{1,3}(\.\d{1,4})?$/.test(v.loanRate.trim())) return setError(t("setf.err.loanRate"));
    if (!(Number(v.loanDueDay) >= 1 && Number(v.loanDueDay) <= 28)) return setError(t("setf.err.loanDueDay"));
    const installmentCount = Number(v.upadInstallmentCount);
    if (v.upadInstallmentsOn && !(Number.isInteger(installmentCount) && installmentCount >= 2 && installmentCount <= 60)) return setError(t("setf.err.instCount"));
    if (!/^\d+(\.\d{1,2})?$/.test((v.upadInstallmentMin || "0").replace(/[,\s]/g, ""))) return setError(t("setf.err.instMin"));
    const installmentMinPaise = Math.round(Number((v.upadInstallmentMin || "0").replace(/[,\s]/g, "")) * 100);
    if (v.upiEnabled && !v.upiAccountId) return setError(t("setf.err.upi"));
    const opt = (x: string) => (x.trim() ? x.trim() : undefined);
    submit(
      {
        path: `/orgs/${org.id}`,
        method: "PATCH",
        body: {
          name: v.name,
          nameEnglish: v.nameEnglish.trim(),
          description: v.description.trim(),
          address: opt(v.address),
          city: opt(v.city),
          state: opt(v.state),
          pincode: v.pincode.trim(),
          contactPhone: v.contactPhone.trim(),
          contactEmail: v.contactEmail.trim(),
          registrationNumber: opt(v.registrationNumber),
          registrationDetails: opt(v.registrationDetails),
          settings: {
            financialYearStartMonth: Number(v.financialYearStartMonth),
            currency: v.currency,
            timezone: v.timezone,
            receiptPrefix: v.receiptPrefix.toUpperCase(),
            requirePaymentVerification: v.requirePaymentVerification,
            expenseApprovalThresholdPaise: Math.round(Number(v.threshold || "0") * 100),
            reminderDaysBefore: days,
            overdueReminderEveryDays: Number(v.overdueReminderEveryDays),
            installmentHorizonMonths: Number(v.installmentHorizonMonths),
            managerPermissions: v.managerPermissions,
            upi: { enabled: v.upiEnabled, accountId: v.upiAccountId || null },
            expenseCategories: v.categories.map(({ key, name, isActive }) => ({ key, name, isActive })),
            haptaTreatment: v.haptaTreatment,
            interest: { defaultMode: v.interestMode, monthlyRate: v.interestRate.trim(), basis: v.interestBasis },
            withdrawals: { allowExceptions: v.allowWithdrawalExceptions },
            fundLoans: {
              defaultMonthlyRate: v.loanRate.trim(),
              dueDay: Number(v.loanDueDay),
              allowMemberRequests: v.allowUpadRequests,
              installments: {
                enabled: v.upadInstallmentsOn,
                count: v.upadInstallmentsOn ? installmentCount : (s.fundLoans.installments?.count ?? 10),
                minAmountPaise: v.upadInstallmentsOn ? installmentMinPaise : (s.fundLoans.installments?.minAmountPaise ?? 0),
              },
            },
            membership: { discoverable: v.discoverable, allowJoinRequests: v.allowJoinRequests, autoCreateMember: v.autoCreateMember },
          },
        },
      },
      { success: t("setf.saved") },
    );
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />
      <SettingsPanel tab="mandal">
        <FormSection icon={<Building2 />} tone="indigo" title={t("setf.profile.title")} description={t("setf.profile.desc")}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t("setf.profile.name")} htmlFor="o-name" className="sm:col-span-2">
              <Input id="o-name" {...form.register("name")} />
            </Field>
            <Field label={t("setf.profile.description")} htmlFor="o-desc" className="sm:col-span-2" hint={t("setf.profile.descriptionHint")}>
              <Textarea id="o-desc" rows={2} maxLength={500} {...form.register("description")} />
            </Field>
            <Field label={t("setf.profile.address")} htmlFor="o-addr" className="sm:col-span-2">
              <Input id="o-addr" {...form.register("address")} />
            </Field>
            <Field label={t("setf.profile.city")} htmlFor="o-city">
              <Input id="o-city" {...form.register("city")} />
            </Field>
            <Field label={t("setf.profile.state")} htmlFor="o-state">
              <Input id="o-state" {...form.register("state")} />
            </Field>
            <Field label={t("setf.profile.pincode")} htmlFor="o-pin" error={form.formState.errors.pincode?.message}>
              <Input id="o-pin" inputMode="numeric" maxLength={6} {...form.register("pincode")} />
            </Field>
            <Field label={t("setf.profile.phone")} htmlFor="o-phone" error={form.formState.errors.contactPhone?.message}>
              <Input id="o-phone" type="tel" {...form.register("contactPhone")} />
            </Field>
            <Field label={t("setf.profile.email")} htmlFor="o-email" error={form.formState.errors.contactEmail?.message}>
              <Input id="o-email" type="email" {...form.register("contactEmail")} />
            </Field>
            <Field label={t("setf.profile.regNo")} htmlFor="o-reg">
              <Input id="o-reg" {...form.register("registrationNumber")} />
            </Field>
            <Field label={t("setf.profile.regDetails")} htmlFor="o-regd" className="sm:col-span-2">
              <Textarea id="o-regd" rows={2} {...form.register("registrationDetails")} />
            </Field>
            <LogoPicker orgId={org.id} initialUrl={org.logoUrl} />
          </div>
        </FormSection>
      </SettingsPanel>

      <SettingsPanel tab="money">
        <FormSection icon={<PiggyBank />} tone="violet" title={t("setf.money.title")} description={t("setf.money.desc")}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t("setf.money.treat")} htmlFor="o-treat" className="sm:col-span-2" hint={t("setf.money.treatHint")}>
              <NativeSelect id="o-treat" {...form.register("haptaTreatment")}>
                <option value="member_savings">{t("setf.money.treatSavings")}</option>
                <option value="income">{t("setf.money.treatIncome")}</option>
              </NativeSelect>
            </Field>
            <Field label={t("setf.money.imode")} htmlFor="o-imode">
              <NativeSelect id="o-imode" {...form.register("interestMode")}>
                <option value="rate">{t("setf.money.imodeRate")}</option>
                <option value="manual">{t("setf.money.imodeManual")}</option>
              </NativeSelect>
            </Field>
            <Field label={t("setf.money.irate")} htmlFor="o-irate">
              <Input id="o-irate" inputMode="decimal" {...form.register("interestRate")} />
            </Field>
            <Field label={t("setf.money.ibasis")} htmlFor="o-ibasis" className="sm:col-span-2">
              <NativeSelect id="o-ibasis" {...form.register("interestBasis")}>
                <option value="previous_month_closing">{t("setf.money.ibasisPrev")}</option>
                <option value="hapta_contributions">{t("setf.money.ibasisHapta")}</option>
              </NativeSelect>
            </Field>
            <Field label={t("setf.money.lrate")} htmlFor="o-lrate" hint={t("setf.money.lrateHint", { a: money.short(30000), b: money.short(300000) })}>
              <Input id="o-lrate" inputMode="decimal" {...form.register("loanRate")} />
            </Field>
            <Field label={t("setf.money.ldue")} htmlFor="o-ldue" hint={t("setf.money.ldueHint")}>
              <Input id="o-ldue" type="number" min={1} max={28} {...form.register("loanDueDay")} />
            </Field>
            <label className="flex items-start gap-2.5 rounded-2xl bg-muted/50 px-3 py-2.5 text-sm sm:col-span-2">
              <Checkbox checked={form.watch("allowUpadRequests")} onCheckedChange={(c) => form.setValue("allowUpadRequests", !!c)} />
              <span>{t("setf.money.allowReq")}</span>
            </label>
            <div className="flex flex-col gap-3 rounded-2xl bg-muted/50 px-3 py-2.5 text-sm sm:col-span-2">
              <label className="flex items-start gap-2.5">
                <Checkbox checked={form.watch("upadInstallmentsOn")} onCheckedChange={(c) => form.setValue("upadInstallmentsOn", !!c)} />
                <span>
                  {t("setf.money.instOn")}
                  <span className="block text-xs text-muted-foreground">
                    {t("setf.money.instDesc", { total: money.fmt(8000000), inst: money.fmt(800000), i1: money.fmt(80000), i2: money.fmt(72000) })}
                  </span>
                </span>
              </label>
              {form.watch("upadInstallmentsOn") && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label={t("setf.money.instCount")} htmlFor="o-linst" hint={t("setf.money.instCountHint")}>
                    <Input id="o-linst" type="number" inputMode="numeric" min={2} max={60} {...form.register("upadInstallmentCount")} />
                  </Field>
                  <Field label={t("setf.money.instMin")} htmlFor="o-lmin" hint={t("setf.money.instMinHint", { amt: money.fmt(5000000) })}>
                    <Input id="o-lmin" inputMode="decimal" {...form.register("upadInstallmentMin")} />
                  </Field>
                </div>
              )}
              {form.watch("upadInstallmentsOn") && (
                <div className="flex flex-wrap items-center gap-2 border-t border-foreground/10 pt-2.5">
                  <span className="min-w-0 flex-1 text-xs text-muted-foreground">
                    {t("setf.money.instRunning")}
                  </span>
                  {s.fundLoans.installments?.enabled ? (
                    <StartAllInstallmentsDialog count={s.fundLoans.installments.count} minAmountPaise={s.fundLoans.installments.minAmountPaise ?? 0} />
                  ) : (
                    <span className="rounded-full bg-amber-500/12 px-2.5 py-1 text-xs font-medium text-amber-800 dark:text-amber-300">{t("setf.money.saveFirst")}</span>
                  )}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2 border-t border-foreground/10 pt-2.5">
                <span className="min-w-0 flex-1 text-xs text-muted-foreground">
                  {t("setf.money.stopDesc")}
                </span>
                <ActionButton
                  path={`/orgs/${org.id}/fund-loans/installments/stop-all`}
                  size="xs"
                  variant="ghost"
                  successMessage={t("setf.money.stopOk")}
                  confirm={{ title: t("setf.money.stopTitle"), description: t("setf.money.stopConfirmDesc"), destructive: true, confirmLabel: t("setf.money.stopConfirm") }}
                >
                  {t("setf.money.stopBtn")}
                </ActionButton>
              </div>
            </div>
            <label className="flex items-start gap-2.5 rounded-2xl bg-muted/50 px-3 py-2.5 text-sm sm:col-span-2">
              <Checkbox checked={form.watch("allowWithdrawalExceptions")} onCheckedChange={(c) => form.setValue("allowWithdrawalExceptions", !!c)} />
              <span>{t("setf.money.allowExc")}</span>
            </label>
          </div>
        </FormSection>
      </SettingsPanel>

      <SettingsPanel tab="mandal">
        <FormSection
          icon={<UserPlus />}
          tone="sky"
          title={t("setf.join.title")}
          description={
            <>
              {t("setf.join.codeLabel")} <span className="font-mono font-medium text-foreground">{org.code}</span> — {t("setf.join.desc")}
            </>
          }
        >
          <Field
            label={t("setf.join.nameEn")}
            htmlFor="o-name-en"
            className="mb-3"
            hint={
              org.nameEnglishSuggestion
                ? t("setf.join.nameEnHintFound", { name: org.nameEnglishSuggestion })
                : t("setf.join.nameEnHint")
            }
          >
            <Input id="o-name-en" maxLength={200} placeholder={org.nameEnglishSuggestion ?? t("setf.join.nameEnPh")} {...form.register("nameEnglish")} />
          </Field>
          <div className="grid grid-cols-1 gap-2">
            <label className="flex items-start gap-2.5 rounded-2xl bg-muted/50 px-3 py-2.5 text-sm">
              <Checkbox checked={form.watch("discoverable")} onCheckedChange={(c) => form.setValue("discoverable", !!c)} />
              <span>{t("setf.join.discoverable")}</span>
            </label>
            <label className="flex items-start gap-2.5 rounded-2xl bg-muted/50 px-3 py-2.5 text-sm">
              <Checkbox checked={form.watch("allowJoinRequests")} onCheckedChange={(c) => form.setValue("allowJoinRequests", !!c)} />
              <span>{t("setf.join.requests")}</span>
            </label>
            <label className="flex items-start gap-2.5 rounded-2xl bg-muted/50 px-3 py-2.5 text-sm">
              <Checkbox checked={form.watch("autoCreateMember")} onCheckedChange={(c) => form.setValue("autoCreateMember", !!c)} />
              <span>{t("setf.join.autoMember")}</span>
            </label>
          </div>
        </FormSection>
      </SettingsPanel>

      <SettingsPanel tab="more">
        <FormSection icon={<Landmark />} tone="emerald" title={t("setf.fin.title")} description={t("setf.fin.desc")}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t("setf.fin.fy")} htmlFor="o-fy" hint={t("setf.fin.fyHint")}>
              <NativeSelect id="o-fy" {...form.register("financialYearStartMonth")}>
                {months.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label={t("setf.fin.currency")} htmlFor="o-cur" hint={t("setf.fin.currencyHint")}>
              <NativeSelect id="o-cur" {...form.register("currency")}>
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.name} ({moneyFmt(c.code).symbol})
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label={t("setf.fin.prefix")} htmlFor="o-prefix" hint={t("setf.fin.prefixHint")} error={form.formState.errors["settings.receiptPrefix" as "receiptPrefix"]?.message}>
              <Input id="o-prefix" {...form.register("receiptPrefix")} />
            </Field>
            <Field label={t("setf.fin.threshold")} htmlFor="o-thr" hint={t("setf.fin.thresholdHint")}>
              <Input id="o-thr" inputMode="decimal" {...form.register("threshold")} />
            </Field>
            <label className="flex items-start gap-2.5 rounded-2xl bg-muted/50 px-3 py-2.5 text-sm sm:col-span-2">
              <Checkbox checked={form.watch("requirePaymentVerification")} onCheckedChange={(c) => form.setValue("requirePaymentVerification", !!c)} />
              <span>{t("setf.fin.verify")}</span>
            </label>
          </div>
        </FormSection>
      </SettingsPanel>

      <SettingsPanel tab="money">
        <FormSection icon={<Wallet />} tone="emerald" title={t("setf.pay.title")} description={t("setf.pay.desc")}>
          <label className="flex items-start gap-2.5 rounded-2xl bg-muted/50 px-3 py-2.5 text-sm">
            <Checkbox checked={form.watch("upiEnabled")} onCheckedChange={(c) => form.setValue("upiEnabled", !!c)} />
            <span>
              <b>{t("setf.pay.acceptUpi")}</b> {t("setf.pay.acceptUpiDesc")}
            </span>
          </label>
          {form.watch("upiEnabled") &&
            (upiAccounts.length > 0 ? (
              <Field label={t("setf.pay.into")} htmlFor="o-upi" hint={t("setf.pay.intoHint")}>
                <NativeSelect id="o-upi" {...form.register("upiAccountId")}>
                  {upiAccounts.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.name} · {a.upiId}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            ) : (
              <FormNote tone="warn">
                {t("setf.pay.addFirst")}{" "}
                <Link href={`/org/${org.id}/accounts`} className="font-semibold underline">
                  {t("setf.pay.accounts")}
                </Link>{" "}
                {t("setf.pay.addPath")}
              </FormNote>
            ))}
          <FormNote tone="good">{t("setf.pay.never")}</FormNote>
        </FormSection>
      </SettingsPanel>

      <SettingsPanel tab="team">
        <FormSection icon={<ShieldCheck />} tone="amber" title={t("setf.perms.title")} description={t("setf.perms.desc")}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {PERMS.map((p) => (
              <label key={p} className="flex items-center gap-2.5 rounded-2xl bg-muted/50 px-3 py-2.5 text-sm">
                <Checkbox checked={perms[p]} onCheckedChange={(c) => form.setValue(`managerPermissions.${p}`, !!c)} />
                {t(`setf.perm.${p}`)}
              </label>
            ))}
          </div>
        </FormSection>
      </SettingsPanel>

      <SettingsPanel tab="more">
        <FormSection icon={<Tags />} tone="pink" title={t("setf.cats.title")} description={t("setf.cats.desc")}>
          <div className="flex flex-col gap-2">
            {cats.fields.map((c, i) => (
              <div key={c.id} className="flex items-center gap-2 rounded-2xl bg-muted/50 py-1.5 pr-2 pl-3">
                <Checkbox checked={form.watch(`categories.${i}.isActive`)} onCheckedChange={(v) => form.setValue(`categories.${i}.isActive`, !!v)} aria-label={t("setf.cats.active")} />
                <Input {...form.register(`categories.${i}.name`)} className="flex-1" aria-label={t("setf.cats.name")} />
                <span className="hidden font-mono text-xs text-muted-foreground sm:inline">{c.key}</span>
              </div>
            ))}
            <div className="flex gap-2">
              <Input placeholder={t("setf.cats.new")} value={newCat} onChange={(e) => setNewCat(e.target.value)} />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const name = newCat.trim();
                  if (name.length < 2) return;
                  let key = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40) || "cat";
                  while (cats.fields.some((f) => f.key === key)) key = `${key}_2`;
                  cats.append({ key, name, isActive: true, isNew: true });
                  setNewCat("");
                }}
              >
                <Plus /> {t("setf.cats.add")}
              </Button>
            </div>
          </div>
        </FormSection>
      </SettingsPanel>

      <SettingsPanel tab="more">
        <MoreOptions icon={<SlidersHorizontal />} title={t("setf.adv.title")} description={t("setf.adv.desc")}>
          <Field label={t("setf.adv.tz")} htmlFor="o-tz">
            <Input id="o-tz" {...form.register("timezone")} />
          </Field>
          <Field label={t("setf.adv.rem")} htmlFor="o-rem" hint={t("setf.adv.remHint")}>
            <Input id="o-rem" {...form.register("reminderDays")} />
          </Field>
          <Field label={t("setf.adv.ovd")} htmlFor="o-ovd" hint={t("setf.adv.ovdHint")}>
            <Input id="o-ovd" type="number" min={0} max={90} {...form.register("overdueReminderEveryDays")} />
          </Field>
          <Field label={t("setf.adv.hz")} htmlFor="o-hz">
            <Input id="o-hz" type="number" min={1} max={60} {...form.register("installmentHorizonMonths")} />
          </Field>
        </MoreOptions>
      </SettingsPanel>

      <SettingsPanel tab={FORM_TABS} className="sticky bottom-[calc(6rem+env(safe-area-inset-bottom))] z-10 lg:bottom-4">
        <SubmitButton page pending={pending} icon={<Save />} className="shadow-lg shadow-primary/30">
          {t("setf.save")}
        </SubmitButton>
      </SettingsPanel>
    </form>
  );
}
