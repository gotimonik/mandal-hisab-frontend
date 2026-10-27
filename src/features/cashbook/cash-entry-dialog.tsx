"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowDownToLine, ArrowUpFromLine, CheckCircle2, Plus, Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/app/field";
import { NativeSelect } from "@/components/app/native-select";
import { FormDialog, useDialogClose } from "@/components/app/form-dialog";
import { useApiSubmit } from "@/components/app/use-api-form";
import { newIdempotencyKey, todayISO } from "@/lib/format";
import { rupees } from "@/lib/schemas";
import { useMoney } from "@/components/app/currency";
import { AmountInput, SubmitButton } from "@/components/app/form-bits";
import { IconChip } from "@/components/app/bits";
import { cn } from "@/lib/utils";

const Schema = z.object({
  direction: z.enum(["in", "out"]),
  amount: rupees,
  date: z.string().min(10),
  description: z.string().trim().min(2, "Describe the entry").max(200),
  categoryKey: z.string().optional(),
  accountId: z.string().optional(),
});

interface Props {
  accounts: { _id: string; name: string }[];
  categories: { key: string; name: string }[];
}

function Form({ accounts, categories }: Props) {
  const money = useMoney();
  const { orgId } = useParams<{ orgId: string }>();
  const close = useDialogClose();
  const [key] = useState(() => newIdempotencyKey("cash"));
  const form = useForm<z.infer<typeof Schema>>({ resolver: zodResolver(Schema), defaultValues: { direction: "in", amount: "", date: todayISO(), description: "", categoryKey: "", accountId: accounts[0]?._id ?? "" } });
  const { submit, pending, error } = useApiSubmit(form);
  const e = form.formState.errors;
  const dir = form.watch("direction");
  return (
    <form
      noValidate
      className="grid grid-cols-1 gap-3"
      onSubmit={form.handleSubmit((v) => submit({ path: `/orgs/${orgId}/cashbook/entries`, body: { ...v, categoryKey: v.direction === "out" ? v.categoryKey || undefined : undefined, idempotencyKey: key } }, { success: "Cash entry recorded", onSuccess: close }))}
    >
      <FormError message={error} />
      <div className="grid grid-cols-2 gap-2">
        {(["in", "out"] as const).map((d) => (
          <label
            key={d}
            className={cn(
              "flex cursor-pointer items-center gap-2.5 rounded-2xl p-3 text-sm font-semibold ring-1 transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/40",
              dir === d ? (d === "in" ? "bg-emerald-500/10 ring-2 ring-emerald-500/60" : "bg-rose-500/10 ring-2 ring-rose-500/60") : "bg-card ring-foreground/10 hover:bg-muted",
            )}
          >
            <input type="radio" value={d} className="sr-only" {...form.register("direction")} />
            <IconChip tone={d === "in" ? "emerald" : "rose"} size="sm">
              {d === "in" ? <ArrowDownToLine /> : <ArrowUpFromLine />}
            </IconChip>
            <span className="min-w-0 leading-tight">{d === "in" ? "Cash in (receipt)" : "Cash out (expense)"}</span>
          </label>
        ))}
      </div>
      <Field label={`Amount (${money.symbol})`} htmlFor="ce-amt" error={e.amount?.message}>
        <AmountInput id="ce-amt" {...form.register("amount")} />
      </Field>
      <Field label="Date" htmlFor="ce-date">
        <Input id="ce-date" type="date" max={todayISO()} {...form.register("date")} />
      </Field>
      <Field label="Description" htmlFor="ce-desc" error={e.description?.message}>
        <Input id="ce-desc" placeholder={dir === "in" ? "e.g. Bank interest received in cash" : "e.g. Register and pens"} {...form.register("description")} />
      </Field>
      {dir === "out" && categories.length > 0 && (
        <Field label="Category" htmlFor="ce-cat">
          <NativeSelect id="ce-cat" {...form.register("categoryKey")}>
            <option value="">Miscellaneous</option>
            {categories.map((c) => (
              <option key={c.key} value={c.key}>
                {c.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
      )}
      {accounts.length > 1 && (
        <Field label="Account" htmlFor="ce-acc">
          <NativeSelect id="ce-acc" {...form.register("accountId")}>
            {accounts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
      )}
      <SubmitButton pending={pending} icon={<CheckCircle2 />}>
        Save entry
      </SubmitButton>
    </form>
  );
}

export function CashEntryDialog(props: Props & { defaultOpen?: boolean }) {
  return (
    <FormDialog defaultOpen={props.defaultOpen} trigger={<><Plus /> Cash in / out</>} triggerVariant="outline" title="Record a cash entry" icon={<Wallet />} tone="emerald" description="Other money received or spent in cash. Hapta and withdrawals are recorded from their own screens.">
      <Form {...props} />
    </FormDialog>
  );
}
