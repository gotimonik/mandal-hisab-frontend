"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarCog, CalendarX2, CheckCircle2, Coins, IndianRupee, Loader2, Search, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FormError } from "@/components/app/field";
import { FormDialog, useDialogClose } from "@/components/app/form-dialog";
import { useApiSubmit } from "@/components/app/use-api-form";
import { MemberAvatar } from "@/components/app/bits";
import { AmountInput, ChoicePills, FormNote, SubmitButton } from "@/components/app/form-bits";
import { cn } from "@/lib/utils";
import { formatDate, isoDate } from "@/lib/format";
import { optionalRupees, rupees } from "@/lib/schemas";
import { useMoney } from "@/components/app/currency";

/* -------------------------------------------------- enroll */

function EnrollForm({ schemeId, members, memberSpecific, startDate }: { schemeId: string; members: { _id: string; name: string; membershipNumber: string }[]; memberSpecific: boolean; startDate: string }) {
  const money = useMoney();
  const { orgId } = useParams<{ orgId: string }>();
  const close = useDialogClose();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Record<string, { amount: string; startDate: string }>>({});
  const form = useForm();
  const { submit, pending, error, setError } = useApiSubmit(form);
  const filtered = useMemo(() => members.filter((m) => `${m.name} ${m.membershipNumber}`.toLowerCase().includes(q.toLowerCase())), [members, q]);
  const ids = Object.keys(selected);
  return (
    <div className="flex flex-col gap-3">
      <FormError message={error} />
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search members" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search members" className="pl-9" />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-semibold text-primary tabular-nums">{ids.length} selected</span>
        <button
          type="button"
          className="font-semibold text-primary hover:underline"
          onClick={() => setSelected(Object.fromEntries(filtered.map((m) => [m._id, selected[m._id] ?? { amount: "", startDate: "" }])))}
        >
          Select all shown
        </button>
      </div>
      <ul className="max-h-72 divide-y overflow-y-auto rounded-2xl ring-1 ring-foreground/10">
        {filtered.length === 0 && <li className="p-3 text-sm text-muted-foreground">All active members are already enrolled.</li>}
        {filtered.map((m) => {
          const on = !!selected[m._id];
          return (
            <li key={m._id} className={cn("flex flex-wrap items-center gap-2 px-3 py-2.5 text-sm transition-colors", on && "bg-primary/5")}>
              <label className="flex flex-1 items-center gap-2">
                <Checkbox
                  checked={on}
                  onCheckedChange={(c) =>
                    setSelected((s) => {
                      const n = { ...s };
                      if (c) n[m._id] = { amount: "", startDate: "" };
                      else delete n[m._id];
                      return n;
                    })
                  }
                />
                <MemberAvatar name={m.name} size="sm" />
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{m.name}</span>
                  <span className="block text-xs text-muted-foreground">{m.membershipNumber}</span>
                </span>
              </label>
              {on && memberSpecific && (
                <Input
                  className="w-28"
                  inputMode="decimal"
                  placeholder={`${money.symbol} amount`}
                  aria-label={`Amount for ${m.name}`}
                  value={selected[m._id].amount}
                  onChange={(e) => setSelected((s) => ({ ...s, [m._id]: { ...s[m._id], amount: e.target.value } }))}
                />
              )}
              {on && (
                <Input
                  className="w-36"
                  type="date"
                  aria-label={`Start date for ${m.name}`}
                  title="Member start date (optional)"
                  min={isoDate(startDate)}
                  value={selected[m._id].startDate}
                  onChange={(e) => setSelected((s) => ({ ...s, [m._id]: { ...s[m._id], startDate: e.target.value } }))}
                />
              )}
            </li>
          );
        })}
      </ul>
      <FormNote>Leave the date empty to start from the scheme start date. Installments before a member&apos;s start date are not charged.</FormNote>
      <Button
        size="lg"
        className="w-full"
        disabled={pending || ids.length === 0}
        onClick={() => {
          for (const id of ids) if (selected[id].amount && !/^\d+(\.\d{1,2})?$/.test(selected[id].amount)) return setError("Enter valid amounts (max 2 decimals)");
          submit(
            { path: `/orgs/${orgId}/schemes/${schemeId}/enroll`, body: { members: ids.map((id) => ({ memberId: id, amount: selected[id].amount || null, startDate: selected[id].startDate || undefined })) } },
            { success: "Members enrolled and installments generated", onSuccess: close },
          );
        }}
      >
        {pending ? <Loader2 className="animate-spin" /> : <UserPlus />} Enroll {ids.length || ""} member{ids.length === 1 ? "" : "s"}
      </Button>
    </div>
  );
}

export function EnrollDialog(props: { schemeId: string; members: { _id: string; name: string; membershipNumber: string }[]; memberSpecific: boolean; startDate: string }) {
  return (
    <FormDialog trigger={<><UserPlus /> Enroll members</>} title="Enroll members" description="Installments are generated immediately for each enrolled member." wide icon={<UserPlus />} tone="sky">
      <EnrollForm {...props} />
    </FormDialog>
  );
}

/* -------------------------------------------------- override one period */

