"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Building2, Landmark, PiggyBank, Plus, Save, ShieldCheck, SlidersHorizontal, Tags, UserPlus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FormError } from "@/components/app/field";
import { NativeSelect } from "@/components/app/native-select";
import { useApiSubmit } from "@/components/app/use-api-form";
import { FormSection, MoreOptions, SubmitButton, FormNote } from "@/components/app/form-bits";

import type { ManagerPermissions, Org } from "@/lib/types";
import { paiseToRupeeInput } from "@/lib/format";
import { useMoney } from "@/components/app/currency";
import { CURRENCIES, DEFAULT_CURRENCY, moneyFmt } from "@/lib/currency";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const PERMS: { key: keyof ManagerPermissions; label: string }[] = [
  { key: "canVerifyPayments", label: "Verify payments recorded by others" },
  { key: "canManageSchemes", label: "Create and change hapta schemes" },
  { key: "canCreateLoans", label: "Create loan applications" },
  { key: "canApproveLoans", label: "Approve and disburse loans" },
  { key: "canModifyInterest", label: "Set or change interest rates" },
  { key: "canApproveExpenses", label: "Approve expenses (up to the threshold)" },
  { key: "canManageAccounts", label: "Add accounts and record transfers" },
  { key: "canAccessSensitiveReports", label: "View P&L, balance sheet, trial balance and cash flow" },
  { key: "canRecordWithdrawals", label: "Record member withdrawals" },
  { key: "canDistributeInterest", label: "Credit monthly interest to members" },
];

interface V {
  name: string;
  description: string;
  haptaTreatment: "member_savings" | "income";
  interestMode: "manual" | "rate";
  interestRate: string;
  interestBasis: "previous_month_closing" | "hapta_contributions";
  allowWithdrawalExceptions: boolean;
  loanRate: string;
  loanDueDay: number;
  allowUpadRequests: boolean;
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
  logoUrl: string;
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
  paymentMethods: string[];
  categories: { key: string; name: string; isActive: boolean; isNew?: boolean }[];
}

