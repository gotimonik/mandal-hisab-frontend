"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode, type RefObject } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine, Building2, CalendarClock, Camera, CheckCircle2, ExternalLink, FileText, Loader2, Paperclip, Settings2, Star, Trash2, X } from "lucide-react";
import { useSetDefault } from "./manage-dialogs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/app/field";
import { NativeSelect } from "@/components/app/native-select";
import { AmountInput, SubmitButton } from "@/components/app/form-bits";
import { IconChip } from "@/components/app/bits";
import { Money } from "@/components/app/money";
import { dropQueryParam } from "@/components/app/form-dialog";
import { apiMutate } from "@/lib/api-client";
import { apiRead, scanPersonalBill } from "@/app/actions/api";
import { track } from "@/lib/analytics";
import { prepareBill } from "./bill-image";
import { SwipeRow } from "@/components/app/swipe-row";
import { canReadOnDevice, readBillOnDevice, type OcrStage } from "./bill-ocr";
import { parseBillText } from "./bill-text";
import { formatDate, newIdempotencyKey, paiseToRupeeInput, todayISO } from "@/lib/format";
import { rupees } from "@/lib/schemas";
import { TONE_CHIP, TONE_TEXT, type Tone } from "@/lib/tones";
import { cn } from "@/lib/utils";
import { useLang, useT } from "@/i18n/client";
import { monthName } from "@/i18n/core";
import { BILL_MAX_BYTES, categoryName, mandalLabel, walletName, type BillScan, type BillUsage, type EntryType, type ManualType, type PBill, type PCategory, type PEntry, type PWallet } from "./types";
import { CategoryIcon } from "./icons";

export const TYPE_LOOK: Record<EntryType, { tone: Tone; icon: ReactNode }> = {
  expense: { tone: "rose", icon: <ArrowUpFromLine /> },
  income: { tone: "emerald", icon: <ArrowDownToLine /> },
  transfer: { tone: "sky", icon: <ArrowLeftRight /> },
  in: { tone: "violet", icon: <Building2 /> },
  out: { tone: "violet", icon: <Building2 /> },
};

export interface Book {
  wallets: PWallet[];
  categories: PCategory[];
}

/** The wallet last used for spending (or for income), remembered on this device only. */
const lastKey = (type: EntryType) => `mh:ph:lastWallet:${type}`;
const readLast = (type: EntryType) => {
  try {
    return window.localStorage.getItem(lastKey(type));
  } catch {
    return null;
  }
};
const saveLast = (type: EntryType, id: string) => {
  try {
    window.localStorage.setItem(lastKey(type), id);
  } catch {
    /* private mode — fine */
  }
};

/** Add / edit one entry. `entry` = edit, otherwise a new entry of `type`. */
/** Pre-filled choices, e.g. "add spending" from a category's own page. */
export interface EntryDefaults {
  categoryId?: string;
  walletId?: string;
}