const OverrideSchema = z.object({ mode: z.enum(["date", "amount", "skip"]), dueDate: z.string().optional(), amount: optionalRupees, reason: z.string().trim().min(3, "Please give a reason").max(500) });

function OverrideForm({ schemeId, sequence, dueDate, label }: { schemeId: string; sequence: number; dueDate: string; label: string }) {
  const money = useMoney();
  const { orgId } = useParams<{ orgId: string }>();
  const close = useDialogClose();
  const form = useForm<z.input<typeof OverrideSchema>, unknown, z.output<typeof OverrideSchema>>({ resolver: zodResolver(OverrideSchema), defaultValues: { mode: "date", dueDate: isoDate(dueDate), amount: "", reason: "" } });
  const { submit, pending, error } = useApiSubmit(form);
  const mode = useWatch({ control: form.control, name: "mode" });
  return (
    <form
      noValidate
      className="flex flex-col gap-3"
      onSubmit={form.handleSubmit((v) =>
        submit(
          { path: `/orgs/${orgId}/schemes/${schemeId}/overrides`, body: { sequence, reason: v.reason, ...(v.mode === "date" ? { dueDate: v.dueDate } : v.mode === "amount" ? { amount: v.amount } : { skip: true }) } },
          { success: "Period updated for all members", onSuccess: close },
        ),
      )}
    >
      <FormNote>
        Period #{sequence} · {label} · currently due {formatDate(dueDate)}. Applies to every enrolled member&apos;s unpaid installment for this period; other months are unchanged.
      </FormNote>
      <FormError message={error} />
      <Field label="Change">
        <ChoicePills
          label="Change"
          value={mode}
          onChange={(v) => form.setValue("mode", v, { shouldDirty: true })}
          options={[
            { value: "date" as const, label: "Due date", icon: <CalendarCog /> },
            { value: "amount" as const, label: "Amount", icon: <IndianRupee /> },
            { value: "skip" as const, label: "Skip this period", icon: <CalendarX2 /> },
          ]}
        />
      </Field>
      {mode === "date" && (
        <Field label="New due date" htmlFor="ov-date">
          <Input id="ov-date" type="date" {...form.register("dueDate")} />
        </Field>
      )}
      {mode === "amount" && (
        <Field label={`Amount (${money.symbol})`} htmlFor="ov-amt" error={form.formState.errors.amount?.message}>
          <AmountInput id="ov-amt" {...form.register("amount")} />
        </Field>
      )}
      <Field label="Reason" htmlFor="ov-reason" error={form.formState.errors.reason?.message}>
        <Input id="ov-reason" placeholder="e.g. Navratri — collection moved" {...form.register("reason")} />
      </Field>
      <SubmitButton pending={pending} icon={<CheckCircle2 />}>
        Apply
      </SubmitButton>
    </form>
  );
}

export function OverrideDialog(props: { schemeId: string; sequence: number; dueDate: string; label: string }) {
  return (
    <FormDialog trigger={<><CalendarCog /> Change</>} triggerVariant="ghost" triggerSize="xs" title={`Change period #${props.sequence}`} icon={<CalendarCog />} tone="indigo">
      <OverrideForm {...props} />
    </FormDialog>
  );
}

/* -------------------------------------------------- amount revision */

const RevisionSchema = z.object({ effectiveFrom: z.string().min(10, "Pick a date"), amount: rupees, reason: z.string().max(300).optional() });

function RevisionForm({ schemeId }: { schemeId: string }) {
  const money = useMoney();
  const { orgId } = useParams<{ orgId: string }>();
  const close = useDialogClose();
  const form = useForm<z.infer<typeof RevisionSchema>>({ resolver: zodResolver(RevisionSchema), defaultValues: { effectiveFrom: "", amount: "", reason: "" } });
  const { submit, pending, error } = useApiSubmit(form);
  return (
    <form noValidate className="flex flex-col gap-3" onSubmit={form.handleSubmit((v) => submit({ path: `/orgs/${orgId}/schemes/${schemeId}/revisions`, body: v }, { success: "Future installments updated", onSuccess: close }))}>
      <FormNote>Unpaid installments due on or after the date get the new amount. Paid or partly paid installments and member-specific amounts keep their history.</FormNote>
      <FormError message={error} />
      <Field label={`New amount (${money.symbol})`} htmlFor="rv-amt" error={form.formState.errors.amount?.message}>
        <AmountInput id="rv-amt" {...form.register("amount")} />
      </Field>
      <Field label="Effective from" htmlFor="rv-date" error={form.formState.errors.effectiveFrom?.message}>
        <Input id="rv-date" type="date" {...form.register("effectiveFrom")} />
      </Field>
      <Field label="Reason" htmlFor="rv-reason">
        <Input id="rv-reason" {...form.register("reason")} />
      </Field>
      <SubmitButton pending={pending} icon={<Coins />}>
        Change amount
      </SubmitButton>
    </form>
  );
}

export function RevisionDialog({ schemeId }: { schemeId: string }) {
  return (
    <FormDialog trigger={<><Coins /> Change future amount</>} triggerVariant="outline" title="Change future installment amount" icon={<Coins />} tone="indigo">
      <RevisionForm schemeId={schemeId} />
    </FormDialog>
  );
}
