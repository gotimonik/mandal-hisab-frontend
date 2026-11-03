"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BellRing, CheckCircle2, Loader2, Pencil, Plus, Repeat2, SkipForward, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Field, FormError } from "@/components/app/field";
import { NativeSelect } from "@/components/app/native-select";
import { FormDialog, useDialogClose } from "@/components/app/form-dialog";
import { AmountInput, SubmitButton } from "@/components/app/form-bits";
import { IconChip } from "@/components/app/bits";
import { Money } from "@/components/app/money";
import { apiMutate } from "@/lib/api-client";
import { optionalRupees } from "@/lib/schemas";
import { formatDate, paiseToRupeeInput, todayISO } from "@/lib/format";
import { TONE_CHIP, TONE_TEXT } from "@/lib/tones";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/client";
import type { Key, T } from "@/i18n/core";
import { CategoryIcon } from "./icons";
import { categoryName, REMIND_BEFORE, walletName, type PCategory, type PReminder, type PWallet, type Repeat } from "./types";

/** "1 day before", "at the time", "2 hours before" */
export function beforeLabel(t: T, min: number) {
  if (min === 0) return t("ph.rem.atTime");
  if (min < 60) return t("ph.rem.minBefore", { n: min });
  if (min < 1440) return t(min === 60 ? "ph.rem.hourBefore" : "ph.rem.hoursBefore", { n: min / 60 });
  if (min === 10080) return t("ph.rem.weekBefore");
  return t(min === 1440 ? "ph.rem.dayBefore" : "ph.rem.daysBefore", { n: min / 1440 });
}
/** "10:00 am" */
export const clock = (hm: string) => {
  const [h, m] = hm.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
};

/** Ready-made titles people pick most. */
const QUICK = ["houseRent", "officeRent", "electricity", "mobile", "schoolFees", "emi", "insurance", "maid"] as const;

