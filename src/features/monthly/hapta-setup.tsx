"use client";

import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarCheck2, CalendarDays, Pencil, Rocket } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FormError } from "@/components/app/field";
import { FormDialog, useDialogClose } from "@/components/app/form-dialog";
import { useApiSubmit } from "@/components/app/use-api-form";
import { AmountInput, FormNote, SubmitButton } from "@/components/app/form-bits";
import { rupees } from "@/lib/schemas";
import { todayISO } from "@/lib/format";
import { useT } from "@/i18n/client";

const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Choose a month");

const SetupSchema = z.object({
  amount: rupees,
  startMonth: month,
  dueDay: z.coerce.number().int().min(1, "1–28").max(28, "1–28"),
  enrollAllActive: z.boolean(),
});

/** First-time set-up of the Mandal's monthly hapta (amount, start month, due day). */
export function HaptaSetupForm({ inline = false }: { inline?: boolean }) {
  const { orgId } = useParams<{ orgId: string }>();
  const close = useDialogClose();
  const t = useT();
  const form = useForm<z.input<typeof SetupSchema>, unknown, z.output<typeof SetupSchema>>({
    resolver: zodResolver(SetupSchema),
    defaultValues: { amount: "", startMonth: todayISO().slice(0, 7), dueDay: 10, enrollAllActive: true },
  });
  const { submit, pending, error } = useApiSubmit(form);
  const e = form.formState.errors;
  return (
    <form
      noValidate
      className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      onSubmit={form.handleSubmit((v) => submit({ path: `/orgs/${orgId}/monthly-hapta`, body: v }, { success: t("hs.setUpDone"), onSuccess: inline ? undefined : close }))}
    >
      <div className="empty:hidden sm:col-span-2">
        <FormError message={error} />
      </div>
      <Field label={t("hs.perMember")} htmlFor="hs-amt" error={e.amount?.message} className="sm:col-span-2">
        <AmountInput id="hs-amt" placeholder="500" {...form.register("amount")} />
      </Field>
      <Field label={t("hs.startMonth")} htmlFor="hs-start" error={e.startMonth?.message}>
        <Input id="hs-start" type="month" {...form.register("startMonth")} />
      </Field>
      <Field label={t("hs.dueDay")} htmlFor="hs-due" error={e.dueDay?.message} hint={t("hs.dueDayHint")}>
        <Input id="hs-due" type="number" min={1} max={28} {...form.register("dueDay")} />
      </Field>
      <label className="flex items-center gap-2 rounded-2xl bg-muted/50 px-3 py-2.5 text-sm sm:col-span-2">
        <Checkbox checked={form.watch("enrollAllActive")} onCheckedChange={(c) => form.setValue("enrollAllActive", !!c)} />
        {t("hs.enrollAll")}
      </label>
      <SubmitButton pending={pending} icon={<Rocket />} className="sm:col-span-2">
        {t("hs.start")}
      </SubmitButton>
    </form>
  );
}

const ChangeSchema = z.object({ amount: rupees, effectiveMonth: month, reason: z.string().max(300).optional() });

function ChangeForm({ currentRupees, nextMonth }: { currentRupees: string; nextMonth: string }) {
  const { orgId } = useParams<{ orgId: string }>();
  const close = useDialogClose();
  const t = useT();
  const form = useForm<z.infer<typeof ChangeSchema>>({ resolver: zodResolver(ChangeSchema), defaultValues: { amount: currentRupees, effectiveMonth: nextMonth, reason: "" } });
  const { submit, pending, error } = useApiSubmit(form);
  const e = form.formState.errors;
  return (
    <form
      noValidate
      className="grid grid-cols-1 gap-3"
      onSubmit={form.handleSubmit((v) =>
        submit<{ effectiveMonth: string; installmentsUpdated: number }>(
          { path: `/orgs/${orgId}/monthly-hapta`, method: "PATCH", body: { ...v, reason: v.reason || undefined } },
          { success: t("hs.updated"), onSuccess: close },
        ),
      )}
    >
      <FormError message={error} />
      <Field label={t("hs.newAmount")} htmlFor="hc-amt" error={e.amount?.message}>
        <AmountInput id="hc-amt" {...form.register("amount")} />
      </Field>
      <Field label={t("hs.appliesFrom")} htmlFor="hc-month" error={e.effectiveMonth?.message}>
        <Input id="hc-month" type="month" min={todayISO().slice(0, 7)} {...form.register("effectiveMonth")} />
      </Field>
      <Field label={t("hs.reason")} htmlFor="hc-reason">
        <Input id="hc-reason" placeholder={t("hs.reasonPh")} {...form.register("reason")} />
      </Field>
      <FormNote>{t("hs.keepNote")}</FormNote>
      <SubmitButton pending={pending} icon={<CalendarCheck2 />}>
        {t("hs.change")}
      </SubmitButton>
    </form>
  );
}

export function ChangeHaptaDialog({ currentRupees, nextMonth }: { currentRupees: string; nextMonth: string }) {
  const t = useT();
  return (
    <FormDialog trigger={<><Pencil /> {t("hs.change")}</>} triggerVariant="outline" triggerSize="sm" title={t("hs.changeTitle")} description={t("hs.changeDesc")} icon={<Pencil />} tone="indigo">
      <ChangeForm currentRupees={currentRupees} nextMonth={nextMonth} />
    </FormDialog>
  );
}

export function SetupHaptaDialog() {
  const t = useT();
  return (
    <FormDialog trigger={t("hs.setUp")} title={t("hs.setUpTitle")} wide icon={<CalendarDays />} tone="indigo">
      <HaptaSetupForm />
    </FormDialog>
  );
}
