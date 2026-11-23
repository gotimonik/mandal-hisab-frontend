"use client";

import { useT } from "@/i18n/client";
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
  const t = useT();
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
        <Input placeholder={t("schg.search")} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t("schg.search")} className="pl-9" />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-semibold text-primary tabular-nums">{t("schg.selected", { n: ids.length })}</span>
        <button
          type="button"
          className="font-semibold text-primary hover:underline"
          onClick={() => setSelected(Object.fromEntries(filtered.map((m) => [m._id, selected[m._id] ?? { amount: "", startDate: "" }])))}
        >
          {t("schg.selectAll")}
        </button>
      </div>
      <ul className="max-h-72 divide-y overflow-y-auto rounded-2xl ring-1 ring-foreground/10">
        {filtered.length === 0 && <li className="p-3 text-sm text-muted-foreground">{t("schg.allEnrolled")}</li>}
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
                  placeholder={t("schg.amountPh", { cur: money.symbol })}
                  aria-label={t("schg.amountFor", { name: m.name })}
                  value={selected[m._id].amount}
                  onChange={(e) => setSelected((s) => ({ ...s, [m._id]: { ...s[m._id], amount: e.target.value } }))}
                />
              )}
              {on && (
                <Input
                  className="w-36"
                  type="date"
                  aria-label={t("schg.startFor", { name: m.name })}
                  title={t("schg.startOpt")}
                  min={isoDate(startDate)}
                  value={selected[m._id].startDate}
                  onChange={(e) => setSelected((s) => ({ ...s, [m._id]: { ...s[m._id], startDate: e.target.value } }))}
                />
              )}
            </li>
          );
        })}
      </ul>
      <FormNote>{t("schg.note")}</FormNote>
      <Button
        size="lg"
        className="w-full"
        disabled={pending || ids.length === 0}
        onClick={() => {
          for (const id of ids) if (selected[id].amount && !/^\d+(\.\d{1,2})?$/.test(selected[id].amount)) return setError(t("schg.validAmounts"));
          submit(
            { path: `/orgs/${orgId}/schemes/${schemeId}/enroll`, body: { members: ids.map((id) => ({ memberId: id, amount: selected[id].amount || null, startDate: selected[id].startDate || undefined })) } },
            { success: t("schg.enrolled"), onSuccess: close },
          );
        }}
      >
        {pending ? <Loader2 className="animate-spin" /> : <UserPlus />} {ids.length === 1 ? t("schg.enroll1") : ids.length ? t("schg.enrollN", { n: ids.length }) : t("schg.enroll")}
      </Button>
    </div>
  );
}

export function EnrollDialog(props: { schemeId: string; members: { _id: string; name: string; membershipNumber: string }[]; memberSpecific: boolean; startDate: string }) {
  const t = useT();
  return (
    <FormDialog trigger={<><UserPlus /> {t("schg.enroll")}</>} title={t("schg.enroll")} description={t("schg.enrollD")} wide icon={<UserPlus />} tone="sky">
      <EnrollForm {...props} />
    </FormDialog>
  );
}

/* -------------------------------------------------- override one period */

const OverrideSchema = z.object({ mode: z.enum(["date", "amount", "skip"]), dueDate: z.string().optional(), amount: optionalRupees, reason: z.string().trim().min(3, "schg.reason").max(500) });

function OverrideForm({ schemeId, sequence, dueDate, label }: { schemeId: string; sequence: number; dueDate: string; label: string }) {
  const t = useT();
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
          { success: t("schg.periodUpdated"), onSuccess: close },
        ),
      )}
    >
      <FormNote>
        {t("schg.periodNote", { seq: sequence, label, date: formatDate(dueDate) })}
      </FormNote>
      <FormError message={error} />
      <Field label={t("schg.change")}>
        <ChoicePills
          label={t("schg.change")}
          value={mode}
          onChange={(v) => form.setValue("mode", v, { shouldDirty: true })}
          options={[
            { value: "date" as const, label: t("schg.dueDate"), icon: <CalendarCog /> },
            { value: "amount" as const, label: t("schg.amountL"), icon: <IndianRupee /> },
            { value: "skip" as const, label: t("schg.skip"), icon: <CalendarX2 /> },
          ]}
        />
      </Field>
      {mode === "date" && (
        <Field label={t("schg.newDate")} htmlFor="ov-date">
          <Input id="ov-date" type="date" {...form.register("dueDate")} />
        </Field>
      )}
      {mode === "amount" && (
        <Field label={t("schg.amount")} htmlFor="ov-amt" error={form.formState.errors.amount?.message}>
          <AmountInput id="ov-amt" {...form.register("amount")} />
        </Field>
      )}
      <Field label={t("schg.reasonL")} htmlFor="ov-reason" error={form.formState.errors.reason?.message}>
        <Input id="ov-reason" placeholder={t("schg.reasonPh")} {...form.register("reason")} />
      </Field>
      <SubmitButton pending={pending} icon={<CheckCircle2 />}>
        {t("schg.apply")}
      </SubmitButton>
    </form>
  );
}

export function OverrideDialog(props: { schemeId: string; sequence: number; dueDate: string; label: string }) {
  const t = useT();
  return (
    <FormDialog trigger={<><CalendarCog /> {t("schg.change")}</>} triggerVariant="ghost" triggerSize="xs" title={t("schg.changePeriod", { seq: props.sequence })} icon={<CalendarCog />} tone="indigo">
      <OverrideForm {...props} />
    </FormDialog>
  );
}

/* -------------------------------------------------- amount revision */

const RevisionSchema = z.object({ effectiveFrom: z.string().min(10, "schg.pickDate"), amount: rupees, reason: z.string().max(300).optional() });

function RevisionForm({ schemeId }: { schemeId: string }) {
  const t = useT();
  const { orgId } = useParams<{ orgId: string }>();
  const close = useDialogClose();
  const form = useForm<z.infer<typeof RevisionSchema>>({ resolver: zodResolver(RevisionSchema), defaultValues: { effectiveFrom: "", amount: "", reason: "" } });
  const { submit, pending, error } = useApiSubmit(form);
  return (
    <form noValidate className="flex flex-col gap-3" onSubmit={form.handleSubmit((v) => submit({ path: `/orgs/${orgId}/schemes/${schemeId}/revisions`, body: v }, { success: t("schg.futureUpdated"), onSuccess: close }))}>
      <FormNote>{t("schg.revNote")}</FormNote>
      <FormError message={error} />
      <Field label={t("schg.newAmount")} htmlFor="rv-amt" error={form.formState.errors.amount?.message}>
        <AmountInput id="rv-amt" {...form.register("amount")} />
      </Field>
      <Field label={t("schg.effective")} htmlFor="rv-date" error={form.formState.errors.effectiveFrom?.message}>
        <Input id="rv-date" type="date" {...form.register("effectiveFrom")} />
      </Field>
      <Field label={t("schg.reasonL")} htmlFor="rv-reason">
        <Input id="rv-reason" {...form.register("reason")} />
      </Field>
      <SubmitButton pending={pending} icon={<Coins />}>
        {t("schg.changeAmount")}
      </SubmitButton>
    </form>
  );
}

export function RevisionDialog({ schemeId }: { schemeId: string }) {
  const t = useT();
  return (
    <FormDialog trigger={<><Coins /> {t("schg.changeFuture")}</>} triggerVariant="outline" title={t("schg.changeFutureT")} icon={<Coins />} tone="indigo">
      <RevisionForm schemeId={schemeId} />
    </FormDialog>
  );
}