function EntryForm({ book, type: startType, entry, defaults, initialBill, onDone }: { book: Book; type: ManualType; entry?: PEntry; defaults?: EntryDefaults; initialBill?: File; onDone: () => void }) {
  const t = useT();
  const lang = useLang();
  const router = useRouter();
  const { wallets: allWallets, categories: allCategories } = book;
  // hidden wallets / categories can only stay on an entry that already uses them
  const wallets = allWallets.filter((w) => !w.isArchived || w._id === entry?.wallet?._id || w._id === entry?.toWallet?._id);
  const defaultWallet = allWallets.find((w) => w.isDefault && !w.isArchived)?._id;
  const defaultCategory = (k: ManualType) => (k === "transfer" ? undefined : allCategories.find((c) => c.isDefault && !c.isArchived && c.kind === k)?._id);
  // the default wallet, else the one last used on this device, else the first
  const firstWallet = () => {
    if (defaultWallet) return defaultWallet;
    const last = typeof window === "undefined" ? null : readLast(startType);
    return wallets.find((w) => w._id === last && !w.isArchived)?._id ?? wallets.find((w) => !w.isArchived)?._id ?? "";
  };
  const { set: setDefault, pending: settingDefault } = useSetDefault();
  const [type, setType] = useState<ManualType>((entry?.type as ManualType | undefined) ?? startType);
  const [amount, setAmount] = useState(entry ? paiseToRupeeInput(entry.amountPaise) : "");
  const [date, setDate] = useState(entry?.date ?? todayISO());
  const [categoryId, setCategoryId] = useState(entry?.category?._id ?? defaults?.categoryId ?? (entry ? "" : (defaultCategory(startType) ?? "")));
  const [walletId, setWalletId] = useState(entry?.wallet?._id ?? (defaults?.walletId && wallets.some((w) => w._id === defaults.walletId && !w.isArchived) ? defaults.walletId : firstWallet()));
  const [toWalletId, setToWalletId] = useState(entry?.toWallet?._id ?? wallets.find((w) => !w.isArchived && w._id !== (entry?.wallet?._id ?? firstWallet()))?._id ?? "");
  const [note, setNote] = useState(entry?.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [key] = useState(() => newIdempotencyKey("pe"));
  const [pending, start] = useTransition();
  const [bill, setBill] = useState<PBill | null>(entry?.bill ?? null);
  const billSaved = useRef(false);
  // while a bill is uploading / being read, the form waits (its fields are about to be filled in)
  const [billBusy, setBillBusy] = useState(false);

  /** Fill the form from what was read off a bill (new entries only — an existing one keeps its details). */
  const applyScan = (s: BillScan) => {
    const r = s.reading;
    if (!r) {
      if (s.readError === "unavailable") toast.warning(t("ph.bill.unavailable"));
      else if (s.readError === "too_big") toast.message(t("ph.bill.tooBigToRead"));
      else if (s.readError === "pdf") toast.message(t("ph.bill.pdfAttached"));
      else if (s.readError === "local_failed") toast.warning(t("ph.bill.couldntRead"));
      else toast.success(t("ph.bill.attached"));
      return;
    }
    if (!r.isBill) return void toast.warning(t("ph.bill.notBill"));
    if (entry) return void toast.success(t("ph.bill.attached"));
    const k: ManualType = r.type;
    if (k !== type) setType(k);
    const kindCats = allCategories.filter((c) => c.kind === k && !c.isArchived);
    setCategoryId(r.categoryId && kindCats.some((c) => c._id === r.categoryId) ? r.categoryId : k !== type ? (defaultCategory(k) ?? "") : categoryId);
    if (r.amount) setAmount(r.amount);
    if (r.date) setDate(r.date);
    if (r.walletKind) {
      const live = wallets.filter((w) => !w.isArchived);
      // a screenshot from PhonePe → the PhonePe wallet, then any UPI wallet; UPI money usually
      // sits in a bank account, so a bank wallet after that
      const match =
        (r.walletKind === "upi" && r.upiApp ? live.find((w) => w.kind === "upi" && w.upiApp === r.upiApp) : undefined) ??
        live.find((w) => w.kind === r.walletKind) ??
        (r.walletKind === "upi" ? live.find((w) => w.kind === "bank") : undefined);
      if (match) setWalletId(match._id);
    }
    if (r.merchant && !note.trim()) setNote(r.merchant);
    setError(null);
    setAmountError(null);
    if (r.amount) toast.success(t("ph.bill.filled"));
    else toast.warning(t("ph.bill.noTotal"));
  };

  const cats = allCategories.filter((c) => c.kind === (type === "income" ? "income" : "expense") && (!c.isArchived || c._id === entry?.category?._id));
  const selectedCat = cats.find((c) => c._id === categoryId && !c.isArchived);
  const selectedWallet = wallets.find((w) => w._id === walletId);

  const save = () => {
    if (billBusy) return;
    const a = rupees.safeParse(amount);
    setAmountError(a.success ? null : a.error.issues[0].message);
    if (!a.success) return;
    if (type !== "transfer" && !cats.some((c) => c._id === categoryId)) return setError(t("ph.entry.vCategory"));
    if (type === "transfer" && (!toWalletId || toWalletId === walletId)) return setError(t("ph.entry.vWallets"));
    start(async () => {
      setError(null);
      const body = {
        type,
        amount: a.data,
        date,
        walletId,
        toWalletId: type === "transfer" ? toWalletId : null,
        categoryId: type === "transfer" ? null : categoryId,
        note: note.trim() || undefined,
        billId: bill?._id ?? (entry ? null : undefined),
      };
      const res = entry
        ? await apiMutate({ path: `/me/personal/entries/${entry._id}`, method: "PATCH", body })
        : await apiMutate({ path: "/me/personal/entries", body: { ...body, idempotencyKey: key } });
      if (!res.ok) return setError(res.error);
      billSaved.current = true;
      if (type !== "transfer") saveLast(type, walletId);
      toast.success(entry ? t("ph.entry.updated") : t("ph.entry.saved"));
      onDone();
      router.refresh();
    });
  };

  const remove = () =>
    start(async () => {
      const res = await apiMutate({ path: `/me/personal/entries/${entry!._id}`, method: "DELETE" });
      if (!res.ok) return setError(res.error);
      toast.success(t("ph.entry.deleted"));
      onDone();
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
      {/* existing entry: Delete right at the top, not below the fold */}
      {entry &&
        (confirmDelete ? (
          <div className="flex flex-col gap-2 rounded-2xl bg-destructive/5 p-3 ring-1 ring-destructive/20" role="alert">
            <p className="text-sm font-semibold">{t("ph.entry.deleteTitle")}</p>
            <p className="text-xs text-muted-foreground">{t("ph.entry.deleteDesc")}</p>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" className="flex-1" onClick={() => setConfirmDelete(false)} disabled={pending}>
                {t("common.cancel")}
              </Button>
              <Button type="button" variant="destructive" size="sm" className="flex-1" onClick={remove} disabled={pending || billBusy}>
                {pending ? <Loader2 className="animate-spin" /> : <Trash2 />} {t("ph.entry.delete")}
              </Button>
            </div>
          </div>
        ) : (
          <Button type="button" variant="outline" size="sm" className="-mt-1 justify-self-end text-destructive" onClick={() => setConfirmDelete(true)} disabled={billBusy}>
            <Trash2 /> {t("ph.entry.delete")}
          </Button>
        ))}
      <BillBox bill={bill} originalBillId={entry?.bill?._id ?? null} initialFile={initialBill} categories={allCategories} onChange={setBill} onScanned={applyScan} savedRef={billSaved} onBusy={setBillBusy} />
      <fieldset disabled={billBusy} aria-busy={billBusy} className={cn("grid min-w-0 grid-cols-1 gap-3 transition-opacity", billBusy && "pointer-events-none opacity-50 select-none")}>
        {/* spent / received / moved */}
        <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-muted p-1" role="radiogroup" aria-label={t("ph.list.type")}>
          {(["expense", "income", "transfer"] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={type === k}
              onClick={() => {
                setType(k);
                setCategoryId(defaultCategory(k) ?? "");
                setError(null);
              }}
              className={cn("flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-sm font-semibold transition-colors [&_svg]:size-4", type === k ? cn("bg-card shadow-sm", k === "expense" ? "text-rose-600 dark:text-rose-400" : k === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-sky-600 dark:text-sky-400") : "text-muted-foreground hover:text-foreground")}
            >
              {TYPE_LOOK[k].icon}
              {t(`ph.entry.type.${k}`)}
            </button>
          ))}
        </div>

        <Field label={t("ph.entry.amount")} htmlFor="pe-amt" error={amountError ?? undefined}>
          <AmountInput id="pe-amt" autoFocus={!entry && !initialBill} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
        </Field>

        {type !== "transfer" && (
          <fieldset className="flex min-w-0 flex-col gap-1.5">
            <legend className="mb-1.5 text-sm font-medium">{t("ph.entry.category")}</legend>
            <div className="flex flex-wrap gap-1.5">
              {cats.map((c) => (
                <button
                  key={c._id}
                  type="button"
                  aria-pressed={categoryId === c._id}
                  onClick={() => {
                    setCategoryId(c._id);
                    setError(null);
                  }}
                  className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition-colors", categoryId === c._id ? cn(TONE_CHIP[c.tone], "ring-2 ring-current") : "bg-card ring-foreground/10 hover:bg-muted")}
                >
                  <CategoryIcon category={c} className={cn("size-3.5", categoryId === c._id ? "" : TONE_TEXT[c.tone])} aria-hidden />
                  {categoryName(t, c)}
                </button>
              ))}
              <Link href="/personal/categories" className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground ring-1 ring-dashed ring-foreground/15 hover:bg-muted">
                <Settings2 className="size-3" /> {t("ph.entry.moreCategories")}
              </Link>
            </div>
            {selectedCat && (
              <DefaultLine
                isDefault={!!selectedCat.isDefault}
                pending={settingDefault}
                label={selectedCat.isDefault ? t(type === "income" ? "ph.def.catIsDefaultIn" : "ph.def.catIsDefault", { name: categoryName(t, selectedCat) }) : t(type === "income" ? "ph.def.makeCatIn" : "ph.def.makeCat", { name: categoryName(t, selectedCat) })}
                onClick={() => setDefault(type === "income" ? "defaultIncomeCategoryId" : "defaultExpenseCategoryId", selectedCat.isDefault ? null : selectedCat._id)}
              />
            )}
          </fieldset>
        )}

        {type === "transfer" ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("ph.entry.from")} htmlFor="pe-from">
              <NativeSelect id="pe-from" value={walletId} onChange={(e) => setWalletId(e.target.value)}>
                {wallets.map((w) => (
                  <option key={w._id} value={w._id}>
                    {walletName(t, w)}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label={t("ph.entry.to")} htmlFor="pe-to">
              <NativeSelect id="pe-to" value={toWalletId} onChange={(e) => setToWalletId(e.target.value)}>
                {wallets.map((w) => (
                  <option key={w._id} value={w._id}>
                    {walletName(t, w)}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>
        ) : (
          wallets.length > 1 && (
            <div className="flex flex-col gap-1">
              <Field label={type === "income" ? t("ph.entry.receivedIn") : t("ph.entry.paidFrom")} htmlFor="pe-wallet">
                <NativeSelect id="pe-wallet" value={walletId} onChange={(e) => setWalletId(e.target.value)}>
                  {wallets.map((w) => (
                    <option key={w._id} value={w._id}>
                      {walletName(t, w)}
                      {w.isDefault ? ` ★` : ""}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              {selectedWallet && !selectedWallet.isArchived && (
                <DefaultLine
                  isDefault={!!selectedWallet.isDefault}
                  pending={settingDefault}
                  label={selectedWallet.isDefault ? t("ph.def.walletIsDefault", { name: walletName(t, selectedWallet) }) : t("ph.def.makeWallet", { name: walletName(t, selectedWallet) })}
                  onClick={() => setDefault("defaultWalletId", selectedWallet.isDefault ? null : selectedWallet._id)}
                />
              )}
            </div>
          )
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[10rem_1fr]">
          <Field label={t("common.date")} htmlFor="pe-date">
            <Input id="pe-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label={t("ph.entry.note")} htmlFor="pe-note">
            <Input id="pe-note" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t(type === "expense" ? "ph.entry.notePhExpense" : type === "income" ? "ph.entry.notePhIncome" : "ph.entry.notePhTransfer")} />
          </Field>
        </div>

        {/* spending / income dated in another month doesn't show in this month's totals — say so */}
        {type !== "transfer" && (!entry || date !== entry.date) && /^\d{4}-\d{2}-\d{2}$/.test(date) && date.slice(0, 7) !== todayISO().slice(0, 7) && (
          <p className="flex items-start gap-2 rounded-2xl bg-amber-500/10 p-3 text-xs text-amber-900 ring-1 ring-amber-500/25 dark:text-amber-200">
            <CalendarClock className="mt-0.5 size-4 shrink-0" />
            <span>{t(type === "income" ? "ph.entry.otherMonthIncome" : "ph.entry.otherMonthExpense", { date: formatDate(date), month: monthName(lang, date.slice(0, 7)) })}</span>
          </p>
        )}

        <SubmitButton pending={pending} icon={<CheckCircle2 />}>
          {t("ph.entry.save")}
        </SubmitButton>

      </fieldset>
    </form>
  );
}

const kb = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/**
 * The bill on this entry: "Scan a bill" (photo, screenshot or PDF, up to 5 MB, a few a month),
 * or the attached bill with View / Remove. A bill scanned here but never saved is removed when
 * the form closes (and by the daily job, if the phone went away first).
 */
function BillBox({ bill, originalBillId, initialFile, categories, onChange, onScanned, savedRef, onBusy }: { bill: PBill | null; originalBillId: string | null; initialFile?: File; categories: PCategory[]; onChange: (b: PBill | null) => void; onScanned: (s: BillScan) => void; savedRef: RefObject<boolean>; onBusy?: (busy: boolean) => void }) {
  const t = useT();
  const lang = useLang();
  const [usage, setUsage] = useState<BillUsage | null>(null);
  const [busy, setBusy] = useState(false);
  // on-phone reading: getting the reader ready (first time downloads it) → reading, with progress
  const [stage, setStage] = useState<{ s: OcrStage; p: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  // bills scanned in this form and not (yet) saved with the entry
  const fresh = useRef<Set<string>>(new Set());
  const started = useRef(false);

  const discard = (id: string) => {
    fresh.current.delete(id);
    void apiMutate({ path: `/me/personal/bills/${id}`, method: "DELETE" });
  };

  useEffect(() => {
    void apiRead<BillUsage>("/me/personal/bills/usage").then((r) => r.ok && setUsage(r.data));
    const pending = fresh.current;
    return () => {
      // closed without saving: don't leave the scanned bill behind (the value at close time is the one we want)
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (!savedRef.current) for (const id of pending) void apiMutate({ path: `/me/personal/bills/${id}`, method: "DELETE" });
    };
  }, [savedRef]);

  const scan = async (file: File) => {
    setError(null);
    setBusy(true);
    onBusy?.(true);
    try {
      const prepared = await prepareBill(file);
      if (prepared.size > BILL_MAX_BYTES) return setError(t("ph.bill.tooBig"));
      const fd = new FormData();
      fd.set("file", prepared);
      // read it right here on the phone (free, private) while it uploads — unless the server reads bills
      const local = usage?.reads !== true && canReadOnDevice(prepared) ? readBillOnDevice(prepared, lang, (s, p) => setStage({ s, p })) : null;
      const res = await scanPersonalBill(fd);
      if (!res.ok) return setError(res.code === "BILL_LIMIT" ? t("ph.bill.limitReached", { n: usage?.limit ?? 10 }) : res.code === "BILL_TOO_BIG" ? t("ph.bill.tooBig") : res.error);
      let result: BillScan = res.data;
      if (!result.reading && result.readError !== "unavailable") {
        const text = local ? await local : null;
        if (text && text.trim().length >= 4) {
          // whatever the phone found is a suggestion to check, so never "not a bill" here
          result = { ...result, reading: { ...parseBillText(text, { today: todayISO(), categories }), isBill: true }, readError: null };
        } else {
          result = { ...result, readError: prepared.type === "application/pdf" ? "pdf" : "local_failed" };
        }
      }
      if (bill && bill._id !== originalBillId) discard(bill._id);
      fresh.current.add(result.bill._id);
      onChange(result.bill);
      setUsage(result.usage);
      track("personal_bill_scanned", { result: result.reading ? (result.reading.isBill ? (result.reading.amount ? "read" : "no_total") : "not_bill") : (result.readError ?? "none"), where: local ? "phone" : "server" });
      onScanned(result);
    } finally {
      setBusy(false);
      onBusy?.(false);
      setStage(null);
    }
  };

  useEffect(() => {
    if (initialFile && !started.current) {
      started.current = true;
      // a file chosen before the form opened (from the "Scan a bill" button in the add sheet)
      void scan(initialFile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFile]);

  const remove = () => {
    if (bill && bill._id !== originalBillId) discard(bill._id);
    onChange(null);
  };

  const none = usage !== null && usage.left <= 0;
  return (
    <div className="flex flex-col gap-1.5">
      {bill ? (
        <div className="flex items-center gap-3 rounded-2xl bg-muted/60 p-2.5 ring-1 ring-foreground/[0.06]">
          <IconChip tone="sky" size="sm">
            {bill.contentType === "application/pdf" ? <FileText /> : <Paperclip />}
          </IconChip>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{t("ph.bill.attachedTitle")}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {bill.name} · {kb(bill.size)}
            </span>
          </span>
          {busy ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : (
            <>
              <a href={`/api/personal-bill/${bill._id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10">
                <ExternalLink className="size-3.5" /> {t("ph.bill.view")}
              </a>
              <Button type="button" variant="ghost" size="icon-sm" className="rounded-full" aria-label={t("ph.bill.remove")} onClick={remove}>
                <X />
              </Button>
            </>
          )}
        </div>
      ) : (
        <label
          className={cn(
            "flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-foreground/20 p-2.5 transition-colors hover:bg-muted/50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
            (busy || none) && "pointer-events-none opacity-70",
          )}
        >
          <input
            ref={input}
            type="file"
            accept="image/*,application/pdf"
            className="sr-only"
            disabled={busy || none}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void scan(f);
            }}
          />
          <IconChip tone="amber" size="sm">
            {busy ? <Loader2 className="animate-spin" /> : <Camera />}
          </IconChip>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">
              {!busy ? t("ph.bill.scan") : stage?.s === "loading" ? t("ph.bill.preparing") : stage?.s === "reading" ? t("ph.bill.readingPct", { pct: Math.round(stage.p * 100) }) : t("ph.bill.reading")}
            </span>
            <span className="block text-xs text-muted-foreground">
              {none ? t("ph.bill.noneLeft", { n: usage.limit }) : usage ? t("ph.bill.hintLeft", { left: usage.left, n: usage.limit }) : t("ph.bill.hint")}
            </span>
          </span>
        </label>
      )}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** "☆ Always start with Food" / "★ Food is your default — remove" under a picker. */
function DefaultLine({ isDefault, label, pending, onClick }: { isDefault: boolean; label: string; pending: boolean; onClick: () => void }) {
  return (
    <button type="button" disabled={pending} onClick={onClick} className={cn("inline-flex w-fit items-center gap-1 rounded-full px-1 py-0.5 text-xs font-medium transition-colors disabled:opacity-60", isDefault ? "text-amber-700 hover:text-amber-800 dark:text-amber-300" : "text-muted-foreground hover:text-foreground")}>
      {pending ? <Loader2 className="size-3 animate-spin" /> : <Star className={cn("size-3", isDefault && "fill-current")} />} {label}
    </button>
  );
}

/** An entry copied from a Mandal: what it was (read-only), and the wallet / note the person may change. */
function MandalEntryForm({ book, entry, onDone }: { book: Book; entry: PEntry; onDone: () => void }) {
  const t = useT();
  const router = useRouter();
  const wallets = book.wallets.filter((w) => !w.isArchived || w._id === entry.wallet?._id);
  const [walletId, setWalletId] = useState(entry.wallet?._id ?? wallets[0]?._id ?? "");
  const [note, setNote] = useState(entry.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const m = entry.mandal!;
  return (
    <form
      noValidate
      className="grid grid-cols-1 gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          setError(null);
          const res = await apiMutate({ path: `/me/personal/entries/${entry._id}`, method: "PATCH", body: { walletId, note: note.trim() || undefined } });
          if (!res.ok) return setError(res.error);
          toast.success(t("ph.entry.updated"));
          onDone();
          router.refresh();
        });
      }}
    >
      <FormError message={error} />
      <div className="rounded-2xl bg-violet-500/8 p-3.5 ring-1 ring-violet-500/20">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold">{mandalLabel(t, m)}</p>
            <p className="text-xs text-muted-foreground">
              {m.name ?? t("ph.mandal.aMandal")} · {formatDate(entry.date)}
            </p>
          </div>
          <EntryAmount entry={entry} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{entry.type === "in" ? t("ph.mandal.inNote") : entry.type === "out" ? t("ph.mandal.outNote") : t("ph.mandal.spendNote")}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t("ph.mandal.lockedNote")}</p>
      </div>
      {wallets.length > 1 && (
        <Field label={entry.type === "in" ? t("ph.entry.receivedIn") : t("ph.entry.paidFrom")} htmlFor="pm-wallet">
          <NativeSelect id="pm-wallet" value={walletId} onChange={(e) => setWalletId(e.target.value)}>
            {wallets.map((w) => (
              <option key={w._id} value={w._id}>
                {walletName(t, w)}
              </option>
            ))}
          </NativeSelect>
        </Field>
      )}
      <Field label={t("ph.entry.note")} htmlFor="pm-note">
        <Input id="pm-note" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <SubmitButton pending={pending} icon={<CheckCircle2 />}>
        {t("ph.entry.save")}
      </SubmitButton>
    </form>
  );
}

function EntryDialogShell({ open, onOpenChange, title, description, tone, icon, children }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string; tone: Tone; icon: ReactNode; children: ReactNode }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="flex-row items-start gap-3">
          <IconChip tone={tone} className="mt-0.5">
            {icon}
          </IconChip>
          <div className="flex min-w-0 flex-col gap-1">
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </div>
        </DialogHeader>
        {open && children}
      </DialogContent>
    </Dialog>
  );
}

const NEW_TITLE = { expense: "ph.entry.newExpense", income: "ph.entry.newIncome", transfer: "ph.entry.newTransfer" } as const;
const NEW_DESC = { expense: "ph.entry.newExpenseDesc", income: "ph.entry.newIncomeDesc", transfer: "ph.entry.newTransferDesc" } as const;
const HINT = { expense: "ph.add.expenseHint", income: "ph.add.incomeHint", transfer: "ph.add.transferHint" } as const;

/** "Add an entry" dialog, opened by whoever holds `type` (tiles, the phone bottom bar, a category page …). */
export function NewEntryDialog({ book, type, onClose, defaults, initialBill }: { book: Book; type: ManualType | null; onClose: () => void; defaults?: EntryDefaults; initialBill?: File }) {
  const t = useT();
  return (
    <EntryDialogShell open={type !== null} onOpenChange={(o) => !o && onClose()} title={type ? t(NEW_TITLE[type]) : ""} description={type ? t(NEW_DESC[type]) : undefined} tone={type ? TYPE_LOOK[type].tone : "slate"} icon={type ? TYPE_LOOK[type].icon : null}>
      {type && <EntryForm key={type} book={book} type={type} defaults={defaults} initialBill={initialBill} onDone={onClose} />}
    </EntryDialogShell>
  );
}

/** The three big "Spent / Received / Move money" buttons. `?add=expense` opens one straight away. */
export function AddEntryTiles({ book, openType, compact = false, only, defaults, className }: { book: Book; openType?: string; compact?: boolean; only?: ManualType[]; defaults?: EntryDefaults; className?: string }) {
  const t = useT();
  const initial = openType === "expense" || openType === "income" || openType === "transfer" ? openType : null;
  const [open, setOpen] = useState<ManualType | null>(initial);
  const types = only ?? (["expense", "income", "transfer"] as const);
  const close = () => {
    setOpen(null);
    if (initial) dropQueryParam("add");
  };
  return (
    <>
      <div className={cn("grid gap-2", types.length === 3 ? "grid-cols-3" : types.length === 2 ? "grid-cols-2" : "grid-cols-1", !compact && "mb-5", className)}>
        {types.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setOpen(k)}
            className={cn("flex flex-col items-center gap-1.5 rounded-2xl bg-card text-center shadow-card ring-1 ring-foreground/[0.06] transition-[background-color,transform] hover:bg-muted/60 active:scale-[0.98]", compact ? "p-2.5" : "p-3 sm:flex-row sm:text-left")}
          >
            <IconChip tone={TYPE_LOOK[k].tone} size={compact ? "sm" : "md"}>
              {TYPE_LOOK[k].icon}
            </IconChip>
            <span className="min-w-0">
              <span className="block text-sm font-bold">{t(`ph.add.${k}`)}</span>
              {!compact && <span className="hidden text-xs text-muted-foreground sm:block">{t(HINT[k])}</span>}
            </span>
          </button>
        ))}
      </div>
      <NewEntryDialog book={book} type={open} onClose={close} defaults={defaults} />
    </>
  );
}

/**
 * Deleting from a list: the row disappears at once and an Undo toast shows; the entry (and its
 * bill) is only deleted on the server when the toast runs out — or straight away if the app is
 * put in the background meanwhile, so nothing is left half-done.
 */
const UNDO_MS = 5000;
const pendingDeletes = new Map<string, () => void>();
let flushHooked = false;
function hookFlush() {
  if (flushHooked || typeof document === "undefined") return;
  flushHooked = true;
  const flush = () => {
    for (const run of [...pendingDeletes.values()]) run();
  };
  document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && flush());
  window.addEventListener("pagehide", flush);
}

function useDeleteWithUndo(entry: PEntry) {
  const t = useT();
  const router = useRouter();
  const [hidden, setHidden] = useState(false);
  const del = () => {
    hookFlush();
    setHidden(true);
    let done = false;
    const run = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      pendingDeletes.delete(entry._id);
      void apiMutate({ path: `/me/personal/entries/${entry._id}`, method: "DELETE" }).then((res) => {
        if (!res.ok) {
          setHidden(false);
          toast.error(res.error);
        }
        router.refresh();
      });
    };
    const timer = setTimeout(run, UNDO_MS);
    pendingDeletes.set(entry._id, run);
    toast(t("ph.entry.deleted"), {
      duration: UNDO_MS,
      action: {
        label: t("ph.entry.undo"),
        onClick: () => {
          if (done) return;
          done = true;
          clearTimeout(timer);
          pendingDeletes.delete(entry._id);
          setHidden(false);
        },
      },
    });
  };
  return { hidden, del };
}

/** One entry in a list; tapping it opens the edit form, swiping it left (or the hover trash) deletes it. */
export function EntryRow({ entry, book, showDate = false }: { entry: PEntry; book: Book; showDate?: boolean }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const { hidden, del } = useDeleteWithUndo(entry);
  const look = TYPE_LOOK[entry.type];
  const title = entry.mandal ? mandalLabel(t, entry.mandal) : entry.type === "transfer" ? t("ph.entry.transferLine", { from: walletName(t, entry.wallet), to: walletName(t, entry.toWallet) }) : categoryName(t, entry.category);
  const sub = [showDate ? formatDate(entry.date) : null, entry.mandal ? (entry.mandal.name ?? t("ph.mandal.aMandal")) : null, entry.note, entry.type !== "transfer" && book.wallets.filter((w) => !w.isArchived).length > 1 ? walletName(t, entry.wallet) : null].filter(Boolean).join(" · ");
  if (hidden) return null;
  return (
    <>
      {/* entries copied from a Mandal can't be deleted here (they follow the Mandal) */}
      <SwipeRow onDelete={del} label={t("ph.entry.delete")} disabled={!!entry.mandal}>
        <button type="button" onClick={() => setOpen(true)} className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-muted/60 active:bg-muted">
          <IconChip tone={entry.type === "transfer" ? look.tone : (entry.category?.tone ?? look.tone)} size="sm">
            {entry.type === "transfer" || entry.type === "in" || entry.type === "out" || (entry.mandal && !entry.category) ? look.icon : <CategoryIcon category={entry.category} />}
          </IconChip>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1 truncate text-sm font-semibold">
              <span className="truncate">{title}</span>
              {entry.bill && <Paperclip className="size-3.5 shrink-0 text-muted-foreground" aria-label={t("ph.bill.hasBill")} />}
            </span>
            {sub && <span className="block truncate text-xs text-muted-foreground">{sub}</span>}
          </span>
          <EntryAmount entry={entry} />
        </button>
      </SwipeRow>
      <EntryDialogShell open={open} onOpenChange={setOpen} title={entry.mandal ? t("ph.mandal.entryTitle") : t("ph.entry.edit")} description={entry.mandal ? t("ph.mandal.entryDesc") : t("ph.entry.editDesc")} tone={entry.mandal ? "violet" : look.tone} icon={entry.mandal ? <Building2 /> : look.icon}>
        {entry.mandal ? <MandalEntryForm book={book} entry={entry} onDone={() => setOpen(false)} /> : <EntryForm book={book} type={entry.type as ManualType} entry={entry} onDone={() => setOpen(false)} />}
      </EntryDialogShell>
    </>
  );
}

function EntryAmount({ entry }: { entry: PEntry }) {
  const sign = entry.type === "income" || entry.type === "in" ? "+ " : entry.type === "expense" || entry.type === "out" ? "− " : "";
  return (
    <span className={cn("shrink-0 text-sm font-bold tabular-nums", entry.type === "income" && "text-success", entry.type === "expense" && "text-foreground", (entry.type === "transfer" || entry.type === "in" || entry.type === "out") && "text-muted-foreground")}>
      {sign}
      <Money paise={entry.amountPaise} />
    </span>
  );
}
