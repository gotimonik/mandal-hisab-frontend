"use client";

import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarDays, CheckCircle2, HandCoins, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FormError } from "@/components/app/field";
import { NativeSelect } from "@/components/app/native-select";
import { useApiSubmit } from "@/components/app/use-api-form";
import { apiRead } from "@/app/actions/api";
import { formatDate, newIdempotencyKey, paiseToRupeeInput, todayISO } from "@/lib/format";
import { rupees } from "@/lib/schemas";
import { useMoney } from "@/components/app/currency";
import { IconChip } from "@/components/app/bits";
import { AmountInput, ChoicePills, MoreOptions, SubmitButton, PaidInCash } from "@/components/app/form-bits";

interface Opt {
  _id: string;
  name: string;
}

const Schema = z
  .object({
    kind: z.enum(["hapta", "membership_fee", "event", "other_income"]),
    memberId: z.string().optional(),
    payerName: z.string().max(120).optional(),
    amount: rupees,
    date: z.string().min(10, "Pick the date"),
    method: z.string().min(2),
    reference: z.string().max(100).optional(),
    accountId: z.string().min(1, "Choose the receiving account"),
    schemeId: z.string().optional(),
    eventName: z.string().max(120).optional(),
    notes: z.string().max(500).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.kind === "hapta" && !v.memberId) ctx.addIssue({ code: "custom", path: ["memberId"], message: "Select the member" });
    if (v.kind !== "hapta" && !v.memberId && !v.payerName) ctx.addIssue({ code: "custom", path: ["payerName"], message: "Enter the payer name" });
  });
type V = z.infer<typeof Schema>;

interface Alloc {
  installmentId: string;
  amountPaise: number;
  penaltyPaise: number;
  periodLabel?: string;
  dueDate?: string;
  schemeName?: string;
}

