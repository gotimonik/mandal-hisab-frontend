"use client";

import { useEffect, useMemo, useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Banknote, CalendarCheck, CheckCircle2, ClipboardPaste, Download, HandCoins, ListChecks, Loader2, Plus, Scale, Trash2, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormError } from "@/components/app/field";
import { AmountInput, FormNote, FormSection } from "@/components/app/form-bits";
import { FormDialog, useDialogClose } from "@/components/app/form-dialog";
import { Money } from "@/components/app/money";
import { useMoney } from "@/components/app/currency";
import { apiMutate } from "@/app/actions/api";
import { monthLabelYM } from "@/lib/months";
import { cn } from "@/lib/utils";
import { TEMPLATE_CSV, cleanAmount, emptyMember, emptyUpad, lastDayOfPrevMonth, mergeRows, monthAfter, parseSheet, toPaise, type MemberDraft, type UpadDraft } from "./sheet";

export interface ImportStatus {
  canImport: boolean;
  blockers: string[];
  today: string;
  monthlyHapta: { amountPaise: number; dueDay: number; startMonth: string } | null;
  upadRate: string | null;
  cashAccount: { _id: string; name: string } | null;
  members: { _id: string; name: string; phone: string | null; membershipNumber: string; shares: number; hasLogin: boolean }[];
}

interface Issue {
  row: number;
  name?: string;
  message: string;
}
interface CheckResult {
  imported: boolean;
  cutoverDate: string;
  haptaStartMonth: string;
  totals: { members: number; newMembers: number; shares: number; savingsPaise: number; upadCount: number; upadPaise: number; interestDuePaise: number; cashPaise: number; mandalOwnPaise: number; haptaPerMonthPaise: number };
  errors: Issue[];
  warnings: Issue[];
  rows: { row: number; name: string; matched: { _id: string; name: string; membershipNumber: string } | null }[];
}

interface Draft {
  cutoverDate: string;
  cash: string;
  haptaAmount: string;
  haptaDueDay: string;
  upadRate: string;
  note: string;
  /** the unpaid upad interest is already added to members' savings on paper */
  interestInSavings?: boolean;
  members: MemberDraft[];
}

const rupees = (paise: number) => (paise % 100 === 0 ? String(paise / 100) : (paise / 100).toFixed(2));
const draftKey = (orgId: string) => `mh-opening-import:${orgId}`;

function startingDraft(s: ImportStatus): Draft {
  return {
    cutoverDate: lastDayOfPrevMonth(s.today),
    cash: "",
    haptaAmount: s.monthlyHapta ? rupees(s.monthlyHapta.amountPaise) : "",
    haptaDueDay: String(s.monthlyHapta?.dueDay ?? 10),
    upadRate: s.upadRate ?? "",
    note: "",
    members: s.members.length ? s.members.map((m) => ({ ...emptyMember(), memberId: m._id, name: m.name, phone: m.phone ?? "", shares: String(m.shares) })) : [emptyMember()],
  };
}

function loadDraft(orgId: string, s: ImportStatus): { draft: Draft; restored: boolean } {
  try {
    const raw = window.localStorage.getItem(draftKey(orgId));
    if (raw) {
      const d = JSON.parse(raw) as Draft;
      // members removed from the app since the draft was saved can't be matched any more
      const ids = new Set(s.members.map((m) => m._id));
      d.members = d.members.map((m) => (m.memberId && !ids.has(m.memberId) ? { ...m, memberId: undefined } : m));
      if (Array.isArray(d.members)) return { draft: d, restored: true };
    }
  } catch {
    /* private mode / bad data: start fresh */
  }
  return { draft: startingDraft(s), restored: false };
}