export function SettingsForm({ org }: { org: Org }) {
  const money = useMoney();
  const s = org.settings;
  const form = useForm<V>({
    defaultValues: {
      name: org.name,
      description: org.description ?? "",
      haptaTreatment: s.haptaTreatment,
      interestMode: s.interest.defaultMode,
      interestRate: s.interest.monthlyRate,
      interestBasis: s.interest.basis,
      allowWithdrawalExceptions: s.withdrawals.allowExceptions,
      loanRate: s.fundLoans.defaultMonthlyRate,
      loanDueDay: s.fundLoans.dueDay,
      allowUpadRequests: s.fundLoans.allowMemberRequests ?? true,
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
      logoUrl: org.logoUrl ?? "",
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
      paymentMethods: s.paymentMethods,
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
    if (days.some((d) => !Number.isInteger(d) || d < 0 || d > 30)) return setError("Reminder days must be whole numbers between 0 and 30");
    if (!/^\d+(\.\d{1,2})?$/.test(v.threshold || "0")) return setError("Enter a valid approval threshold");
    if (!/^\d{1,3}(\.\d{1,4})?$/.test(v.interestRate.trim())) return setError("Enter the default interest rate like 1 or 0.75");
    if (!/^\d{1,3}(\.\d{1,4})?$/.test(v.loanRate.trim())) return setError("Enter the default upad interest rate like 2 or 10");
    if (!(Number(v.loanDueDay) >= 1 && Number(v.loanDueDay) <= 28)) return setError("Upad interest due day must be between 1 and 28");
    const opt = (x: string) => (x.trim() ? x.trim() : undefined);
    submit(
      {
        path: `/orgs/${org.id}`,
        method: "PATCH",
        body: {
          name: v.name,
          description: v.description.trim(),
          address: opt(v.address),
          city: opt(v.city),
          state: opt(v.state),
          pincode: v.pincode.trim(),
          contactPhone: v.contactPhone.trim(),
          contactEmail: v.contactEmail.trim(),
          registrationNumber: opt(v.registrationNumber),
          registrationDetails: opt(v.registrationDetails),
          logoUrl: v.logoUrl.trim(),
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
            paymentMethods: v.paymentMethods,
            expenseCategories: v.categories.map(({ key, name, isActive }) => ({ key, name, isActive })),
            haptaTreatment: v.haptaTreatment,
            interest: { defaultMode: v.interestMode, monthlyRate: v.interestRate.trim(), basis: v.interestBasis },
            withdrawals: { allowExceptions: v.allowWithdrawalExceptions },
            fundLoans: { defaultMonthlyRate: v.loanRate.trim(), dueDay: Number(v.loanDueDay), allowMemberRequests: v.allowUpadRequests },
            membership: { discoverable: v.discoverable, allowJoinRequests: v.allowJoinRequests, autoCreateMember: v.autoCreateMember },
          },
        },
      },
      { success: "Settings saved" },
    );
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={error} />
      <FormSection icon={<Building2 />} tone="indigo" title="Organization profile" description="Shown on receipts and reports.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Name" htmlFor="o-name" className="sm:col-span-2">
            <Input id="o-name" {...form.register("name")} />
          </Field>
          <Field label="Description" htmlFor="o-desc" className="sm:col-span-2" hint="Shown when people search for your Mandal to join.">
            <Textarea id="o-desc" rows={2} maxLength={500} {...form.register("description")} />
          </Field>
          <Field label="Address" htmlFor="o-addr" className="sm:col-span-2">
            <Input id="o-addr" {...form.register("address")} />
          </Field>
          <Field label="City" htmlFor="o-city">
            <Input id="o-city" {...form.register("city")} />
          </Field>
          <Field label="State" htmlFor="o-state">
            <Input id="o-state" {...form.register("state")} />
          </Field>
          <Field label="PIN code" htmlFor="o-pin" error={form.formState.errors.pincode?.message}>
            <Input id="o-pin" inputMode="numeric" maxLength={6} {...form.register("pincode")} />
          </Field>
          <Field label="Contact phone" htmlFor="o-phone" error={form.formState.errors.contactPhone?.message}>
            <Input id="o-phone" type="tel" {...form.register("contactPhone")} />
          </Field>
          <Field label="Contact email" htmlFor="o-email" error={form.formState.errors.contactEmail?.message}>
            <Input id="o-email" type="email" {...form.register("contactEmail")} />
          </Field>
          <Field label="Registration number" htmlFor="o-reg">
            <Input id="o-reg" {...form.register("registrationNumber")} />
          </Field>
          <Field label="Registration details (e.g. 12A/80G)" htmlFor="o-regd" className="sm:col-span-2">
            <Textarea id="o-regd" rows={2} {...form.register("registrationDetails")} />
          </Field>
          <Field label="Logo URL" htmlFor="o-logo" className="sm:col-span-2" error={form.formState.errors.logoUrl?.message}>
            <Input id="o-logo" type="url" {...form.register("logoUrl")} />
          </Field>
        </div>
      </FormSection>

      <FormSection icon={<PiggyBank />} tone="violet" title="Savings, upad, interest & withdrawals" description="The monthly hapta amount is changed from the Monthly hapta screen.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Hapta is treated as" htmlFor="o-treat" className="sm:col-span-2" hint="Can't be changed once hapta has been collected.">
            <NativeSelect id="o-treat" {...form.register("haptaTreatment")}>
              <option value="member_savings">Members&apos; savings (each member has a balance they can withdraw)</option>
              <option value="income">Mandal income (contributions are not refundable)</option>
            </NativeSelect>
          </Field>
          <Field label="Default interest method" htmlFor="o-imode">
            <NativeSelect id="o-imode" {...form.register("interestMode")}>
              <option value="rate">Rate % per month</option>
              <option value="manual">Enter amounts manually</option>
            </NativeSelect>
          </Field>
          <Field label="Default rate (% per month)" htmlFor="o-irate">
            <Input id="o-irate" inputMode="decimal" {...form.register("interestRate")} />
          </Field>
          <Field label="Interest is calculated on" htmlFor="o-ibasis" className="sm:col-span-2">
            <NativeSelect id="o-ibasis" {...form.register("interestBasis")}>
              <option value="previous_month_closing">Member&apos;s balance at the end of the previous month</option>
              <option value="hapta_contributions">Hapta paid up to the end of the previous month (no compounding)</option>
            </NativeSelect>
          </Field>
          <Field label="Upad: default interest (% per month)" htmlFor="o-lrate" hint={`e.g. 10 → ${money.short(30000)} a month on ${money.short(300000)}. Can be changed for each upad.`}>
            <Input id="o-lrate" inputMode="decimal" {...form.register("loanRate")} />
          </Field>
          <Field label="Upad interest due by day" htmlFor="o-ldue" hint="Day of the month (1–28)">
            <Input id="o-ldue" type="number" min={1} max={28} {...form.register("loanDueDay")} />
          </Field>
          <label className="flex items-start gap-2.5 rounded-2xl bg-muted/50 px-3 py-2.5 text-sm sm:col-span-2">
            <Checkbox checked={form.watch("allowUpadRequests")} onCheckedChange={(c) => form.setValue("allowUpadRequests", !!c)} />
            <span>Members can request upad in the app (up to the cash available; an admin approves each request)</span>
          </label>
          <label className="flex items-start gap-2.5 rounded-2xl bg-muted/50 px-3 py-2.5 text-sm sm:col-span-2">
            <Checkbox checked={form.watch("allowWithdrawalExceptions")} onCheckedChange={(c) => form.setValue("allowWithdrawalExceptions", !!c)} />
            <span>Allow admins to approve a withdrawal above a member&apos;s balance (a reason is required and recorded).</span>
          </label>
        </div>
      </FormSection>

      <FormSection
        icon={<UserPlus />}
        tone="sky"
        title="Joining"
        description={
          <>
            Join code: <span className="font-mono font-medium text-foreground">{org.code}</span> — share it, or invite people from Users &amp; joining.
          </>
        }
      >
        <div className="grid grid-cols-1 gap-2">
          <label className="flex items-start gap-2.5 rounded-2xl bg-muted/50 px-3 py-2.5 text-sm">
            <Checkbox checked={form.watch("discoverable")} onCheckedChange={(c) => form.setValue("discoverable", !!c)} />
            <span>People can find this Mandal by searching its name</span>
          </label>
          <label className="flex items-start gap-2.5 rounded-2xl bg-muted/50 px-3 py-2.5 text-sm">
            <Checkbox checked={form.watch("allowJoinRequests")} onCheckedChange={(c) => form.setValue("allowJoinRequests", !!c)} />
            <span>Accept join requests (you approve or reject each one)</span>
          </label>
          <label className="flex items-start gap-2.5 rounded-2xl bg-muted/50 px-3 py-2.5 text-sm">
            <Checkbox checked={form.watch("autoCreateMember")} onCheckedChange={(c) => form.setValue("autoCreateMember", !!c)} />
            <span>When someone is approved, add them as a member and start their monthly hapta</span>
          </label>
        </div>
      </FormSection>

      <FormSection icon={<Landmark />} tone="emerald" title="Financial settings" description="Year, currency, receipts and approvals.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Financial year starts" htmlFor="o-fy" hint="Used for receipt numbering, quarters and default report periods.">
            <NativeSelect id="o-fy" {...form.register("financialYearStartMonth")}>
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Currency" htmlFor="o-cur" hint="Amounts are not converted, so it can only be changed before any money is recorded.">
            <NativeSelect id="o-cur" {...form.register("currency")}>
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name} ({moneyFmt(c.code).symbol})
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Receipt prefix" htmlFor="o-prefix" hint="e.g. RCPT → RCPT/2026-27/000001" error={form.formState.errors["settings.receiptPrefix" as "receiptPrefix"]?.message}>
            <Input id="o-prefix" {...form.register("receiptPrefix")} />
          </Field>
          <Field label={`Expense approval threshold (${money.symbol})`} htmlFor="o-thr" hint="Above this, only admins can approve. 0 = every expense needs approval.">
            <Input id="o-thr" inputMode="decimal" {...form.register("threshold")} />
          </Field>
          <label className="flex items-start gap-2.5 rounded-2xl bg-muted/50 px-3 py-2.5 text-sm sm:col-span-2">
            <Checkbox checked={form.watch("requirePaymentVerification")} onCheckedChange={(c) => form.setValue("requirePaymentVerification", !!c)} />
            <span>Payments recorded by users without verification rights stay pending until verified (they don&apos;t count in balances until then).</span>
          </label>
        </div>
      </FormSection>

      <FormSection icon={<Wallet />} tone="emerald" title="Payment methods" description="How money is recorded in this Mandal.">
        <FormNote tone="good">
          <b>Cash only for now.</b> MandalHisab records cash collected and paid out by hand. It doesn&apos;t take online payments, UPI, bank transfers or cheques.
        </FormNote>
      </FormSection>

      <FormSection icon={<ShieldCheck />} tone="amber" title="Manager permissions" description="Managers can always record collections, donations and expenses for approval, manage members and view basic reports.">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PERMS.map((p) => (
            <label key={p.key} className="flex items-center gap-2.5 rounded-2xl bg-muted/50 px-3 py-2.5 text-sm">
              <Checkbox checked={perms[p.key]} onCheckedChange={(c) => form.setValue(`managerPermissions.${p.key}`, !!c)} />
              {p.label}
            </label>
          ))}
        </div>
      </FormSection>

      <FormSection icon={<Tags />} tone="pink" title="Expense categories" description="Categories used in the ledger cannot be deleted — deactivate them instead.">
        <div className="flex flex-col gap-2">
          {cats.fields.map((c, i) => (
            <div key={c.id} className="flex items-center gap-2 rounded-2xl bg-muted/50 py-1.5 pr-2 pl-3">
              <Checkbox checked={form.watch(`categories.${i}.isActive`)} onCheckedChange={(v) => form.setValue(`categories.${i}.isActive`, !!v)} aria-label="Active" />
              <Input {...form.register(`categories.${i}.name`)} className="flex-1" aria-label="Category name" />
              <span className="hidden font-mono text-xs text-muted-foreground sm:inline">{c.key}</span>
            </div>
          ))}
          <div className="flex gap-2">
            <Input placeholder="New category" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
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
              <Plus /> Add
            </Button>
          </div>
        </div>
      </FormSection>

      <MoreOptions icon={<SlidersHorizontal />} title="Reminders & advanced" description="Timezone, reminder days and how far ahead open-ended installments are made.">
        <Field label="Timezone" htmlFor="o-tz">
          <Input id="o-tz" {...form.register("timezone")} />
        </Field>
        <Field label="Reminder days before due date" htmlFor="o-rem" hint="Comma separated, e.g. 3, 0 (0 = on the due day)">
          <Input id="o-rem" {...form.register("reminderDays")} />
        </Field>
        <Field label="Repeat overdue reminder every (days)" htmlFor="o-ovd" hint="0 = no overdue reminders">
          <Input id="o-ovd" type="number" min={0} max={90} {...form.register("overdueReminderEveryDays")} />
        </Field>
        <Field label="Generate open-ended installments ahead (months)" htmlFor="o-hz">
          <Input id="o-hz" type="number" min={1} max={60} {...form.register("installmentHorizonMonths")} />
        </Field>
      </MoreOptions>

      <div className="sticky bottom-20 z-10 lg:bottom-4">
        <SubmitButton page pending={pending} icon={<Save />} className="shadow-lg shadow-primary/30">
          Save settings
        </SubmitButton>
      </div>
    </form>
  );
}
