"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeftRight, ArrowRight, Landmark, Minus, Plus, Scale } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/app/field";
import { NativeSelect } from "@/components/app/native-select";
import { FormDialog, useDialogClose } from "@/components/app/form-dialog";
import { AmountInput, ChoicePills, FormNote, SubmitButton } from "@/components/app/form-bits";
import { useApiSubmit } from "@/components/app/use-api-form";
import { newIdempotencyKey, todayISO } from "@/lib/format";
import { rupees, rupeesOrZero } from "@/lib/schemas";
import { useMoney } from "@/components/app/currency";

type Acc = { _id: string; name: string };

const NewSchema = z.object({
  name: z.string().trim().min(2, "Name the account").max(80),
  type: z.literal("cash"),
  openingBalance: rupeesOrZero,
  openingDate: z.string().min(10),
});

function NewAccountForm() {
  const money = useMoney();
  const { orgId } = useParams<{ orgId: string }>();
  const close = useDialogClose();
  const form = useForm<z.input<typeof NewSchema>, unknown, z.output<typeof NewSchema>>({ resolver: zodResolver(NewSchema), defaultValues: { name: "", type: "cash", openingBalance: "0", openingDate: todayISO() } });
  const { submit, pending, error } = useApiSubmit(form);
  const e = form.formState.errors;
  return (
    <form noValidate className="grid grid-cols-1 gap-3" onSubmit={form.handleSubmit((v) => submit({ path: `/orgs/${orgId}/accounts`, body: v }, { success: "Account created", onSuccess: close }))}>
      <FormError message={error} />
      <input type="hidden" {...form.register("type")} />
      <FormNote tone="good">Cash only for now — add one account for each place the Mandal keeps cash, e.g. the cash box or the treasurer.</FormNote>
      <Field label="Account name" htmlFor="a-name" error={e.name?.message}>
        <Input id="a-name" placeholder="e.g. Cash box" {...form.register("name")} />
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={`Opening balance (${money.symbol})`} htmlFor="a-open" error={e.openingBalance?.message}>
          <Input id="a-open" inputMode="decimal" {...form.register("openingBalance")} />
        </Field>
        <Field label="As of" htmlFor="a-opendate">
          <Input id="a-opendate" type="date" {...form.register("openingDate")} />
        </Field>
      </div>
      <FormNote>Posted once as an opening entry; balances are always calculated from the ledger.</FormNote>
      <SubmitButton pending={pending} icon={<Plus />}>
        Create account
      </SubmitButton>
    </form>
  );
}

export function NewAccountDialog() {
  return (
    <FormDialog trigger={<><Plus /> Add account</>} title="Add a financial account" icon={<Landmark />} tone="emerald" wide>
      <NewAccountForm />
    </FormDialog>
  );
}

const TransferSchema = z.object({ fromAccountId: z.string().min(1), toAccountId: z.string().min(1), amount: rupees, date: z.string().min(10), reference: z.string().max(100).optional(), notes: z.string().max(300).optional() }).refine((v) => v.fromAccountId !== v.toAccountId, { path: ["toAccountId"], message: "Choose a different account" });

