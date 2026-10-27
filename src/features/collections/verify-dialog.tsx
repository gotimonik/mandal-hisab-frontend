"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { BadgeCheck, Check, Wallet } from "lucide-react";
import { Field, FormError } from "@/components/app/field";
import { NativeSelect } from "@/components/app/native-select";
import { FormDialog, useDialogClose } from "@/components/app/form-dialog";
import { useApiSubmit } from "@/components/app/use-api-form";
import { formatDate } from "@/lib/format";
import { useMoney } from "@/components/app/currency";
import { IconChip } from "@/components/app/bits";
import { FormNote, SubmitButton } from "@/components/app/form-bits";

function VerifyForm({ paymentId, accounts, accountId, summary, path }: { paymentId: string; accounts: { _id: string; name: string }[]; accountId?: string | null; summary: string; path: string }) {
  const { orgId } = useParams<{ orgId: string }>();
  const close = useDialogClose();
  const [acc, setAcc] = useState(accountId ?? accounts[0]?._id ?? "");
  const form = useForm();
  const { submit, pending, error } = useApiSubmit(form);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 rounded-2xl bg-muted/50 p-3">
        <IconChip tone="emerald" size="sm">
          <Wallet />
        </IconChip>
        <p className="min-w-0 text-sm font-semibold">{summary}</p>
      </div>
      <FormError message={error} />
      <Field label="Received into account" htmlFor={`va-${paymentId}`}>
        <NativeSelect id={`va-${paymentId}`} value={acc} onChange={(e) => setAcc(e.target.value)}>
          {accounts.map((a) => (
            <option key={a._id} value={a._id}>
              {a.name}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <FormNote>Verifying posts the amount to the ledger, updates the member&apos;s installments and issues a receipt.</FormNote>
      <SubmitButton type="button" pending={pending} disabled={!acc} icon={<Check />} onClick={() => submit({ path: `/orgs/${orgId}${path}`, body: { accountId: acc } }, { success: "Verified — receipt issued", onSuccess: close })}>
        Verify
      </SubmitButton>
    </div>
  );
}

export function VerifyDialog(props: { paymentId: string; accounts: { _id: string; name: string }[]; accountId?: string | null; payer: string; amountPaise: number; date: string; path: string }) {
  const money = useMoney();
  return (
    <FormDialog trigger={<><Check /> Verify</>} triggerSize="xs" title="Verify payment" icon={<BadgeCheck />} tone="emerald">
      <VerifyForm {...props} summary={`${props.payer} · ${money.fmt(props.amountPaise)} · ${formatDate(props.date)}`} />
    </FormDialog>
  );
}
