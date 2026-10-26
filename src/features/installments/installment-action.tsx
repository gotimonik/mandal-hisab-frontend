"use client";

import { useParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/app/field";
import { NativeSelect } from "@/components/app/native-select";
import { FormDialog, useDialogClose } from "@/components/app/form-dialog";
import { useApiSubmit } from "@/components/app/use-api-form";
import { formatDate, formatINR, isoDate } from "@/lib/format";
import { optionalRupees } from "@/lib/schemas";
import type { Installment } from "@/lib/types";

const Schema = z
  .object({
    action: z.enum(["set_due_date", "set_amount", "defer", "waive", "cancel", "reactivate"]),
    dueDate: z.string().optional(),
    amount: optionalRupees,
    reason: z.string().trim().min(3, "Please give a reason").max(500),
  })
  .superRefine((v, ctx) => {
    if (v.action === "set_due_date" && !v.dueDate) ctx.addIssue({ code: "custom", path: ["dueDate"], message: "Pick the new due date" });
    if (v.action === "set_amount" && !v.amount) ctx.addIssue({ code: "custom", path: ["amount"], message: "Enter the new amount" });
  });

function ActionForm({ inst }: { inst: Installment }) {
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
          { success: "Installment updated", onSuccess: close },
        ),
      )}
    >
      <p className="text-sm text-muted-foreground">
        {inst.member?.name} · {inst.schemeName} · {inst.periodLabel} · due {formatDate(inst.dueDate)} · {formatINR(inst.amountPaise)} (paid {formatINR(inst.paidPaise)})
      </p>
      <FormError message={error} />
      <Field label="Action" htmlFor="ia-action">
        <NativeSelect id="ia-action" {...form.register("action")}>
          {active && <option value="set_due_date">Change due date</option>}
          {active && <option value="set_amount">Change amount</option>}
          {active && <option value="defer">Defer (put on hold)</option>}
          {active && <option value="waive">Waive remaining amount</option>}
          {active && inst.paidPaise === 0 && <option value="cancel">Cancel</option>}
          {!active && <option value="reactivate">Reactivate</option>}
        </NativeSelect>
      </Field>
      {(action === "set_due_date" || action === "defer" || action === "reactivate") && (
        <Field label={action === "set_due_date" ? "New due date" : "Due date (optional)"} htmlFor="ia-date" error={e.dueDate?.message}>
          <Input id="ia-date" type="date" {...form.register("dueDate")} />
        </Field>
      )}
      {action === "set_amount" && (
        <Field label="New amount (₹)" htmlFor="ia-amt" error={e.amount?.message} hint="Cannot be less than what is already paid.">
          <Input id="ia-amt" inputMode="decimal" {...form.register("amount")} />
        </Field>
      )}
      <Field label="Reason" htmlFor="ia-reason" error={e.reason?.message}>
        <Input id="ia-reason" {...form.register("reason")} />
      </Field>
      <Button type="submit" disabled={pending} variant={action === "waive" || action === "cancel" ? "destructive" : "default"}>
        {pending && <Loader2 className="animate-spin" />} Save
      </Button>
    </form>
  );
}

export function InstallmentActionDialog({ inst }: { inst: Installment }) {
  return (
    <FormDialog trigger={<SlidersHorizontal />} triggerVariant="ghost" triggerSize="xs" title="Adjust installment" description="Every change is recorded in the installment history and audit log.">
      <ActionForm inst={inst} />
    </FormDialog>
  );
}
