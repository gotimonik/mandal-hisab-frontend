"use client";

import { useMemo, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowUpFromLine, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FormError } from "@/components/app/field";
import { NativeSelect } from "@/components/app/native-select";
import { Money } from "@/components/app/money";
import { FormDialog, useDialogClose } from "@/components/app/form-dialog";
import { apiMutate } from "@/app/actions/api";
import { newIdempotencyKey, todayISO } from "@/lib/format";
import { rupees } from "@/lib/schemas";

export interface WithdrawalMemberOption {
  _id: string;
  name: string;
  membershipNumber: string;
  balancePaise: number;
}

interface Props {
  members: WithdrawalMemberOption[];
  accounts: { _id: string; name: string; balancePaise: number }[];
  /** Admin + the Mandal allows exceptions above a member's balance */
  allowException: boolean;
  defaultMemberId?: string;
}

function Form({ members, accounts, allowException, defaultMemberId }: Props) {
  const { orgId } = useParams<{ orgId: string }>();
  const router = useRouter();
  const close = useDialogClose();
  const [memberId, setMemberId] = useState(defaultMemberId ?? "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?._id ?? "");
  const [exceed, setExceed] = useState(false);
  const [exceptionReason, setExceptionReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dup, setDup] = useState<string | null>(null);
  const [key] = useState(() => newIdempotencyKey("wdl"));
  const [pending, start] = useTransition();

  const member = members.find((m) => m._id === memberId);
  const account = accounts.find((a) => a._id === accountId);
  const amountPaise = useMemo(() => {
    const p = rupees.safeParse(amount);
    return p.success ? Math.round(Number(p.data) * 100) : 0;
  }, [amount]);
  const over = !!member && amountPaise > member.balancePaise;

  const save = (confirmDuplicate: boolean) => {
    if (!member) return setError("Choose a member");
    const p = rupees.safeParse(amount);
    if (!p.success) return setError(p.error.issues[0].message);
    if (over && !exceed) return setError("The amount is more than the member's available balance");
    start(async () => {
      setError(null);
      const res = await apiMutate<{ withdrawal: { _id: string; number: string } }>({
        path: `/orgs/${orgId}/withdrawals`,
        body: { memberId, amount: p.data, date, note: note || undefined, accountId: accountId || undefined, allowExceedBalance: over && exceed, exceptionReason: over && exceed ? exceptionReason : undefined, confirmDuplicate, idempotencyKey: key },
      });
      if (!res.ok) {
        if (res.code === "DUPLICATE_SUSPECTED") return setDup(res.error);
        return setError(res.error);
      }
      toast.success(`Withdrawal ${res.data.withdrawal.number} recorded`);
      close();
      router.push(`/org/${orgId}/withdrawals/${res.data.withdrawal._id}`);
      router.refresh();
    });
  };

  return (
    <form
      noValidate
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        save(false);
      }}
    >
      <FormError message={error} />
      <Field label="Member" htmlFor="w-member">
        <NativeSelect id="w-member" value={memberId} onChange={(e) => setMemberId(e.target.value)}>
          <option value="">Choose a member…</option>
          {members.map((m) => (
            <option key={m._id} value={m._id}>
              {m.name} ({m.membershipNumber})
            </option>
          ))}
        </NativeSelect>
      </Field>
      {member && (
        <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
          <span>Available balance</span>
          <Money paise={member.balancePaise} className="font-semibold" colored />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount (₹)" htmlFor="w-amt" error={over ? "More than the available balance" : undefined}>
          <Input id="w-amt" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Date paid" htmlFor="w-date">
          <Input id="w-date" type="date" max={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>
      {accounts.length > 1 && (
        <Field label="Paid from" htmlFor="w-acc" hint={account ? <>Holds <Money paise={account.balancePaise} /></> : undefined}>
          <NativeSelect id="w-acc" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            {accounts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
      )}
      <Field label="Note (optional)" htmlFor="w-note">
        <Input id="w-note" maxLength={300} placeholder="e.g. Medical, school fees" value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      {over && allowException && (
        <div className="grid gap-2 rounded-lg border border-warning/50 bg-warning/10 p-3 text-sm">
          <label className="flex items-center gap-2">
            <Checkbox checked={exceed} onCheckedChange={(c) => setExceed(!!c)} /> Allow this withdrawal above the member&apos;s balance (admin exception)
          </label>
          {exceed && <Input placeholder="Reason (required)" value={exceptionReason} onChange={(e) => setExceptionReason(e.target.value)} maxLength={300} />}
        </div>
      )}
      {dup ? (
        <div role="alert" className="flex flex-col gap-2 rounded-lg border border-warning/50 bg-warning/10 p-3 text-sm">
          <p>{dup}</p>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setDup(null)} disabled={pending}>
              Go back
            </Button>
            <Button type="button" size="sm" onClick={() => save(true)} disabled={pending}>
              {pending && <Loader2 className="animate-spin" />} Yes, it&apos;s a second withdrawal
            </Button>
          </div>
        </div>
      ) : (
        <Button type="submit" disabled={pending || (over && !exceed) || (exceed && exceptionReason.trim().length < 3)}>
          {pending && <Loader2 className="animate-spin" />} Record cash paid to member
        </Button>
      )}
    </form>
  );
}

export function WithdrawalDialog(props: Props & { triggerLabel?: string; triggerSize?: "default" | "sm" }) {
  return (
    <FormDialog trigger={<><ArrowUpFromLine /> {props.triggerLabel ?? "Record withdrawal"}</>} triggerSize={props.triggerSize} title="Record a withdrawal" description="Cash paid out to a member from their savings balance. A voucher number is generated.">
      <Form {...props} />
    </FormDialog>
  );
}