/** The request body: what the API checks and imports. */
function toBody(d: Draft, dryRun: boolean) {
  return {
    dryRun,
    cutoverDate: d.cutoverDate,
    cash: cleanAmount(d.cash) || "0",
    haptaAmount: cleanAmount(d.haptaAmount),
    haptaDueDay: Number(d.haptaDueDay) || 10,
    upadRate: d.upadRate.trim() || undefined,
    interestInSavings: !!d.interestInSavings,
    note: d.note.trim() || undefined,
    members: d.members
      .filter((m) => m.name.trim() || m.memberId)
      .map((m) => ({
        memberId: m.memberId,
        name: m.name.trim(),
        phone: m.phone.trim(),
        shares: Number(m.shares) || 1,
        savings: cleanAmount(m.savings) || "0",
        upads: m.upads
          .filter((u) => cleanAmount(u.amount))
          .map((u) => ({ amount: cleanAmount(u.amount), monthlyRate: u.monthlyRate.trim() || undefined, givenOn: u.givenOn || undefined, interestDue: cleanAmount(u.interestDue) || "0" })),
      })),
  };
}

const noSubscribe = () => () => {};

/** Renders only in the browser, so the saved draft can be read on the first render. */
export function OpeningImportForm(props: { orgId: string; status: ImportStatus }) {
  const client = useSyncExternalStore(noSubscribe, () => true, () => false);
  if (!client)
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading…
      </div>
    );
  return <Form {...props} />;
}

