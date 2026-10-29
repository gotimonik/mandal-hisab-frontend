"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowUpFromLine, CircleSlash, HandCoins, Loader2, LogOut, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/app/field";
import { NativeSelect } from "@/components/app/native-select";
import { Money } from "@/components/app/money";
import { FormDialog, useDialogClose } from "@/components/app/form-dialog";
import { FormNote, PaidInCash, SubmitButton } from "@/components/app/form-bits";
import { IconChip } from "@/components/app/bits";
import { apiMutate } from "@/lib/api-client";
import { apiRead } from "@/app/actions/api";
import { formatDate, newIdempotencyKey, todayISO } from "@/lib/format";
import { useMoney } from "@/components/app/currency";
import type { JoiningQuote, LeavingQuote } from "@/lib/types";

type Account = { _id: string; name: string; balancePaise: number };

/* ------------------------------------------------------------------ shared bits */

function Row({ label, hint, children, strong }: { label: ReactNode; hint?: ReactNode; children: ReactNode; strong?: boolean }) {
  return (
    <div className={strong ? "flex items-baseline justify-between gap-3 border-t pt-2.5 text-base font-bold" : "flex items-baseline justify-between gap-3 text-sm"}>
      <span className="min-w-0">
        {label}
        {hint && <span className="block text-xs font-normal text-muted-foreground">{hint}</span>}
      </span>
      {children}
    </div>
  );
}

function AccountField({ id, accounts, value, onChange, label }: { id: string; accounts: Account[]; value: string; onChange: (v: string) => void; label: string }) {
  const account = accounts.find((a) => a._id === value);
  if (accounts.length <= 1) return null;
  return (
    <Field label={label} htmlFor={id} hint={account ? <>Holds <Money paise={account.balancePaise} /></> : undefined}>
      <NativeSelect id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {accounts.map((a) => (
          <option key={a._id} value={a._id}>
            {a.name}
          </option>
        ))}
      </NativeSelect>
    </Field>
  );
}

const shareWord = (n: number) => `${n} share${n === 1 ? "" : "s"}`;

/* ------------------------------------------------------------------ joining */

function JoiningBreakdown({ q }: { q: JoiningQuote }) {
  const money = useMoney();
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-muted/50 p-3">
      <Row label="Price of one share" hint={`${money.fmt(q.perShareSavingsPaise)} hapta savings + ${money.fmt(q.perShareMandalPaise)} Mandal's own money`}>
        <Money paise={q.perSharePaise} className="font-semibold" />
      </Row>
      <Row label={`× ${shareWord(q.shares)}`}>
        <span />
      </Row>
      <Row label="Goes into their savings">
        <Money paise={q.savingsPaise} />
      </Row>
      <Row label="Goes into the Mandal's own money">
        <Money paise={q.totalPaise - q.savingsPaise} />
      </Row>
      <Row label="Joining amount" strong>
        <Money paise={q.totalPaise} />
      </Row>
    </div>
  );
}

