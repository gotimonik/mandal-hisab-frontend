"use client";

import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlarmClock, CalendarDays, CheckCircle2, FileText, SlidersHorizontal, UserCog, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FormError } from "@/components/app/field";
import { NativeSelect } from "@/components/app/native-select";
import { useApiSubmit } from "@/components/app/use-api-form";
import { AmountInput, ChoicePills, FormSection, MoreOptions, SubmitButton } from "@/components/app/form-bits";
import { FREQUENCY_LABEL, todayISO } from "@/lib/format";
import { optionalRupees, rupees } from "@/lib/schemas";
import { useMoney } from "@/components/app/currency";

const MONTH_BASED = ["monthly", "bimonthly", "every_three_months", "quarterly", "half_yearly", "yearly"];

const Schema = z
  .object({
    name: z.string().trim().min(2, "Enter a scheme name").max(120),
    description: z.string().max(1000).optional(),
    startDate: z.string().min(10, "Pick a start date"),
    endDate: z.string().optional(),
    frequency: z.string(),
    customUnit: z.enum(["day", "week", "month"]),
    customCount: z.coerce.number().int().min(1).max(365),
    dueDay: z.coerce.number().int().min(0).max(31),
    amount: rupees,
    amountMode: z.enum(["fixed", "member_specific"]),
    limitBy: z.enum(["count", "target", "end", "open"]),
    numberOfInstallments: z.coerce.number().int().min(0).max(600),
    targetAmount: optionalRupees,
    graceDays: z.coerce.number().int().min(0).max(90),
    lateFeeEnabled: z.boolean(),
    lateFeeType: z.enum(["fixed", "percent"]),
    lateFeeValue: optionalRupees,
    lateFeeGrace: z.coerce.number().int().min(0).max(90),
    status: z.enum(["active", "draft"]),
    notes: z.string().max(2000).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.limitBy === "count" && v.numberOfInstallments < 1) ctx.addIssue({ code: "custom", path: ["numberOfInstallments"], message: "Enter the number of installments" });
    if (v.limitBy === "target" && !v.targetAmount) ctx.addIssue({ code: "custom", path: ["targetAmount"], message: "Enter the target amount" });
    if (v.limitBy === "end" && !v.endDate) ctx.addIssue({ code: "custom", path: ["endDate"], message: "Pick an end date" });
    if (v.lateFeeEnabled && !v.lateFeeValue) ctx.addIssue({ code: "custom", path: ["lateFeeValue"], message: "Enter the late fee" });
  });

type In = z.input<typeof Schema>;
type Out = z.output<typeof Schema>;

