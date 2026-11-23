"use client";

import { useT } from "@/i18n/client";
import type { Key } from "@/i18n/core";
import { useParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarClock, CheckCircle2, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/app/field";
import { NativeSelect } from "@/components/app/native-select";
import { FormDialog, useDialogClose } from "@/components/app/form-dialog";
import { useApiSubmit } from "@/components/app/use-api-form";
import { formatDate, isoDate } from "@/lib/format";
import { optionalRupees } from "@/lib/schemas";
import type { Installment } from "@/lib/types";
import { useMoney } from "@/components/app/currency";
import { MemberAvatar } from "@/components/app/bits";
import { AmountInput, SubmitButton } from "@/components/app/form-bits";

const Schema = z
  .object({
    action: z.enum(["set_due_date", "set_amount", "defer", "waive", "cancel", "reactivate"]),
    dueDate: z.string().optional(),
    amount: optionalRupees,
    reason: z.string().trim().min(3, "inst.a.reason").max(500),
  })
  .superRefine((v, ctx) => {
    if (v.action === "set_due_date" && !v.dueDate) ctx.addIssue({ code: "custom", path: ["dueDate"], message: "inst.a.pickDate" });
    if (v.action === "set_amount" && !v.amount) ctx.addIssue({ code: "custom", path: ["amount"], message: "inst.a.enterAmount" });
  });

function ActionForm({ inst }: { inst: Installment }) {
  const money = useMoney();
  const t = useT();
  const { orgId } = useParams<{ orgId: string }>();
  const close = useDialogClose();
  const active = inst.state === "active";
  const form = useForm<z.input<typeof Schema>, unknown, z.output<typeof Schema>>({
    resolver: zodResolver(Schema),
    defaultValues: { action: active ? "set_due_date" : "reactivate", dueDate: isoDate(inst.dueDate), amount: "", reason: "" },
  });
  const { submit, pending, error } = useApiSubmit(form);
  const action = useWatch({ control: form.control, name: "action" });
  const e = form.formState.errors;
  return (
    <form
      noValidate
      className="flex flex-col gap-3"
      onSubmit={form.handleSubmit((v) =>
        submit(
          {
            path: `/orgs/${orgId}/installments/${inst._id}`,
            method: "PATCH",
            body: { action: v.action, reason: v.reason, dueDate: ["set_due_date", "defer", "reactivate"].includes(v.action) && v.dueDate ? v.dueDate : undefined, amount: v.action === "set_amount" ? v.amount : undefined },
          },
          { success: t("inst.a.updated"), onSuccess: close },
        ),
      )}
    >
      <div className="flex items-center gap-3 rounded-2xl bg-muted/50 p-3 text-sm">
        <MemberAvatar name={inst.member?.name ?? "?"} size="sm" />
        <div className="min-w-0">
          <p className="truncate font-semibold">
            {inst.member?.name} · {inst.periodLabel}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("inst.a.summary", { scheme: inst.schemeName ?? "", date: formatDate(inst.dueDate), amount: money.fmt(inst.amountPaise), paid: money.fmt(inst.paidPaise) })}
          </p>
        </div>
      </div>
      <FormError message={error} />
      <Field label={t("inst.a.action")} htmlFor="ia-action">
        <NativeSelect id="ia-action" {...form.register("action")}>
          {active && <option value="set_due_date">{t("inst.a.setDate")}</option>}
          {active && <option value="set_amount">{t("inst.a.setAmount")}</option>}
          {active && <option value="defer">{t("inst.a.defer")}</option>}
          {active && <option value="waive">{t("inst.a.waive")}</option>}
          {active && inst.paidPaise === 0 && <option value="cancel">{t("inst.a.cancel")}</option>}
          {!active && <option value="reactivate">{t("inst.a.reactivate")}</option>}
        </NativeSelect>
      </Field>
      {(action === "set_due_date" || action === "defer" || action === "reactivate") && (
        <Field label={action === "set_due_date" ? t("inst.a.newDate") : t("inst.a.dateOpt")} htmlFor="ia-date" error={e.dueDate?.message && t(e.dueDate.message as Key)}>
          <Input id="ia-date" type="date" {...form.register("dueDate")} />
        </Field>
      )}
      {action === "set_amount" && (
        <Field label={t("inst.a.newAmount")} htmlFor="ia-amt" error={e.amount?.message && t(e.amount.message as Key)} hint={t("inst.a.newAmountHint")}>
          <AmountInput id="ia-amt" {...form.register("amount")} />
        </Field>
      )}
      <Field label={t("inst.a.reasonLabel")} htmlFor="ia-reason" error={e.reason?.message && t(e.reason.message as Key)}>
        <Input id="ia-reason" {...form.register("reason")} />
      </Field>
      <SubmitButton pending={pending} icon={<CheckCircle2 />} variant={action === "waive" || action === "cancel" ? "destructive" : "default"}>
        {t("inst.a.save")}
      </SubmitButton>
    </form>
  );
}

export function InstallmentActionDialog({ inst }: { inst: Installment }) {
  const t = useT();
  return (
    <FormDialog trigger={<SlidersHorizontal />} triggerVariant="ghost" triggerSize="xs" title={t("inst.a.title")} icon={<CalendarClock />} tone="indigo" description={t("inst.a.desc")}>
      <ActionForm inst={inst} />
    </FormDialog>
  );
}