function Form({ orgId, status }: { orgId: string; status: ImportStatus }) {
  const router = useRouter();
  const money = useMoney();
  const [init] = useState(() => loadDraft(orgId, status));
  const [d, setD] = useState<Draft>(init.draft);
  const [restored, setRestored] = useState(init.restored);
  const [check, setCheck] = useState<{ body: string; result: CheckResult } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [pending, start] = useTransition();

  // keep a draft in this browser: 3 years of registers rarely get typed in one sitting
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        window.localStorage.setItem(draftKey(orgId), JSON.stringify(d));
      } catch {
        /* storage full / unavailable */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [d, orgId]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const setMember = (key: string, patch: Partial<MemberDraft>) => setD((x) => ({ ...x, members: x.members.map((m) => (m.key === key ? { ...m, ...patch } : m)) }));
  const setUpad = (mk: string, uk: string, patch: Partial<UpadDraft>) =>
    setD((x) => ({ ...x, members: x.members.map((m) => (m.key === mk ? { ...m, upads: m.upads.map((u) => (u.key === uk ? { ...u, ...patch } : u)) } : m)) }));

  /* --- live tally (the server checks again) */
  const t = useMemo(() => {
    const p = (v: string) => toPaise(v) ?? 0;
    const listed = d.members.filter((m) => m.name.trim() || m.memberId);
    const savings = listed.reduce((s, m) => s + p(m.savings), 0);
    const upads = listed.flatMap((m) => m.upads.filter((u) => p(u.amount) > 0));
    const upad = upads.reduce((s, u) => s + p(u.amount), 0);
    const interest = upads.reduce((s, u) => s + p(u.interestDue), 0);
    const shares = listed.reduce((s, m) => s + (Number(m.shares) || 1), 0);
    const cash = p(d.cash);
    const bad = [d.cash, d.haptaAmount, ...listed.flatMap((m) => [m.savings, ...m.upads.flatMap((u) => [u.amount, u.interestDue])])].some((v) => toPaise(v) === null);
    const own = cash + upad + (d.interestInSavings ? interest : 0) - savings;
    return { count: listed.length, shares, savings, upad, upadCount: upads.length, interest, cash, own, perMonth: shares * p(d.haptaAmount), bad, inSavings: !!d.interestInSavings };
  }, [d]);

  const body = JSON.stringify(toBody(d, true));
  const checked = check && check.body === body ? check.result : null;
  const startMonth = d.cutoverDate ? monthAfter(d.cutoverDate) : null;
  // the API numbers only the filled-in cards (blank ones aren't sent): card key → that number
  const rowNo = new Map<string, number>();
  d.members.filter((m) => m.name.trim() || m.memberId).forEach((m, i) => rowNo.set(m.key, i + 1));
  const errorsFor = (key: string) => checked?.errors.filter((e) => e.row === rowNo.get(key)) ?? [];
  const general = checked ? [...checked.errors.filter((e) => e.row === 0)] : [];

  const runCheck = () =>
    start(async () => {
      setError(null);
      if (!d.haptaAmount.trim()) return setError("Enter the monthly hapta per share");
      const r = await apiMutate<CheckResult>({ path: `/orgs/${orgId}/opening-import`, body: toBody(d, true) });
      if (!r.ok) return setError(r.error);
      setCheck({ body, result: r.data });
      setAgreed(false);
      if (r.data.errors.length) toast.error(`${r.data.errors.length} thing${r.data.errors.length === 1 ? "" : "s"} to fix`);
    });

  const runImport = () =>
    start(async () => {
      setError(null);
      const r = await apiMutate<CheckResult>({ path: `/orgs/${orgId}/opening-import`, body: toBody(d, false) });
      if (!r.ok) return setError(r.error);
      if (!r.data.imported) {
        setCheck({ body, result: r.data });
        return setError("Fix the problems below first");
      }
      try {
        window.localStorage.removeItem(draftKey(orgId));
      } catch {
        /* ignore */
      }
      toast.success("The old hisab is in. From now on, keep everything in the app.");
      router.refresh();
    });

  const startOver = () => {
    try {
      window.localStorage.removeItem(draftKey(orgId));
    } catch {
      /* ignore */
    }
    setD(startingDraft(status));
    setCheck(null);
    setRestored(false);
  };

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob([TEMPLATE_CSV], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "mandal-closing-sheet.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="flex flex-col gap-4">
      {restored && (
        <FormNote tone="good">
          Your saved draft is back — carry on where you left off.{" "}
          <button type="button" className="font-semibold underline" onClick={startOver}>
            Start again
          </button>
        </FormNote>
      )}

      <FormSection icon={<CalendarCheck />} tone="indigo" title="1. Close the paper books" description="Pick the day the registers stop. Everything up to that day comes in as one opening figure.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Closing date" htmlFor="oi-date" hint={startMonth ? `Hapta from ${monthLabelYM(startMonth)} onwards is collected in the app.` : undefined}>
            <Input id="oi-date" type="date" max={status.today} value={d.cutoverDate} onChange={(e) => set("cutoverDate", e.target.value)} />
          </Field>
          <Field label={`Cash in hand on that day${status.cashAccount ? ` (${status.cashAccount.name})` : ""}`} htmlFor="oi-cash" hint="Count money kept on UPI here too." error={toPaise(d.cash) === null ? "Enter a valid amount" : undefined}>
            <AmountInput id="oi-cash" value={d.cash} onChange={(e) => set("cash", e.target.value)} placeholder="0" />
          </Field>
        </div>
      </FormSection>

      <FormSection icon={<Banknote />} tone="emerald" title="2. Hapta and upad rate" description="Used from the month after the closing date.">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Monthly hapta per share" htmlFor="oi-hapta">
            <AmountInput id="oi-hapta" value={d.haptaAmount} onChange={(e) => set("haptaAmount", e.target.value)} placeholder="500" />
          </Field>
          <Field label="Due by day" htmlFor="oi-due">
            <Input id="oi-due" type="number" inputMode="numeric" min={1} max={28} value={d.haptaDueDay} onChange={(e) => set("haptaDueDay", e.target.value)} />
          </Field>
          <Field label="Usual upad rate (% a month)" htmlFor="oi-rate" hint="Each upad can have its own.">
            <Input id="oi-rate" inputMode="decimal" value={d.upadRate} onChange={(e) => set("upadRate", e.target.value)} placeholder="1.5" />
          </Field>
        </div>
      </FormSection>

      <FormSection icon={<Users />} tone="sky" title="3. Members on the closing date" description="Savings = all hapta + interest credited − withdrawals. Upad = what is still owed, not what was first given.">
        <div className="flex flex-wrap gap-2">
          <FormDialog trigger={<><ClipboardPaste /> Paste from Excel</>} triggerVariant="outline" triggerSize="sm" title="Paste the closing sheet" wide icon={<ClipboardPaste />} tone="sky">
            <PasteForm onRead={(rows) => {
              const r = mergeRows(d.members, rows);
              set("members", r.members);
              toast.success(`${r.added} added · ${r.updated} filled in · ${r.upads} upad${r.upads === 1 ? "" : "s"}`);
            }} />
          </FormDialog>
          <Button variant="ghost" size="sm" onClick={downloadTemplate}>
            <Download /> Sample sheet
          </Button>
        </div>

        <ol className="flex flex-col gap-3">
          {d.members.map((m, i) => {
            const errs = errorsFor(m.key);
            const match = checked?.rows.find((r) => r.row === rowNo.get(m.key))?.matched;
            return (
              <li key={m.key} className={cn("rounded-2xl bg-muted/40 p-3 ring-1 ring-foreground/[0.06]", errs.length > 0 && "bg-rose-500/5 ring-rose-500/30")}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary">{i + 1}</span>
                  <Input aria-label="Name" value={m.name} onChange={(e) => setMember(m.key, { name: e.target.value })} placeholder="Member's name" className="font-semibold" readOnly={!!m.memberId} />
                  {!m.memberId && (
                    <Button variant="ghost" size="icon-sm" aria-label={`Remove ${m.name || "member"}`} onClick={() => set("members", d.members.filter((x) => x.key !== m.key))}>
                      <Trash2 />
                    </Button>
                  )}
                </div>
                {(m.memberId || match) && <p className="mb-2 text-xs text-muted-foreground">Already in the app{match ? ` as ${match.name} (${match.membershipNumber})` : ""}</p>}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <Field label="Phone" className="col-span-2 sm:col-span-1">
                    <Input inputMode="tel" value={m.phone} onChange={(e) => setMember(m.key, { phone: e.target.value })} placeholder="Optional" />
                  </Field>
                  <Field label="Shares">
                    <Input type="number" inputMode="numeric" min={1} max={50} value={m.shares} onChange={(e) => setMember(m.key, { shares: e.target.value })} />
                  </Field>
                  <Field label="Savings" error={toPaise(m.savings) === null ? "Not a valid amount" : undefined}>
                    <AmountInput value={m.savings} onChange={(e) => setMember(m.key, { savings: e.target.value })} placeholder="0" />
                  </Field>
                </div>

                {m.upads.map((u, k) => (
                  <div key={u.key} className="mt-2 rounded-xl bg-orange-500/6 p-2.5 ring-1 ring-orange-500/15">
                    <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-orange-800 dark:text-orange-200">
                      <span className="flex items-center gap-1.5">
                        <HandCoins className="size-3.5" /> Upad {m.upads.length > 1 ? k + 1 : ""} still running
                      </span>
                      <Button variant="ghost" size="icon-xs" aria-label="Remove upad" onClick={() => setMember(m.key, { upads: m.upads.filter((x) => x.key !== u.key) })}>
                        <X />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <Field label="Still owed" error={toPaise(u.amount) === null ? "Not a valid amount" : undefined}>
                        <AmountInput value={u.amount} onChange={(e) => setUpad(m.key, u.key, { amount: e.target.value })} placeholder="0" />
                      </Field>
                      <Field label="Rate % a month">
                        <Input inputMode="decimal" value={u.monthlyRate} onChange={(e) => setUpad(m.key, u.key, { monthlyRate: e.target.value })} placeholder={d.upadRate || "1.5"} />
                      </Field>
                      <Field label="Interest unpaid" error={toPaise(u.interestDue) === null ? "Not a valid amount" : undefined}>
                        <AmountInput value={u.interestDue} onChange={(e) => setUpad(m.key, u.key, { interestDue: e.target.value })} placeholder="0" />
                      </Field>
                      <Field label="Given on">
                        <Input type="date" max={d.cutoverDate || undefined} value={u.givenOn} onChange={(e) => setUpad(m.key, u.key, { givenOn: e.target.value })} />
                      </Field>
                    </div>
                  </div>
                ))}
                <Button variant="ghost" size="xs" className="mt-2" onClick={() => setMember(m.key, { upads: [...m.upads, emptyUpad()] })}>
                  <Plus /> Running upad
                </Button>
                {errs.map((e, k) => (
                  <p key={k} className="mt-1.5 text-xs text-destructive" role="alert">
                    {e.message}
                  </p>
                ))}
              </li>
            );
          })}
        </ol>
        <Button variant="outline" onClick={() => set("members", [...d.members, emptyMember()])}>
          <Plus /> Add member
        </Button>
      </FormSection>

      {t.interest > 0 && (
        <label className="flex items-start gap-2.5 rounded-2xl bg-amber-500/8 px-3.5 py-3 text-sm ring-1 ring-amber-500/20">
          <input type="checkbox" className="mt-0.5 size-4 accent-primary" checked={!!d.interestInSavings} onChange={(e) => set("interestInSavings", e.target.checked)} />
          <span>
            <b>The unpaid interest is already added to members&apos; savings</b>
            <span className="block text-xs text-muted-foreground">Tick this if the savings above already include the {money.fmt(t.interest)} of upad interest not yet collected. When it is collected it then only adds to the cash — it isn&apos;t added to members&apos; savings a second time.</span>
          </span>
        </label>
      )}

      <Tally t={t} cashName={status.cashAccount?.name} />

      {checked && (checked.warnings.length > 0 || general.length > 0) && (
        <div className="flex flex-col gap-2">
          {general.map((e, k) => (
            <FormNote key={`e${k}`} tone="warn">
              {e.message}
            </FormNote>
          ))}
          {checked.warnings.map((w, k) => (
            <FormNote key={`w${k}`} tone="warn">
              {w.message}
            </FormNote>
          ))}
        </div>
      )}

      <Field label="Note (optional)" htmlFor="oi-note" hint="e.g. Checked and signed at the meeting on 2 November">
        <Input id="oi-note" value={d.note} maxLength={300} onChange={(e) => set("note", e.target.value)} />
      </Field>

      <FormError message={error} />

      {!checked ? (
        <Button size="lg" className="h-12 rounded-2xl text-base sm:self-start sm:px-6" disabled={pending || t.bad || t.count === 0} onClick={runCheck}>
          {pending ? <Loader2 className="animate-spin" /> : <ListChecks />} Check the figures
        </Button>
      ) : checked.errors.length > 0 ? (
        <div className="flex flex-col gap-2">
          <FormNote tone="warn">
            {checked.errors.length} thing{checked.errors.length === 1 ? "" : "s"} to fix (marked in red above), then check again.
          </FormNote>
          <Button size="lg" className="h-12 rounded-2xl text-base sm:self-start sm:px-6" disabled={pending} onClick={runCheck}>
            {pending ? <Loader2 className="animate-spin" /> : <ListChecks />} Check again
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-2xl bg-emerald-500/8 p-4 ring-1 ring-emerald-500/25">
          <p className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-200">
            <CheckCircle2 className="size-5" /> Ready: {checked.totals.members} members ({checked.totals.newMembers} new), {checked.totals.upadCount} upad{checked.totals.upadCount === 1 ? "" : "s"}
          </p>
          <ul className="list-disc pl-5 text-sm text-muted-foreground">
            <li>Each member&apos;s savings starts at the figure above, dated {checked.cutoverDate}.</li>
            <li>Upads start charging interest from {monthLabelYM(checked.haptaStartMonth)}; unpaid interest ({money.fmt(checked.totals.interestDuePaise)}) is due now.</li>
            <li>Hapta starts in {monthLabelYM(checked.haptaStartMonth)}: {money.fmt(checked.totals.haptaPerMonthPaise)} a month for {checked.totals.shares} shares.</li>
            <li>This is done once. Small mistakes later are fixed per member with an adjustment.</li>
          </ul>
          <label className="flex items-start gap-2.5 text-sm">
            <input type="checkbox" className="mt-0.5 size-4 accent-primary" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span>The members have seen and agreed these figures.</span>
          </label>
          <Button size="lg" className="h-12 rounded-2xl text-base sm:self-start sm:px-6" disabled={pending || !agreed} onClick={runImport}>
            {pending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} Bring the old hisab in
          </Button>
        </div>
      )}
    </div>
  );
}