export function SchemeForm({ orgId }: { orgId: string }) {
  const money = useMoney();
  const router = useRouter();
  const form = useForm<In, unknown, Out>({
    resolver: zodResolver(Schema),
    defaultValues: {
      name: "",
      description: "",
      startDate: todayISO(),
      endDate: "",
      frequency: "monthly",
      customUnit: "day",
      customCount: 15,
      dueDay: 10,
      amount: "",
      amountMode: "fixed",
      limitBy: "count",
      numberOfInstallments: 12,
      targetAmount: "",
      graceDays: 0,
      lateFeeEnabled: false,
      lateFeeType: "fixed",
      lateFeeValue: "",
      lateFeeGrace: 0,
      status: "active",
      notes: "",
    },
  });
  const { submit, pending, error } = useApiSubmit(form);
  const [frequency, limitBy, lateFeeEnabled, lateFeeType, customUnit, amountMode, status] = useWatch({ control: form.control, name: ["frequency", "limitBy", "lateFeeEnabled", "lateFeeType", "customUnit", "amountMode", "status"] });
  const monthBased = MONTH_BASED.includes(frequency) || (frequency === "custom" && customUnit === "month");
  const e = form.formState.errors;

  const onSubmit = form.handleSubmit((v) => {
    const lateValue = v.lateFeeValue ? (v.lateFeeType === "fixed" ? Math.round(Number(v.lateFeeValue) * 100) : Math.round(Number(v.lateFeeValue) * 100)) : 0;
    const body = {
      name: v.name,
      description: v.description || undefined,
      startDate: v.startDate,
      endDate: v.limitBy === "end" ? v.endDate : null,
      frequency: v.frequency,
      customInterval: v.frequency === "custom" ? { unit: v.customUnit, count: v.customCount } : null,
      dueDay: monthBased && v.dueDay > 0 ? v.dueDay : null,
      amount: v.amount,
      amountMode: v.amountMode,
      numberOfInstallments: v.frequency === "one_time" ? 1 : v.limitBy === "count" ? v.numberOfInstallments : null,
      targetAmount: v.limitBy === "target" ? v.targetAmount : null,
      graceDays: v.graceDays,
      // fixed fee in paise; percent in basis points (1% = 100)
      lateFee: { enabled: v.lateFeeEnabled, type: v.lateFeeType, value: lateValue, graceDays: v.lateFeeGrace },
      status: v.status,
      notes: v.notes || undefined,
    };
    submit<{ _id: string }>({ path: `/orgs/${orgId}/schemes`, body }, { success: "Scheme created", onSuccess: (s) => router.push(`/org/${orgId}/schemes/${s._id}`) });
  });

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormError message={error} />
      <FormSection icon={<FileText />} tone="indigo" title="Basics" description="What the scheme is called and how much each installment is.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Scheme name" htmlFor="s-name" error={e.name?.message} className="sm:col-span-2">
            <Input id="s-name" placeholder="e.g. Monthly hapta 2026-27" {...form.register("name")} />
          </Field>
          <Field label={`Amount per installment (${money.symbol})`} htmlFor="s-amt" error={e.amount?.message} className="sm:col-span-2">
            <AmountInput id="s-amt" placeholder="1000" {...form.register("amount")} />
          </Field>
          <Field label="Amount type" hint="Member-specific lets you set a different amount per member when enrolling." className="sm:col-span-2">
            <ChoicePills
              label="Amount type"
              value={amountMode}
              onChange={(v) => form.setValue("amountMode", v, { shouldDirty: true })}
              options={[
                { value: "fixed" as const, label: "Same for every member", icon: <Users /> },
                { value: "member_specific" as const, label: "Member-specific", icon: <UserCog /> },
              ]}
            />
          </Field>
          <Field label="Description" htmlFor="s-desc" className="sm:col-span-2">
            <Textarea id="s-desc" rows={2} {...form.register("description")} />
          </Field>
        </div>
      </FormSection>
      <FormSection icon={<CalendarDays />} tone="sky" title="Schedule" description="When installments fall due and how long the scheme runs.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Frequency" htmlFor="s-freq">
            <NativeSelect id="s-freq" {...form.register("frequency")}>
              {Object.entries(FREQUENCY_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Start date" htmlFor="s-start" error={e.startDate?.message}>
            <Input id="s-start" type="date" {...form.register("startDate")} />
          </Field>
          {frequency === "custom" && (
            <div className="grid grid-cols-2 gap-3 sm:col-span-2">
              <Field label="Every" htmlFor="s-ccount" error={e.customCount?.message}>
                <Input id="s-ccount" type="number" min={1} {...form.register("customCount")} />
              </Field>
              <Field label="Unit" htmlFor="s-cunit">
                <NativeSelect id="s-cunit" {...form.register("customUnit")}>
                  <option value="day">Days</option>
                  <option value="week">Weeks</option>
                  <option value="month">Months</option>
                </NativeSelect>
              </Field>
            </div>
          )}
          {monthBased && (
            <Field label="Due day of month" htmlFor="s-dueday" hint="1–31. If a month is shorter (e.g. 31st in February) the last day is used. 0 = same day as start date." error={e.dueDay?.message}>
              <Input id="s-dueday" type="number" min={0} max={31} {...form.register("dueDay")} />
            </Field>
          )}
          {frequency !== "one_time" && (
            <>
              <Field label="Scheme length" htmlFor="s-limit">
                <NativeSelect id="s-limit" {...form.register("limitBy")}>
                  <option value="count">Fixed number of installments</option>
                  <option value="target">Until a target amount</option>
                  <option value="end">Until an end date</option>
                  <option value="open">Open-ended</option>
                </NativeSelect>
              </Field>
              {limitBy === "count" && (
                <Field label="Number of installments" htmlFor="s-count" error={e.numberOfInstallments?.message}>
                  <Input id="s-count" type="number" min={1} {...form.register("numberOfInstallments")} />
                </Field>
              )}
              {limitBy === "target" && (
                <Field label={`Target amount per member (${money.symbol})`} htmlFor="s-target" error={e.targetAmount?.message}>
                  <Input id="s-target" inputMode="decimal" {...form.register("targetAmount")} />
                </Field>
              )}
              {limitBy === "end" && (
                <Field label="End date" htmlFor="s-end" error={e.endDate?.message}>
                  <Input id="s-end" type="date" {...form.register("endDate")} />
                </Field>
              )}
            </>
          )}
        </div>
      </FormSection>
      <FormSection icon={<AlarmClock />} tone="rose" title="Late fee" description="Optional one-time fee when an installment goes overdue.">
        <label className="flex items-center gap-2 rounded-2xl bg-muted/50 px-3 py-2.5 text-sm">
          <Checkbox checked={!!lateFeeEnabled} onCheckedChange={(c) => form.setValue("lateFeeEnabled", !!c)} /> Charge a one-time late fee on overdue installments
        </label>
        {lateFeeEnabled && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Type" className="sm:col-span-3">
              <ChoicePills
                label="Late fee type"
                value={lateFeeType}
                onChange={(v) => form.setValue("lateFeeType", v, { shouldDirty: true })}
                options={[
                  { value: "fixed" as const, label: `Fixed amount (${money.symbol})` },
                  { value: "percent" as const, label: "% of installment" },
                ]}
              />
            </Field>
            <Field label={lateFeeType === "fixed" ? `Fee (${money.symbol})` : "Percent (%)"} htmlFor="s-lfval" error={e.lateFeeValue?.message}>
              <Input id="s-lfval" inputMode="decimal" {...form.register("lateFeeValue")} />
            </Field>
            <Field label="Days after due date" htmlFor="s-lfgrace">
              <Input id="s-lfgrace" type="number" min={0} {...form.register("lateFeeGrace")} />
            </Field>
          </div>
        )}
      </FormSection>
      <MoreOptions icon={<SlidersHorizontal />} title="More options" description="Grace days, draft status and notes — the defaults suit most schemes." defaultOpen={!!(e.graceDays || e.notes)}>
        <Field label="Grace days before overdue" htmlFor="s-grace" error={e.graceDays?.message}>
          <Input id="s-grace" type="number" min={0} max={90} {...form.register("graceDays")} />
        </Field>
        <Field label="Status" hint="Draft schemes don't generate installments until activated.">
          <ChoicePills
            label="Status"
            value={status}
            onChange={(v) => form.setValue("status", v, { shouldDirty: true })}
            options={[
              { value: "active" as const, label: "Active" },
              { value: "draft" as const, label: "Draft" },
            ]}
          />
        </Field>
        <Field label="Notes" htmlFor="s-notes" className="sm:col-span-2">
          <Textarea id="s-notes" rows={2} {...form.register("notes")} />
        </Field>
      </MoreOptions>
      <SubmitButton page pending={pending} icon={<CheckCircle2 />}>
        Create scheme
      </SubmitButton>
    </form>
  );
}