function CollectJoiningForm({ memberId, quote, accounts }: { memberId: string; quote: JoiningQuote; accounts: Account[] }) {
  const { orgId } = useParams<{ orgId: string }>();
  const router = useRouter();
  const close = useDialogClose();
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?._id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [key] = useState(() => newIdempotencyKey("join"));
  const [pending, start] = useTransition();
  const save = () =>
    start(async () => {
      setError(null);
      const res = await apiMutate({
        path: `/orgs/${orgId}/members/${memberId}/joining/pay`,
        body: { date, note: note || undefined, accountId: accountId || undefined, expectedTotalPaise: quote.totalPaise, idempotencyKey: key },
      });
      if (!res.ok) return setError(res.error);
      toast.success("Joining amount received — they're now a full member");
      close();
      router.refresh();
    });
  return (
    <form
      noValidate
      className="grid grid-cols-1 gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <FormError message={error} />
      <JoiningBreakdown q={quote} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Date received" htmlFor="jn-date">
          <Input id="jn-date" type="date" max={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <AccountField id="jn-acc" label="Received into" accounts={accounts} value={accountId} onChange={setAccountId} />
      </div>
      <PaidInCash />
      <Field label="Note (optional)" htmlFor="jn-note">
        <Input id="jn-note" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <FormNote>
        After this, they stand exactly where an existing member does: the same savings per share and the same part of the Mandal&apos;s own money when it closes.
      </FormNote>
      <SubmitButton pending={pending} icon={<HandCoins />}>
        Receive <Money paise={quote.totalPaise} />
      </SubmitButton>
    </form>
  );
}

function WaiveJoiningForm({ memberId }: { memberId: string }) {
  const { orgId } = useParams<{ orgId: string }>();
  const router = useRouter();
  const close = useDialogClose();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      noValidate
      className="grid grid-cols-1 gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (reason.trim().length < 3) return setError("Please give a reason");
        start(async () => {
          const res = await apiMutate({ path: `/orgs/${orgId}/members/${memberId}/joining/waive`, body: { reason } });
          if (!res.ok) return setError(res.error);
          toast.success("Joining amount waived");
          close();
          router.refresh();
        });
      }}
    >
      <FormError message={error} />
      <Field label="Reason" htmlFor="jw-reason">
        <Input id="jw-reason" value={reason} maxLength={500} placeholder="e.g. Was a member from the start, added late" onChange={(e) => setReason(e.target.value)} />
      </Field>
      <FormNote tone="warn">They&apos;ll share the Mandal&apos;s own money like everyone else without having paid in for it.</FormNote>
      <SubmitButton pending={pending} variant="outline" icon={<CircleSlash />}>
        Waive joining amount
      </SubmitButton>
    </form>
  );
}