function TransferForm({ accounts }: { accounts: Acc[] }) {
  const money = useMoney();
  const { orgId } = useParams<{ orgId: string }>();
  const close = useDialogClose();
  const [key] = useState(() => newIdempotencyKey("trf"));
  const form = useForm<z.infer<typeof TransferSchema>>({ resolver: zodResolver(TransferSchema), defaultValues: { fromAccountId: accounts[0]?._id ?? "", toAccountId: accounts[1]?._id ?? "", amount: "", date: todayISO(), reference: "", notes: "" } });
  const { submit, pending, error } = useApiSubmit(form);
  const e = form.formState.errors;
  return (
    <form noValidate className="grid grid-cols-1 gap-3" onSubmit={form.handleSubmit((v) => submit({ path: `/orgs/${orgId}/transfers`, body: { ...v, idempotencyKey: key } }, { success: "Transfer recorded", onSuccess: close }))}>
      <FormNote>e.g. depositing cash into the bank. Transfers are never counted as income or expense.</FormNote>
      <FormError message={error} />
      <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <Field label="From" htmlFor="t-from">
          <NativeSelect id="t-from" {...form.register("fromAccountId")}>
            {accounts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <ArrowRight aria-hidden className="mx-auto hidden size-4 text-muted-foreground sm:mb-2.5 sm:block" />
        <Field label="To" htmlFor="t-to" error={e.toAccountId?.message}>
          <NativeSelect id="t-to" {...form.register("toAccountId")}>
            {accounts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>
      <Field label={`Amount (${money.symbol})`} htmlFor="t-amt" error={e.amount?.message}>
        <AmountInput id="t-amt" placeholder="0" {...form.register("amount")} />
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Date" htmlFor="t-date">
          <Input id="t-date" type="date" {...form.register("date")} />
        </Field>
        <Field label="Notes" htmlFor="t-notes">
          <Input id="t-notes" {...form.register("notes")} />
        </Field>
      </div>
      <SubmitButton pending={pending} icon={<ArrowLeftRight />}>
        Transfer
      </SubmitButton>
    </form>
  );
}

export function TransferDialog({ accounts }: { accounts: Acc[] }) {
  return (
    <FormDialog trigger={<><ArrowLeftRight /> Transfer</>} triggerVariant="outline" title="Transfer between accounts" icon={<ArrowLeftRight />} tone="sky" wide>
      <TransferForm accounts={accounts} />
    </FormDialog>
  );
}

const AdjSchema = z.object({ accountId: z.string().min(1), direction: z.enum(["increase", "decrease"]), amount: rupees, date: z.string().min(10), reason: z.string().trim().min(3, "A reason is required").max(500) });

function AdjustForm({ accounts }: { accounts: Acc[] }) {
  const money = useMoney();
  const { orgId } = useParams<{ orgId: string }>();
  const close = useDialogClose();
  const [key] = useState(() => newIdempotencyKey("adj"));
  const form = useForm<z.infer<typeof AdjSchema>>({ resolver: zodResolver(AdjSchema), defaultValues: { accountId: accounts[0]?._id ?? "", direction: "decrease", amount: "", date: todayISO(), reason: "" } });
  const { submit, pending, error } = useApiSubmit(form);
  const e = form.formState.errors;
  const direction = useWatch({ control: form.control, name: "direction" });
  return (
    <form noValidate className="grid grid-cols-1 gap-3" onSubmit={form.handleSubmit((v) => submit({ path: `/orgs/${orgId}/adjustments`, body: { ...v, idempotencyKey: key } }, { success: "Adjustment posted", onSuccess: close }))}>
      <FormNote tone="warn">Use only to correct a balance (e.g. unrecorded bank charges). The adjustment is audited and can be reversed.</FormNote>
      <FormError message={error} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Account" htmlFor="j-acc">
          <NativeSelect id="j-acc" {...form.register("accountId")}>
            {accounts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Direction</span>
          <input type="hidden" {...form.register("direction")} />
          <ChoicePills
            label="Direction"
            value={direction}
            onChange={(v) => form.setValue("direction", v, { shouldDirty: true })}
            options={[
              { value: "decrease" as const, label: "Decrease balance", icon: <Minus /> },
              { value: "increase" as const, label: "Increase balance", icon: <Plus /> },
            ]}
          />
        </div>
      </div>
      <Field label={`Amount (${money.symbol})`} htmlFor="j-amt" error={e.amount?.message}>
        <AmountInput id="j-amt" placeholder="0" {...form.register("amount")} />
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Date" htmlFor="j-date">
          <Input id="j-date" type="date" {...form.register("date")} />
        </Field>
        <Field label="Reason" htmlFor="j-reason" error={e.reason?.message}>
          <Input id="j-reason" {...form.register("reason")} />
        </Field>
      </div>
      <SubmitButton pending={pending} variant="destructive" icon={<Scale />}>
        Post adjustment
      </SubmitButton>
    </form>
  );
}

export function AdjustDialog({ accounts }: { accounts: Acc[] }) {
  return (
    <FormDialog trigger={<><Scale /> Adjustment</>} triggerVariant="ghost" title="Balance adjustment" icon={<Scale />} tone="violet" wide>
      <AdjustForm accounts={accounts} />
    </FormDialog>
  );
}
