"use client";

import { useMemo, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowUpFromLine, Loader2, PiggyBank, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FormError } from "@/components/app/field";
import { NativeSelect } from "@/components/app/native-select";
import { Money } from "@/components/app/money";
import { FormDialog, useDialogClose } from "@/components/app/form-dialog";
import { AmountInput, ChoicePills, FormNote, MoreOptions, SubmitButton } from "@/components/app/form-bits";
import { IconChip } from "@/components/app/bits";
import { apiMutate } from "@/app/actions/api";
import { newIdempotencyKey, paiseToRupeeInput, todayISO } from "@/lib/format";
import { rupees } from "@/lib/schemas";
import { useMoney } from "@/components/app/currency";

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
  const money = useMoney();
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
      className="grid grid-cols-1 gap-3"
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
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-500/10 px-3 py-2.5 text-sm">
          <IconChip tone="emerald" size="sm">
            <PiggyBank />
          </IconChip>
          <span className="min-w-0 flex-1 font-medium">Available balance</span>
          <Money paise={member.balancePaise} className="text-base font-bold" colored />
        </div>
      )}
      <Field label={`Amount (${money.symbol})`} htmlFor="w-amt" error={over ? "More than the available balance" : undefined}>
        <AmountInput id="w-amt" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </Field>
      {member && member.balancePaise > 0 && (
        <ChoicePills
          label="Amount shortcuts"
          value={amount}
          onChange={setAmount}
          options={[
            { value: paiseToRupeeInput(member.balancePaise), label: "Full balance" },
            { value: paiseToRupeeInput(Math.round(member.balancePaise / 200) * 100), label: "Half" },
          ].filter((o, i, all) => Number(o.value) > 0 && all.findIndex((x) => x.value === o.value) === i)}
        />
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Date paid" htmlFor="w-date">
          <Input id="w-date" type="date" max={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
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
      </div>
      <MoreOptions bare icon={<StickyNote />} title="Note" description={note ? note : "Optional — e.g. medical, school fees."}>
        <Field label="Note (optional)" htmlFor="w-note" className="sm:col-span-2">
          <Input id="w-note" maxLength={300} placeholder="e.g. Medical, school fees" value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </MoreOptions>
      {over && allowException && (
        <FormNote tone="warn">
          <div className="grid grid-cols-1 gap-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={exceed} onCheckedChange={(c) => setExceed(!!c)} /> Allow this withdrawal above the member&apos;s balance (admin exception)
            </label>
            {exceed && <Input placeholder="Reason (required)" value={exceptionReason} onChange={(e) => setExceptionReason(e.target.value)} maxLength={300} />}
          </div>
        </FormNote>
      )}
      {dup ? (
        <FormNote tone="warn">
          <div role="alert" className="flex flex-col gap-2 text-sm">
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
        </FormNote>
      ) : (
        <SubmitButton pending={pending} disabled={pending || (over && !exceed) || (exceed && exceptionReason.trim().length < 3)} icon={<ArrowUpFromLine />}>
          Record cash paid to member
        </SubmitButton>
      )}
    </form>
  );
}

export function WithdrawalDialog(props: Props & { triggerLabel?: string; triggerSize?: "default" | "sm"; defaultOpen?: boolean }) {
  return (
    <FormDialog defaultOpen={props.defaultOpen} trigger={<><ArrowUpFromLine /> {props.triggerLabel ?? "Record withdrawal"}</>} triggerSize={props.triggerSize} title="Record a withdrawal" icon={<ArrowUpFromLine />} tone="rose" description="Cash paid out to a member from their savings balance. A voucher number is generated.">
      <Form {...props} />
    </FormDialog>
  );
}