/** Shown on a member's page while they still owe the price of their shares. */
export function JoiningDueCard({ memberId, quote, accounts, canCollect }: { memberId: string; quote: JoiningQuote; accounts: Account[]; canCollect: boolean }) {
  return (
    <section className="mb-5 rounded-2xl bg-amber-500/10 p-4 ring-1 ring-amber-500/25">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <IconChip tone="amber" size="sm">
            <UserPlus />
          </IconChip>
          <div className="min-w-0">
            <h2 className="font-semibold">
              Joining amount due: <Money paise={quote.totalPaise} />
            </h2>
            <p className="text-sm text-muted-foreground">
              Hapta started {quote.haptaStart ? formatDate(quote.haptaStart) : "after the first month"}, so they buy in at the price of {shareWord(quote.shares)}. Until it&apos;s paid they don&apos;t share in the Mandal&apos;s money.
            </p>
          </div>
        </div>
        {canCollect && (
          <div className="flex shrink-0 flex-wrap gap-2">
            <FormDialog trigger={<><HandCoins /> Collect</>} triggerSize="sm" title="Collect joining amount" icon={<UserPlus />} tone="amber">
              <CollectJoiningForm memberId={memberId} quote={quote} accounts={accounts} />
            </FormDialog>
            <FormDialog trigger="Waive" triggerVariant="outline" triggerSize="sm" title="Waive the joining amount" icon={<CircleSlash />} tone="amber">
              <WaiveJoiningForm memberId={memberId} />
            </FormDialog>
          </div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ leaving */

function LeaveForm({ memberId, memberName, accounts }: { memberId: string; memberName: string; accounts: Account[] }) {
  const { orgId } = useParams<{ orgId: string }>();
  const router = useRouter();
  const close = useDialogClose();
  const [q, setQ] = useState<LeavingQuote | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [date, setDate] = useState(todayISO());
  const [reason, setReason] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?._id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [key] = useState(() => newIdempotencyKey("leave"));
  const [pending, start] = useTransition();
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let alive = true;
    apiRead<LeavingQuote>(`/orgs/${orgId}/members/${memberId}/leaving`).then((r) => {
      if (!alive) return;
      if (r.ok) setQ(r.data);
      else setLoadError(r.error);
    });
    return () => {
      alive = false;
    };
  }, [orgId, memberId, reload]);

  const waiveHapta = () =>
    start(async () => {
      setError(null);
      const res = await apiMutate({ path: `/orgs/${orgId}/members/${memberId}/leaving/waive-hapta`, body: { reason: reason.trim().length >= 3 ? reason : "Leaving the Mandal" } });
      if (!res.ok) return setError(res.error);
      toast.success("Unpaid hapta waived");
      setReload((n) => n + 1);
    });

  const leave = () =>
    start(async () => {
      if (!q) return;
      setError(null);
      const res = await apiMutate({
        path: `/orgs/${orgId}/members/${memberId}/leave`,
        body: { date, reason: reason || undefined, accountId: accountId || undefined, expectedNetPaise: q.netPaise, idempotencyKey: key },
      });
      if (!res.ok) {
        setError(res.error);
        setReload((n) => n + 1);
        return;
      }
      toast.success(`${memberName} has left the Mandal`);
      close();
      router.refresh();
    });

  if (loadError) return <FormError message={loadError} />;
  if (!q) {
    return (
      <div className="flex justify-center py-8 text-muted-foreground">
        <Loader2 className="animate-spin" />
      </div>
    );
  }
  const onlyHapta = q.blockers.length > 0 && q.blockers.every((b) => b.key === "hapta");
  return (
    <form
      noValidate
      className="grid grid-cols-1 gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        leave();
      }}
    >
      <FormError message={error} />
      <div className="flex flex-col gap-2 rounded-2xl bg-muted/50 p-3">
        <Row label="Their savings balance">
          <Money paise={q.savingsPaise} />
        </Row>
        <Row label="Their part of the Mandal's own money" hint={q.shares ? `${shareWord(q.shares)} of ${q.holderShares}` : q.joiningDue ? "None — the joining amount was never paid" : undefined}>
          <Money paise={q.mandalSharePaise} colored />
        </Row>
        {q.upadOwedPaise > 0 && (
          <Row label="Upad they still owe" hint="Taken off the payout">
            <Money paise={-q.upadOwedPaise} colored />
          </Row>
        )}
        <Row label="Pay them" strong>
          <Money paise={q.netPaise} />
        </Row>
      </div>
      {q.blockers.length > 0 && (
        <div className="flex flex-col gap-2">
          <FormNote tone="warn">Finish these first:</FormNote>
          <ul className="flex flex-col gap-1.5 text-sm">
            {q.blockers.map((b) => (
              <li key={b.key} className="flex items-center justify-between gap-2 rounded-xl bg-card px-3 py-2 ring-1 ring-foreground/10">
                <span className="min-w-0">
                  {b.label}
                  {b.amountPaise ? (
                    <>
                      {" "}
                      · <Money paise={b.amountPaise} />
                    </>
                  ) : null}
                </span>
                {b.key === "hapta" ? (
                  <Button type="button" size="sm" variant="outline" disabled={pending} onClick={waiveHapta}>
                    Waive
                  </Button>
                ) : (
                  <Link href={b.link} className="shrink-0 text-xs font-medium text-primary hover:underline" onClick={close}>
                    Open
                  </Link>
                )}
              </li>
            ))}
          </ul>
          {onlyHapta && <p className="text-xs text-muted-foreground">Or collect their unpaid hapta first, then come back here.</p>}
        </div>
      )}
      {q.canLeave && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Date paid" htmlFor="lv-date">
              <Input id="lv-date" type="date" max={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <AccountField id="lv-acc" label="Paid from" accounts={accounts} value={accountId} onChange={setAccountId} />
          </div>
          <PaidInCash />
          <Field label="Reason (optional)" htmlFor="lv-reason">
            <Input id="lv-reason" value={reason} maxLength={300} placeholder="e.g. Moving to another city" onChange={(e) => setReason(e.target.value)} />
          </Field>
          <FormNote tone="warn">Their future hapta stops and they&apos;re marked as left. This can&apos;t be undone from here.</FormNote>
          <SubmitButton pending={pending} variant="destructive" icon={<ArrowUpFromLine />}>
            Pay <Money paise={q.netPaise} /> and mark as left
          </SubmitButton>
        </>
      )}
    </form>
  );
}

export function LeaveMandalDialog({ memberId, memberName, accounts }: { memberId: string; memberName: string; accounts: Account[] }) {
  return (
    <FormDialog trigger={<><LogOut /> Leave Mandal</>} triggerVariant="outline" title={`${memberName} leaves the Mandal`} description="Pay out their share and stop their hapta." icon={<LogOut />} tone="rose">
      <LeaveForm memberId={memberId} memberName={memberName} accounts={accounts} />
    </FormDialog>
  );
}
