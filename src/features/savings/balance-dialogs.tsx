"use client";

import { useT } from "@/i18n/client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Minus, PiggyBank, Plus, Scale } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/app/field";
import { FormDialog, useDialogClose } from "@/components/app/form-dialog";
import { AmountInput, ChoicePills, FormNote, SubmitButton } from "@/components/app/form-bits";
import { useApiSubmit } from "@/components/app/use-api-form";
import { newIdempotencyKey, todayISO } from "@/lib/format";
import { rupees } from "@/lib/schemas";

const OpeningSchema = z.object({ amount: rupees, date: z.string().min(10), note: z.string().max(300).optional() });

function OpeningForm({ memberId }: { memberId: string }) {
  const t = useT();
  const { orgId } = useParams<{ orgId: string }>();
  const close = useDialogClose();
  const form = useForm<z.infer<typeof OpeningSchema>>({ resolver: zodResolver(OpeningSchema), defaultValues: { amount: "", date: todayISO(), note: "" } });
  const { submit, pending, error } = useApiSubmit(form);
  const e = form.formState.errors;
  return (
    <form noValidate className="grid grid-cols-1 gap-3" onSubmit={form.handleSubmit((v) => submit({ path: `/orgs/${orgId}/members/${memberId}/opening`, body: { ...v, note: v.note || undefined } }, { success: t("int.o.saved"), onSuccess: close }))}>
      <FormError message={error} />
      <Field label={t("int.o.amount")} htmlFor="ob-amt" error={e.amount?.message}>
        <AmountInput id="ob-amt" placeholder="0" {...form.register("amount")} />
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={t("int.o.asOn")} htmlFor="ob-date">
          <Input id="ob-date" type="date" {...form.register("date")} />
        </Field>
        <Field label={t("ap.noteOpt")} htmlFor="ob-note">
          <Input id="ob-note" placeholder={t("int.o.notePh")} {...form.register("note")} />
        </Field>
      </div>
      <FormNote tone="warn">{t("int.o.warn")}</FormNote>
      <SubmitButton pending={pending} icon={<CheckCircle2 />}>
        {t("int.o.save")}
      </SubmitButton>
    </form>
  );
}

export function OpeningBalanceDialog({ memberId }: { memberId: string }) {
  const t = useT();
  return (
    <FormDialog trigger={t("int.o.trigger")} triggerVariant="outline" triggerSize="sm" title={t("int.o.title")} icon={<PiggyBank />} tone="emerald">
      <OpeningForm memberId={memberId} />
    </FormDialog>
  );
}

const AdjustSchema = z.object({ direction: z.enum(["credit", "debit"]), amount: rupees, date: z.string().min(10), reason: z.string().trim().min(3, "int.a.reason").max(500) });

function AdjustForm({ memberId }: { memberId: string }) {
  const t = useT();
  const { orgId } = useParams<{ orgId: string }>();
  const close = useDialogClose();
  const [key] = useState(() => newIdempotencyKey("adj"));
  const form = useForm<z.infer<typeof AdjustSchema>>({ resolver: zodResolver(AdjustSchema), defaultValues: { direction: "credit", amount: "", date: todayISO(), reason: "" } });
  const { submit, pending, error } = useApiSubmit(form);
  const e = form.formState.errors;
  const direction = useWatch({ control: form.control, name: "direction" });
  return (
    <form noValidate className="grid grid-cols-1 gap-3" onSubmit={form.handleSubmit((v) => submit({ path: `/orgs/${orgId}/members/${memberId}/adjustments`, body: { ...v, idempotencyKey: key } }, { success: t("int.a.saved"), onSuccess: close }))}>
      <FormError message={error} />
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t("int.a.type")}</span>
        <input type="hidden" {...form.register("direction")} />
        <ChoicePills
          label={t("int.a.type")}
          value={direction}
          onChange={(v) => form.setValue("direction", v, { shouldDirty: true })}
          options={[
            { value: "credit" as const, label: t("int.a.add"), icon: <Plus /> },
            { value: "debit" as const, label: t("int.a.reduce"), icon: <Minus /> },
          ]}
        />
      </div>
      <Field label={t("int.a.amount")} htmlFor="ad-amt" error={e.amount?.message}>
        <AmountInput id="ad-amt" placeholder="0" {...form.register("amount")} />
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={t("ap.date")} htmlFor="ad-date">
          <Input id="ad-date" type="date" max={todayISO()} {...form.register("date")} />
        </Field>
        <Field label={t("ap.reason")} htmlFor="ad-reason" error={e.reason?.message}>
          <Input id="ad-reason" placeholder={t("int.a.reasonPh")} {...form.register("reason")} />
        </Field>
      </div>
      <FormNote>{t("int.a.note")}</FormNote>
      <SubmitButton pending={pending} icon={<CheckCircle2 />}>
        {t("int.a.save")}
      </SubmitButton>
    </form>
  );
}

export function AdjustBalanceDialog({ memberId }: { memberId: string }) {
  const t = useT();
  return (
    <FormDialog trigger={t("int.a.trigger")} triggerVariant="outline" triggerSize="sm" title={t("int.a.title")} icon={<Scale />} tone="violet" description={t("int.a.desc")}>
      <AdjustForm memberId={memberId} />
    </FormDialog>
  );
}