function ReminderForm({ reminder, categories, wallets }: { reminder?: PReminder; categories: PCategory[]; wallets: PWallet[] }) {
  const t = useT();
  const router = useRouter();
  const close = useDialogClose();
  const cats = categories.filter((c) => c.kind === "expense" && (!c.isArchived || c._id === reminder?.category?._id));
  const ws = wallets.filter((w) => !w.isArchived || w._id === reminder?.wallet?._id);
  const [title, setTitle] = useState(reminder?.title ?? "");
  const [amount, setAmount] = useState(reminder?.amountPaise ? paiseToRupeeInput(reminder.amountPaise) : "");
  const [categoryId, setCategoryId] = useState(reminder?.category?._id ?? "");
  const [walletId, setWalletId] = useState(reminder?.wallet?._id ?? "");
  const [repeat, setRepeat] = useState<Repeat>(reminder?.repeat ?? "monthly");
  const [dueDate, setDueDate] = useState(reminder?.dueDate ?? todayISO());
  const [time, setTime] = useState(reminder?.time ?? "10:00");
  const [before, setBefore] = useState(reminder?.remindBeforeMinutes ?? 1440);
  const [note, setNote] = useState(reminder?.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const pickQuick = (k: (typeof QUICK)[number]) => {
    setTitle(t(`ph.rem.quick.${k}` as Key));
    // a matching starter category, so "Paid" can record it in the right place
    const key = { houseRent: "home", officeRent: "home", electricity: "bills", mobile: "bills", schoolFees: "education", emi: "loan", insurance: "bills", maid: "home" }[k];
    const c = cats.find((x) => x.key === key);
    if (c && !categoryId) setCategoryId(c._id);
  };

  const save = () => {
    if (!title.trim()) return setError(t("ph.rem.vTitle"));
    const a = optionalRupees.safeParse(amount);
    if (!a.success) return setError(a.error.issues[0].message);
    start(async () => {
      setError(null);
      const body = { title: title.trim(), amount: a.data || null, categoryId: categoryId || null, walletId: walletId || null, repeat, dueDate, time, remindBeforeMinutes: before, note: note.trim() || undefined };
      const res = reminder ? await apiMutate({ path: `/me/personal/reminders/${reminder._id}`, method: "PATCH", body }) : await apiMutate({ path: "/me/personal/reminders", body });
      if (!res.ok) return setError(res.fieldErrors ? Object.values(res.fieldErrors)[0] : res.error);
      toast.success(reminder ? t("ph.rem.updated") : t("ph.rem.saved"));
      close();
      router.refresh();
    });
  };

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
      <Field label={t("ph.rem.what")} htmlFor="rm-title">
        <Input id="rm-title" maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("ph.rem.whatPh")} autoFocus={!reminder} />
      </Field>
      {!reminder && (
        <div className="-mt-1 flex flex-wrap gap-1.5">
          {QUICK.map((k) => (
            <button key={k} type="button" onClick={() => pickQuick(k)} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">
              {t(`ph.rem.quick.${k}` as Key)}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("ph.rem.due")} htmlFor="rm-date">
          <Input id="rm-date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
        <Field label={t("ph.rem.time")} htmlFor="rm-time">
          <Input id="rm-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("ph.rem.remind")} htmlFor="rm-before">
          <NativeSelect id="rm-before" value={before} onChange={(e) => setBefore(Number(e.target.value))}>
            {REMIND_BEFORE.map((m) => (
              <option key={m} value={m}>
                {beforeLabel(t, m)}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label={t("ph.rem.repeat")} htmlFor="rm-repeat">
          <NativeSelect id="rm-repeat" value={repeat} onChange={(e) => setRepeat(e.target.value as Repeat)}>
            {(["once", "weekly", "monthly", "yearly"] as const).map((r) => (
              <option key={r} value={r}>
                {t(`ph.rem.repeats.${r}`)}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>
      <Field label={t("ph.rem.amount")} htmlFor="rm-amt" hint={t("ph.rem.amountHint")}>
        <AmountInput id="rm-amt" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="h-12 text-xl md:h-11 md:text-lg" />
      </Field>
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">{t("ph.entry.category")}</legend>
        <div className="flex flex-wrap gap-1.5">
          {cats.map((c) => (
            <button key={c._id} type="button" aria-pressed={categoryId === c._id} onClick={() => setCategoryId(categoryId === c._id ? "" : c._id)} className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition-colors", categoryId === c._id ? cn(TONE_CHIP[c.tone], "ring-2 ring-current") : "bg-card ring-foreground/10 hover:bg-muted")}>
              <CategoryIcon category={c} className={cn("size-3.5", categoryId === c._id ? "" : TONE_TEXT[c.tone])} aria-hidden />
              {categoryName(t, c)}
            </button>
          ))}
        </div>
      </fieldset>
      {ws.length > 1 && (
        <Field label={t("ph.entry.paidFrom")} htmlFor="rm-wallet">
          <NativeSelect id="rm-wallet" value={walletId} onChange={(e) => setWalletId(e.target.value)}>
            <option value="">{t("ph.rem.anyWallet")}</option>
            {ws.map((w) => (
              <option key={w._id} value={w._id}>
                {walletName(t, w)}
              </option>
            ))}
          </NativeSelect>
        </Field>
      )}
      <Field label={t("ph.entry.note")} htmlFor="rm-note">
        <Textarea id="rm-note" rows={2} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("ph.rem.notePh")} />
      </Field>
      <SubmitButton pending={pending} icon={<BellRing />}>
        {t("ph.rem.save")}
      </SubmitButton>
    </form>
  );
}

export function ReminderDialog({ reminder, categories, wallets, defaultOpen }: { reminder?: PReminder; categories: PCategory[]; wallets: PWallet[]; defaultOpen?: boolean }) {
  const t = useT();
  return (
    <FormDialog
      defaultOpen={defaultOpen}
      trigger={reminder ? <><Pencil /> {t("ph.edit")}</> : <><Plus /> {t("ph.rem.add")}</>}
      triggerVariant={reminder ? "ghost" : "default"}
      triggerSize={reminder ? "xs" : "default"}
      title={reminder ? t("ph.rem.editTitle") : t("ph.rem.add")}
      description={t("ph.rem.formDesc")}
      icon={<BellRing />}
      tone="amber"
    >
      <ReminderForm reminder={reminder} categories={categories} wallets={wallets} />
    </FormDialog>
  );
}

/** "Paid": the amount, date and wallet, and whether to add it to the spending. */
function PaidForm({ reminder, wallets }: { reminder: PReminder; wallets: PWallet[] }) {
  const t = useT();
  const router = useRouter();
  const close = useDialogClose();
  const ws = wallets.filter((w) => !w.isArchived);
  const canRecord = !!reminder.category;
  const [record, setRecord] = useState(canRecord);
  const [amount, setAmount] = useState(reminder.amountPaise ? paiseToRupeeInput(reminder.amountPaise) : "");
  const [date, setDate] = useState(todayISO());
  const [walletId, setWalletId] = useState(reminder.wallet?._id ?? ws[0]?._id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      noValidate
      className="grid grid-cols-1 gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const a = optionalRupees.safeParse(amount);
        if (record && (!a.success || !a.data)) return setError(t("ph.rem.vAmount"));
        start(async () => {
          setError(null);
          const res = await apiMutate({ path: `/me/personal/reminders/${reminder._id}/paid`, body: record ? { record: true, amount: a.data, date, walletId } : { record: false, date } });
          if (!res.ok) return setError(res.error);
          toast.success(record ? t("ph.rem.paidSaved") : t("ph.rem.done"));
          close();
          router.refresh();
        });
      }}
    >
      <FormError message={error} />
      {canRecord ? (
        <div className="flex items-start gap-2.5 rounded-2xl bg-muted/50 p-3">
          <Checkbox id="rm-record" checked={record} onCheckedChange={(v) => setRecord(v === true)} />
          <Label htmlFor="rm-record" className="flex-col items-start gap-0.5 font-medium">
            {t("ph.rem.addToSpending")}
            <span className="text-xs font-normal text-muted-foreground">{t("ph.rem.addToSpendingHint", { cat: categoryName(t, reminder.category) })}</span>
          </Label>
        </div>
      ) : (
        <p className="rounded-2xl bg-muted/50 p-3 text-xs text-muted-foreground">{t("ph.rem.noCategory")}</p>
      )}
      {record && (
        <>
          <Field label={t("ph.entry.amount")} htmlFor="rm-paid-amt">
            <AmountInput id="rm-paid-amt" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("common.date")} htmlFor="rm-paid-date">
              <Input id="rm-paid-date" type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
            </Field>
            {ws.length > 1 && (
              <Field label={t("ph.entry.paidFrom")} htmlFor="rm-paid-wallet">
                <NativeSelect id="rm-paid-wallet" value={walletId} onChange={(e) => setWalletId(e.target.value)}>
                  {ws.map((w) => (
                    <option key={w._id} value={w._id}>
                      {walletName(t, w)}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            )}
          </div>
        </>
      )}
      <p className="text-xs text-muted-foreground">{reminder.repeat === "once" ? t("ph.rem.paidOnce") : t("ph.rem.paidNext")}</p>
      <SubmitButton pending={pending} icon={<CheckCircle2 />}>
        {t("ph.rem.markPaid")}
      </SubmitButton>
    </form>
  );
}

function SkipButton({ id }: { id: string }) {
  const t = useT();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      size="xs"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await apiMutate({ path: `/me/personal/reminders/${id}/skip` });
          if (!res.ok) return void toast.error(res.error);
          toast.success(t("ph.rem.skipped"));
          router.refresh();
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" /> : <SkipForward />} {t("ph.rem.skip")}
    </Button>
  );
}

function DeleteButton({ id }: { id: string }) {
  const t = useT();
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();
  if (!confirm)
    return (
      <Button variant="ghost" size="xs" className="text-destructive" onClick={() => setConfirm(true)}>
        <Trash2 /> {t("ph.settings.remove")}
      </Button>
    );
  return (
    <Button
      variant="destructive"
      size="xs"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await apiMutate({ path: `/me/personal/reminders/${id}`, method: "DELETE" });
          if (!res.ok) return void toast.error(res.error);
          toast.success(t("ph.rem.deleted"));
          router.refresh();
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" /> : <Trash2 />} {t("ph.rem.confirmDelete")}
    </Button>
  );
}

/** "Overdue", "Today", "Tomorrow", "In 5 days" */
export function dueWord(t: T, r: Pick<PReminder, "status" | "daysLeft">) {
  if (r.status === "done") return t("ph.rem.statusDone");
  if (r.status === "overdue") return t("ph.rem.overdue");
  if (r.daysLeft <= 0) return t("ph.today");
  if (r.daysLeft === 1) return t("ph.rem.tomorrow");
  return t("ph.rem.inDays", { n: r.daysLeft });
}

/** One reminder: what, how much, when, and its actions. */
export function ReminderCard({ r, categories, wallets, compact = false }: { r: PReminder; categories: PCategory[]; wallets: PWallet[]; compact?: boolean }) {
  const t = useT();
  const tone = r.status === "overdue" ? "rose" : r.status === "today" ? "amber" : (r.category?.tone ?? "amber");
  return (
    <article className={cn("rounded-2xl bg-card p-3.5 shadow-card ring-1", r.status === "overdue" ? "ring-rose-500/30" : r.status === "today" ? "ring-amber-500/40" : "ring-foreground/[0.06]", !r.isActive && "opacity-70")}>
      <div className="flex items-start gap-3">
        <IconChip tone={tone}>{r.category ? <CategoryIcon category={r.category} /> : <BellRing />}</IconChip>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-semibold">{r.title}</p>
            {r.amountPaise ? <Money paise={r.amountPaise} short className="shrink-0 font-bold" /> : null}
          </div>
          <p className="text-xs text-muted-foreground">
            <span className={cn("font-semibold", r.status === "overdue" && "text-destructive", r.status === "today" && "text-warning-ink")}>{dueWord(t, r)}</span>
            {" · "}
            {formatDate(r.dueDate)}, {clock(r.time)}
          </p>
          {!compact && (
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
              {r.repeat !== "once" && (
                <span className="inline-flex items-center gap-1">
                  <Repeat2 className="size-3" /> {t(`ph.rem.repeats.${r.repeat}`)}
                </span>
              )}
              {r.isActive && (
                <span className="inline-flex items-center gap-1">
                  <BellRing className="size-3" /> {r.notified ? t("ph.rem.sent") : beforeLabel(t, r.remindBeforeMinutes)}
                </span>
              )}
              {r.note && <span className="truncate">{r.note}</span>}
            </p>
          )}
        </div>
      </div>
      {!compact && (
        <div className="mt-2.5 flex flex-wrap items-center justify-end gap-1 border-t border-border/60 pt-2">
          {r.isActive && (
            <FormDialog trigger={<><CheckCircle2 /> {t("ph.rem.markPaid")}</>} triggerSize="xs" triggerVariant={r.status === "overdue" || r.status === "today" ? "default" : "outline"} title={t("ph.rem.paidTitle", { title: r.title })} description={`${formatDate(r.dueDate)}, ${clock(r.time)}`} icon={<CheckCircle2 />} tone="emerald">
              <PaidForm reminder={r} wallets={wallets} />
            </FormDialog>
          )}
          {r.isActive && r.repeat !== "once" && <SkipButton id={r._id} />}
          <ReminderDialog reminder={r} categories={categories} wallets={wallets} />
          <DeleteButton id={r._id} />
        </div>
      )}
    </article>
  );
}