export function RecordPaymentDialog({
  members,
  accounts,
  schemes,
  methods,
  defaultOpen,
  defaultMemberId,
  defaultSchemeId,
  defaultAmountPaise,
  trigger,
}: {
  members: (Opt & { membershipNumber: string })[];
  accounts: Opt[];
  schemes: Opt[];
  methods: string[];
  defaultOpen?: boolean;
  defaultMemberId?: string;
  /** Apply the payment to this scheme's installments only (e.g. "Collect" on a scheme page). */
  defaultSchemeId?: string;
  /** Pre-filled amount, e.g. what the member owes right now. */
  defaultAmountPaise?: number;
  /** Custom trigger button (default: "Record collection"). */
  trigger?: { label: ReactNode; size?: "xs" | "sm" | "default"; variant?: "default" | "outline" | "ghost"; className?: string; ariaLabel?: string };
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  const router = useRouter();
  return (
    <>
      <Button onClick={() => setOpen(true)} size={trigger?.size} variant={trigger?.variant} className={trigger?.className} aria-label={trigger?.ariaLabel}>
        {trigger ? (
          trigger.label
        ) : (
          <>
            <HandCoins /> Record collection
          </>
        )}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o && defaultOpen) router.replace(window.location.pathname);
        }}
      >
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
          <DialogHeader className="flex-row items-start gap-3">
            <IconChip tone="emerald" className="mt-0.5">
              <HandCoins />
            </IconChip>
            <div className="flex min-w-0 flex-col gap-1">
              <DialogTitle>Record a collection</DialogTitle>
              <DialogDescription>Hapta payments are applied to the member&apos;s oldest dues first (late fee, then amount).</DialogDescription>
            </div>
          </DialogHeader>
          {open && <RecordForm members={members} accounts={accounts} schemes={schemes} methods={methods} defaultMemberId={defaultMemberId} defaultSchemeId={defaultSchemeId} defaultAmountPaise={defaultAmountPaise} onDone={() => setOpen(false)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function RecordForm({ members, accounts, schemes, methods, defaultMemberId, defaultSchemeId, defaultAmountPaise, onDone }: { members: (Opt & { membershipNumber: string })[]; accounts: Opt[]; schemes: Opt[]; methods: string[]; defaultMemberId?: string; defaultSchemeId?: string; defaultAmountPaise?: number; onDone: () => void }) {
  const money = useMoney();
  const { orgId } = useParams<{ orgId: string }>();
  const [key, setKey] = useState(() => newIdempotencyKey("pay"));
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<({ key: string } & ({ allocs: Alloc[] } | { error: string })) | null>(null);
  const [previewing, startPreview] = useTransition();
  const form = useForm<V>({
    resolver: zodResolver(Schema),
    defaultValues: { kind: "hapta", memberId: defaultMemberId ?? "", payerName: "", amount: defaultAmountPaise ? paiseToRupeeInput(defaultAmountPaise) : "", date: todayISO(), method: methods[0], reference: "", accountId: accounts[0]?._id ?? "", schemeId: defaultSchemeId ?? "", eventName: "", notes: "" },
  });
  const { submit, pending, error } = useApiSubmit(form);
  const [kind, memberId, amount, schemeId, accountId] = useWatch({ control: form.control, name: ["kind", "memberId", "amount", "schemeId", "accountId"] });
  const shown = useMemo(() => members.filter((m) => !search || `${m.name} ${m.membershipNumber}`.toLowerCase().includes(search.toLowerCase())).slice(0, 200), [members, search]);
  const e = form.formState.errors;

  // Live allocation preview so the collector sees exactly which installments will be paid.
  const validAmount = /^\d+(\.\d{1,2})?$/.test(amount ?? "") && Number(amount) > 0;
  const previewKey = kind === "hapta" && memberId && validAmount ? `${memberId}|${amount}|${schemeId ?? ""}` : null;
  useEffect(() => {
    if (!previewKey) return;
    const [mid, amt, sid] = previewKey.split("|");
    const t = setTimeout(() => {
      startPreview(async () => {
        const r = await apiRead<Alloc[]>(`/orgs/${orgId}/members/${mid}/allocation-preview?amount=${encodeURIComponent(amt)}${sid ? `&schemeId=${sid}` : ""}`);
        setPreview(r.ok ? { key: previewKey, allocs: r.data } : { key: previewKey, error: r.error });
      });
    }, 350);
    return () => clearTimeout(t);
  }, [previewKey, orgId]);
  const shownPreview = preview && preview.key === previewKey ? preview : null;

  return (
    <form
      noValidate
      className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      onSubmit={form.handleSubmit((v) =>
        submit<{ duplicate: boolean }>(
          {
            path: `/orgs/${orgId}/payments`,
            body: { ...v, memberId: v.memberId || null, payerName: v.payerName || undefined, schemeId: v.schemeId || null, eventName: v.eventName || undefined, reference: v.reference || undefined, notes: v.notes || undefined, idempotencyKey: key },
          },
          {
            success: "Collection recorded",
            onSuccess: () => {
              setKey(newIdempotencyKey("pay"));
              onDone();
            },
          },
        ),
      )}
    >
      <div className="sm:col-span-2">
        <FormError message={error} />
      </div>
      <Field label="Type" className="sm:col-span-2">
        <input type="hidden" id="rp-kind" {...form.register("kind")} />
        <ChoicePills
          label="Type"
          value={kind}
          onChange={(v) => form.setValue("kind", v, { shouldValidate: form.formState.isSubmitted })}
          options={[
            { value: "hapta", label: "Hapta", icon: <CalendarDays /> },
            { value: "membership_fee", label: "Membership fee" },
            { value: "event", label: "Event" },
            { value: "other_income", label: "Other income" },
          ]}
        />
      </Field>
      <Field label={kind === "hapta" ? "Member" : "Member (optional)"} htmlFor="rp-member" error={e.memberId?.message} className="sm:col-span-2">
        <div className="flex flex-col gap-1.5 sm:flex-row">
          <Input placeholder="Search…" value={search} onChange={(ev) => setSearch(ev.target.value)} aria-label="Search members" className="sm:w-40" />
          <NativeSelect id="rp-member" {...form.register("memberId")}>
            <option value="">{kind === "hapta" ? "Select member" : "— none —"}</option>
            {shown.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name} ({m.membershipNumber})
              </option>
            ))}
          </NativeSelect>
        </div>
      </Field>
      {kind !== "hapta" && !memberId && (
        <Field label="Payer name" htmlFor="rp-payer" error={e.payerName?.message} className="sm:col-span-2">
          <Input id="rp-payer" {...form.register("payerName")} />
        </Field>
      )}
      <Field label={`Amount (${money.symbol})`} htmlFor="rp-amount" error={e.amount?.message} className="sm:col-span-2">
        <AmountInput id="rp-amount" autoFocus {...form.register("amount")} />
      </Field>
      {kind === "hapta" && previewKey && (
        <div className="rounded-2xl bg-emerald-500/10 p-3 text-sm sm:col-span-2" aria-live="polite">
          <p className="mb-1 font-semibold text-emerald-800 dark:text-emerald-200">Will be applied to</p>
          {previewing && <p className="text-muted-foreground">Calculating…</p>}
          {shownPreview && "error" in shownPreview && <p className="text-destructive">{shownPreview.error}</p>}
          {shownPreview && "allocs" in shownPreview && shownPreview.allocs.length === 0 && <p className="text-muted-foreground">No open installments for this member.</p>}
          {shownPreview && "allocs" in shownPreview && <AllocList allocs={shownPreview.allocs} />}
        </div>
      )}
      {kind === "hapta" && schemes.length > 1 && (
        <Field label="Scheme (optional)" htmlFor="rp-scheme" hint="Limit allocation to one scheme." className="sm:col-span-2">
          <NativeSelect id="rp-scheme" {...form.register("schemeId")}>
            <option value="">Any scheme</option>
            {schemes.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
      )}
      {kind === "event" && (
        <Field label="Event" htmlFor="rp-event" className="sm:col-span-2">
          <Input id="rp-event" placeholder="e.g. Ganeshotsav 2026" {...form.register("eventName")} />
        </Field>
      )}
      <Field label="Date" htmlFor="rp-date" error={e.date?.message}>
        <Input id="rp-date" type="date" {...form.register("date")} />
      </Field>
      <input type="hidden" {...form.register("method")} />
      <PaidInCash />
      <MoreOptions bare icon={<SlidersHorizontal />} title="Account, reference & notes" description={accountName(accounts, accountId)} defaultOpen={!!e.accountId} className="sm:col-span-2">
        <Field label="Received into" htmlFor="rp-account" error={e.accountId?.message}>
          <NativeSelect id="rp-account" {...form.register("accountId")}>
            {accounts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Reference (UPI / cheque no.)" htmlFor="rp-ref">
          <Input id="rp-ref" {...form.register("reference")} />
        </Field>
        <Field label="Notes" htmlFor="rp-notes" className="sm:col-span-2">
          <Textarea id="rp-notes" rows={2} {...form.register("notes")} />
        </Field>
      </MoreOptions>
      <SubmitButton pending={pending} icon={<CheckCircle2 />} className="sm:col-span-2">
        Save collection
      </SubmitButton>
    </form>
  );
}

function accountName(accounts: Opt[], id: string | undefined) {
  const a = accounts.find((x) => x._id === id);
  return a ? `Into ${a.name}` : undefined;
}

function AllocList({ allocs }: { allocs: Alloc[] }) {
  const money = useMoney();
  return (
    <ul className="flex flex-col gap-0.5">
      {allocs.map((a) => (
        <li key={a.installmentId} className="flex justify-between gap-2">
          <span className="min-w-0 truncate">
            {a.schemeName} · {a.periodLabel} <span className="text-muted-foreground">(due {formatDate(a.dueDate)})</span>
          </span>
          <span className="tabular-nums">
            {money.fmt(a.amountPaise)}
            {a.penaltyPaise ? ` + ${money.fmt(a.penaltyPaise)} late fee` : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}