function Tally({ t, cashName }: { t: { count: number; shares: number; savings: number; upad: number; upadCount: number; interest: number; cash: number; own: number; perMonth: number; inSavings: boolean }; cashName?: string }) {
  const short = t.own < 0;
  return (
    <section className={cn("rounded-3xl p-4 ring-1 sm:p-5", short ? "bg-rose-500/6 ring-rose-500/25" : "bg-indigo-500/6 ring-indigo-500/20")}>
      <h2 className="mb-3 flex items-center gap-2 font-bold">
        <Scale className="size-5" /> Does it tally?
      </h2>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        <dt className="text-muted-foreground">{cashName ?? "Cash"} in hand</dt>
        <dd className="text-right">
          <Money paise={t.cash} />
        </dd>
        <dt className="text-muted-foreground">+ Upad still out ({t.upadCount})</dt>
        <dd className="text-right">
          <Money paise={t.upad} />
        </dd>
        {t.inSavings && (
          <>
            <dt className="text-muted-foreground">+ Unpaid upad interest</dt>
            <dd className="text-right">
              <Money paise={t.interest} />
            </dd>
          </>
        )}
        <dt className="text-muted-foreground">− Members&apos; savings ({t.count})</dt>
        <dd className="text-right">
          <Money paise={-t.savings} />
        </dd>
        <dt className="border-t pt-1.5 font-semibold">= Mandal&apos;s own money</dt>
        <dd className={cn("border-t pt-1.5 text-right font-bold", short && "text-destructive")}>
          <Money paise={t.own} />
        </dd>
      </dl>
      {short && (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-destructive">
          <AlertTriangle className="mt-px size-3.5 shrink-0" /> Cash + upad is less than the savings. Usually a figure is missing — check the registers.
        </p>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        {t.shares} share{t.shares === 1 ? "" : "s"} · hapta <Money paise={t.perMonth} /> a month
        {!t.inSavings && (
          <>
            {" "}
            · upad interest unpaid <Money paise={t.interest} /> (shared among members when it&apos;s paid)
          </>
        )}
      </p>
    </section>
  );
}

function PasteForm({ onRead }: { onRead: (rows: ReturnType<typeof parseSheet>["rows"]) => void }) {
  const close = useDialogClose();
  const [text, setText] = useState("");
  const parsed = useMemo(() => (text.trim() ? parseSheet(text) : null), [text]);
  return (
    <div className="flex flex-col gap-3 text-sm">
      <FormNote>
        Copy the rows from Excel or Google Sheets (or open a .csv) and paste them here. Columns: <b>Name, Phone, Shares, Savings, Upad, Rate, Interest due, Upad date</b>. With a header row the order doesn&apos;t matter. Two upads? Two rows with the same name.
      </FormNote>
      <Textarea rows={8} value={text} onChange={(e) => setText(e.target.value)} placeholder={TEMPLATE_CSV} className="font-mono text-xs" />
      <label className="text-xs text-muted-foreground">
        …or choose a .csv file:{" "}
        <input
          type="file"
          accept=".csv,text/csv,.txt"
          className="text-xs"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f && f.size < 1_000_000) setText(await f.text());
          }}
        />
      </label>
      {parsed && (
        <div className={cn("rounded-xl p-2.5 text-xs ring-1", parsed.problems.length ? "bg-amber-500/8 ring-amber-500/25" : "bg-emerald-500/8 ring-emerald-500/25")}>
          <p className="font-semibold">
            {parsed.rows.length} row{parsed.rows.length === 1 ? "" : "s"} read{parsed.problems.length ? ` · ${parsed.problems.length} to look at` : ""}
          </p>
          <ul className="mt-1 max-h-32 overflow-y-auto">
            {parsed.problems.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      )}
      <Button
        size="lg"
        disabled={!parsed || parsed.rows.length === 0}
        onClick={() => {
          onRead(parsed!.rows);
          close();
        }}
      >
        <ClipboardPaste /> Put {parsed?.rows.length ?? 0} rows in the list
      </Button>
    </div>
  );
}
