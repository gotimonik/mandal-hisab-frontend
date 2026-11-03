"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BellRing, CalendarClock, CheckCircle2, HandCoins, Loader2, MessageCircle, Pencil, Phone, Plus, Repeat2, SkipForward, Trash2, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { formatDate, formatINR, paiseToRupeeInput, todayISO } from "@/lib/format";
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
const QUICK_IN = ["lent", "work", "tenant", "deposit", "sale"] as const;
type Kind = PReminder["kind"];

/** "5,000" or "5,000.50" (the ₹ is in the sentence) */
const rupees = (paise: number) => formatINR(paise, { symbol: false, decimals: paise % 100 !== 0 });

/** wa.me wants digits with the country code: a 10-digit Indian number gets 91 in front. */
export function waNumber(phone: string) {
  const d = phone.replace(/\D/g, "");
  return d.length === 10 ? `91${d}` : d.replace(/^0+/, "");
}

function ReminderForm({ reminder, categories, wallets, kind: startKind = "pay" }: { reminder?: PReminder; categories: PCategory[]; wallets: PWallet[]; kind?: Kind }) {
  const t = useT();
  const router = useRouter();
  const close = useDialogClose();
  const [kind, setKind] = useState<Kind>(reminder?.kind ?? startKind);
  const receive = kind === "receive";
  const cats = categories.filter((c) => c.kind === (receive ? "income" : "expense") && (!c.isArchived || c._id === reminder?.category?._id));
  const ws = wallets.filter((w) => !w.isArchived || w._id === reminder?.wallet?._id);
  const [person, setPerson] = useState(reminder?.person ?? "");
  const [phone, setPhone] = useState(reminder?.phone ?? "");
  const [title, setTitle] = useState(reminder?.title ?? "");
  const [amount, setAmount] = useState(reminder?.amountPaise ? paiseToRupeeInput(reminder.amountPaise) : "");
  const [categoryId, setCategoryId] = useState(reminder?.category?._id ?? "");
  const [walletId, setWalletId] = useState(reminder?.wallet?._id ?? "");
  const [repeat, setRepeat] = useState<Repeat>(reminder?.repeat ?? (startKind === "receive" ? "once" : "monthly"));
  const [dueDate, setDueDate] = useState(reminder?.dueDate ?? todayISO());
  const [time, setTime] = useState(reminder?.time ?? "10:00");
  const [before, setBefore] = useState(reminder?.remindBeforeMinutes ?? (startKind === "receive" ? 0 : 1440));
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
  const pickQuickIn = (k: (typeof QUICK_IN)[number]) => {
    setTitle(t(`ph.rem.quickIn.${k}` as Key));
    const key = { lent: "other_income", work: "business", tenant: "other_income", deposit: "refund", sale: "business" }[k];
    const c = cats.find((x) => x.key === key);
    if (c && !categoryId) setCategoryId(c._id);
  };
  const switchKind = (k: Kind) => {
    if (k === kind) return;
    setKind(k);
    setCategoryId(""); // spending and income categories are different lists
    if (!reminder) {
      setRepeat(k === "receive" ? "once" : "monthly");
      setBefore(k === "receive" ? 0 : 1440);
    }
  };

  const save = () => {
    if (!title.trim()) return setError(t("ph.rem.vTitle"));
    const a = optionalRupees.safeParse(amount);
    if (!a.success) return setError(a.error.issues[0].message);
    start(async () => {
      setError(null);
      const body = { kind, person: receive ? person.trim() || undefined : undefined, phone: receive ? phone.trim() || undefined : undefined, title: title.trim(), amount: a.data || null, categoryId: categoryId || null, walletId: walletId || null, repeat, dueDate, time, remindBeforeMinutes: before, note: note.trim() || undefined };
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
      <div role="radiogroup" aria-label={t("ph.rem.kindLabel")} className="grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1">
        {(["pay", "receive"] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={kind === k}
            onClick={() => switchKind(k)}
            className={cn("flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors", kind === k ? (k === "pay" ? "bg-card text-rose-600 shadow-sm dark:text-rose-400" : "bg-card text-emerald-600 shadow-sm dark:text-emerald-400") : "text-muted-foreground hover:text-foreground")}
          >
            {k === "pay" ? <BellRing className="size-4" /> : <HandCoins className="size-4" />}
            {t(k === "pay" ? "ph.rem.kindPay" : "ph.rem.kindReceive")}
          </button>
        ))}
      </div>
      {receive && (
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("ph.rem.person")} htmlFor="rm-person">
            <Input id="rm-person" maxLength={60} value={person} onChange={(e) => setPerson(e.target.value)} placeholder={t("ph.rem.personPh")} autoFocus={!reminder} />
          </Field>
          <Field label={t("ph.rem.phone")} htmlFor="rm-phone">
            <Input id="rm-phone" type="tel" inputMode="tel" maxLength={20} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98XXX XXXXX" />
          </Field>
        </div>
      )}
      <Field label={t(receive ? "ph.rem.whatIn" : "ph.rem.what")} htmlFor="rm-title">
        <Input id="rm-title" maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t(receive ? "ph.rem.whatInPh" : "ph.rem.whatPh")} autoFocus={!reminder && !receive} />
      </Field>
      {!reminder && (
        <div className="-mt-1 flex flex-wrap gap-1.5">
          {receive
            ? QUICK_IN.map((k) => (
                <button key={k} type="button" onClick={() => pickQuickIn(k)} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">
                  {t(`ph.rem.quickIn.${k}` as Key)}
                </button>
              ))
            : QUICK.map((k) => (
                <button key={k} type="button" onClick={() => pickQuick(k)} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">
                  {t(`ph.rem.quick.${k}` as Key)}
                </button>
              ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label={t(receive ? "ph.rem.dueIn" : "ph.rem.due")} htmlFor="rm-date">
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
      <Field label={t("ph.rem.amount")} htmlFor="rm-amt" hint={t(receive ? "ph.rem.amountInHint" : "ph.rem.amountHint")}>
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
        <Field label={t(receive ? "ph.rem.comesInto" : "ph.entry.paidFrom")} htmlFor="rm-wallet">
          <NativeSelect id="rm-wallet" value={walletId} onChange={(e) => setWalletId(e.target.value)}>
            <option value="">{t(receive ? "ph.rem.anyWalletIn" : "ph.rem.anyWallet")}</option>
            {ws.map((w) => (
              <option key={w._id} value={w._id}>
                {walletName(t, w)}
              </option>
            ))}
          </NativeSelect>
        </Field>
      )}
      <Field label={t("ph.entry.note")} htmlFor="rm-note">
        <Textarea id="rm-note" rows={2} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t(receive ? "ph.rem.noteInPh" : "ph.rem.notePh")} />
      </Field>
      <SubmitButton pending={pending} icon={receive ? <HandCoins /> : <BellRing />}>
        {t("ph.rem.save")}
      </SubmitButton>
    </form>
  );
}

export function ReminderDialog({ reminder, categories, wallets, defaultOpen, kind = "pay" }: { reminder?: PReminder; categories: PCategory[]; wallets: PWallet[]; defaultOpen?: boolean; kind?: Kind }) {
  const t = useT();
  const receive = (reminder?.kind ?? kind) === "receive";
  return (
    <FormDialog
      defaultOpen={defaultOpen}
      trigger={reminder ? <><Pencil /> {t("ph.edit")}</> : receive ? <><HandCoins /> {t("ph.rem.addIn")}</> : <><Plus /> {t("ph.rem.add")}</>}
      triggerVariant={reminder ? "ghost" : receive ? "outline" : "default"}
      triggerSize={reminder ? "xs" : "default"}
      title={reminder ? t("ph.rem.editTitle") : receive ? t("ph.rem.addIn") : t("ph.rem.add")}
      description={t(receive ? "ph.rem.formDescIn" : "ph.rem.formDesc")}
      icon={receive ? <HandCoins /> : <BellRing />}
      tone={receive ? "emerald" : "amber"}
    >
      <ReminderForm reminder={reminder} categories={categories} wallets={wallets} kind={kind} />
    </FormDialog>
  );
}

/** "Paid" / "Received": the amount, date and wallet, and whether to add it to the spending (or income). */
function PaidForm({ reminder, wallets }: { reminder: PReminder; wallets: PWallet[] }) {
  const t = useT();
  const router = useRouter();
  const close = useDialogClose();
  const receive = reminder.kind === "receive";
  const ws = wallets.filter((w) => !w.isArchived);
  const canRecord = !!reminder.category;
  // part of it: only for a one-time "money to receive" with an amount
  const canPart = receive && reminder.repeat === "once" && !!reminder.amountPaise;
  const [record, setRecord] = useState(canRecord);
  const [amount, setAmount] = useState(reminder.amountPaise ? paiseToRupeeInput(reminder.amountPaise) : "");
  const [date, setDate] = useState(todayISO());
  const [walletId, setWalletId] = useState(reminder.wallet?._id ?? ws[0]?._id ?? "");
  const [nextDue, setNextDue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const a = optionalRupees.safeParse(amount);
  const part = canPart && a.success && !!a.data && Math.round(Number(a.data) * 100) < reminder.amountPaise!;
  return (
    <form
      noValidate
      className="grid grid-cols-1 gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if ((record || part) && (!a.success || !a.data)) return setError(t(receive ? "ph.rem.vAmountIn" : "ph.rem.vAmount"));
        if (part && !nextDue) return setError(t("ph.rem.vRestDate"));
        start(async () => {
          setError(null);
          const body = part ? { record, partial: true, amount: a.data, date, walletId, nextDueDate: nextDue } : record ? { record: true, amount: a.data, date, walletId } : { record: false, date };
          const res = await apiMutate({ path: `/me/personal/reminders/${reminder._id}/paid`, body });
          if (!res.ok) return setError(res.error);
          toast.success(part ? t("ph.rem.partSaved") : record ? t(receive ? "ph.rem.receivedSaved" : "ph.rem.paidSaved") : t("ph.rem.done"));
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
            {t(receive ? "ph.rem.addToIncome" : "ph.rem.addToSpending")}
            <span className="text-xs font-normal text-muted-foreground">{t(receive ? "ph.rem.addToIncomeHint" : "ph.rem.addToSpendingHint", { cat: categoryName(t, reminder.category) })}</span>
          </Label>
        </div>
      ) : (
        <p className="rounded-2xl bg-muted/50 p-3 text-xs text-muted-foreground">{t(receive ? "ph.rem.noCategoryIn" : "ph.rem.noCategory")}</p>
      )}
      {(record || canPart) && (
        <>
          <Field label={t(receive ? "ph.rem.amountGot" : "ph.entry.amount")} htmlFor="rm-paid-amt" hint={canPart ? t("ph.rem.partHint") : undefined}>
            <AmountInput id="rm-paid-amt" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("common.date")} htmlFor="rm-paid-date">
              <Input id="rm-paid-date" type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
            </Field>
            {record && ws.length > 1 && (
              <Field label={t(receive ? "ph.rem.comesInto" : "ph.entry.paidFrom")} htmlFor="rm-paid-wallet">
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
      {part && (
        <div className="grid grid-cols-1 gap-2 rounded-2xl bg-emerald-500/8 p-3 ring-1 ring-emerald-500/20">
          <p className="text-sm font-medium">{t("ph.rem.restLeft", { amount: rupees(reminder.amountPaise! - Math.round(Number(a.data) * 100)) })}</p>
          <Field label={t("ph.rem.restWhen")} htmlFor="rm-rest-date">
            <Input id="rm-rest-date" type="date" value={nextDue} min={todayISO()} onChange={(e) => setNextDue(e.target.value)} />
          </Field>
        </div>
      )}
      {!part && <p className="text-xs text-muted-foreground">{reminder.repeat === "once" ? t("ph.rem.paidOnce") : t("ph.rem.paidNext")}</p>}
      <SubmitButton pending={pending} icon={<CheckCircle2 />}>
        {part ? t("ph.rem.savePart") : t(receive ? "ph.rem.markReceived" : "ph.rem.markPaid")}
      </SubmitButton>
    </form>
  );
}

/** "Not yet — remind me again on …" */
function LaterForm({ reminder }: { reminder: PReminder }) {
  const t = useT();
  const router = useRouter();
  const close = useDialogClose();
  // tomorrow (India date)
  const [dueDate, setDueDate] = useState(() => new Date(new Date(`${todayISO()}T00:00:00Z`).getTime() + 86_400_000).toISOString().slice(0, 10));
  const [time, setTime] = useState(reminder.time);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      noValidate
      className="grid grid-cols-1 gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          setError(null);
          const res = await apiMutate({ path: `/me/personal/reminders/${reminder._id}/later`, body: { dueDate, time } });
          if (!res.ok) return setError(res.fieldErrors ? Object.values(res.fieldErrors)[0] : res.error);
          toast.success(t("ph.rem.laterSaved", { date: formatDate(dueDate) }));
          close();
          router.refresh();
        });
      }}
    >
      <FormError message={error} />
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("ph.rem.newDate")} htmlFor="rm-later-date">
          <Input id="rm-later-date" type="date" value={dueDate} min={todayISO()} onChange={(e) => setDueDate(e.target.value)} autoFocus />
        </Field>
        <Field label={t("ph.rem.time")} htmlFor="rm-later-time">
          <Input id="rm-later-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
      </div>
      <p className="text-xs text-muted-foreground">{reminder.repeat === "once" ? t("ph.rem.laterOnce") : t("ph.rem.laterRepeat")}</p>
      <SubmitButton pending={pending} icon={<CalendarClock />}>
        {t("ph.rem.laterSave")}
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
  const receive = r.kind === "receive";
  const tone = r.status === "overdue" ? "rose" : r.status === "today" ? "amber" : receive ? "emerald" : (r.category?.tone ?? "amber");
  return (
    <article className={cn("rounded-2xl bg-card p-3.5 shadow-card ring-1", r.status === "overdue" ? "ring-rose-500/30" : r.status === "today" ? "ring-amber-500/40" : "ring-foreground/[0.06]", !r.isActive && "opacity-70")}>
      <div className="flex items-start gap-3">
        <IconChip tone={tone}>{receive ? <HandCoins /> : r.category ? <CategoryIcon category={r.category} /> : <BellRing />}</IconChip>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-semibold">{r.title}</p>
            {r.amountPaise ? <Money paise={r.amountPaise} short className={cn("shrink-0 font-bold", receive && "text-emerald-600 dark:text-emerald-400")} /> : null}
          </div>
          {receive && r.person && (
            <p className="flex items-center gap-1 text-xs font-medium">
              <User className="size-3 text-muted-foreground" /> {t("ph.rem.from", { name: r.person })}
            </p>
          )}
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
          {r.isActive && receive && r.phone && (
            <>
              <a className={buttonVariants({ variant: "ghost", size: "xs" })} href={`tel:${r.phone.replace(/\s/g, "")}`}>
                <Phone /> {t("ph.rem.call")}
              </a>
              <a className={buttonVariants({ variant: "ghost", size: "xs" })} href={`https://wa.me/${waNumber(r.phone)}?text=${encodeURIComponent(t(r.amountPaise ? "ph.rem.waText" : "ph.rem.waTextNoAmt", { name: r.person ?? "", amount: r.amountPaise ? rupees(r.amountPaise) : "", title: r.title }))}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle /> {t("ph.rem.whatsapp")}
              </a>
            </>
          )}
          {r.isActive && (
            <FormDialog trigger={<><CalendarClock /> {t(receive ? "ph.rem.notYet" : "ph.rem.later")}</>} triggerSize="xs" triggerVariant="ghost" title={t("ph.rem.laterTitle")} description={r.title} icon={<CalendarClock />} tone="sky">
              <LaterForm reminder={r} />
            </FormDialog>
          )}
          {r.isActive && (
            <FormDialog trigger={<><CheckCircle2 /> {t(receive ? "ph.rem.markReceived" : "ph.rem.markPaid")}</>} triggerSize="xs" triggerVariant={r.status === "overdue" || r.status === "today" ? "default" : "outline"} title={t(receive ? "ph.rem.receivedTitle" : "ph.rem.paidTitle", { title: r.title })} description={`${formatDate(r.dueDate)}, ${clock(r.time)}`} icon={<CheckCircle2 />} tone="emerald">
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
