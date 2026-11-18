"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, DatabaseBackup, Loader2, RefreshCw, RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/app/field";
import { ChoicePills, FormNote } from "@/components/app/form-bits";
import { FormDialog } from "@/components/app/form-dialog";
import { ExportCsvButton } from "@/components/app/export-csv-button";
import { apiMutate, apiRead } from "@/app/actions/api";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ResetStatus {
  canReset: boolean;
  blockers: string[];
  backup: { lastBackupAt: string | null; fresh: boolean };
  counts: { transactions: number; payments: number; upads: number; interestRuns: number; withdrawals: number; otherMembers: number; otherLogins: number };
  hasMoney: boolean;
  imported: boolean;
}

function ResetForm({ orgId, orgName }: { orgId: string; orgName: string }) {
  const router = useRouter();
  const [st, setSt] = useState<ResetStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [reason, setReason] = useState("");
  const [removeMembers, setRemoveMembers] = useState(false);
  const [loading, load] = useTransition();
  const [pending, start] = useTransition();

  const refresh = () =>
    load(async () => {
      const r = await apiRead<ResetStatus>(`/orgs/${orgId}/money-reset`);
      if (r.ok) setSt(r.data);
      else setError(r.error);
    });
  // read once when the dialog opens
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(refresh, []);

  if (!st)
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> {error ?? "Loading…"}
      </div>
    );

  const typedOk = name.trim().toLowerCase().replace(/\s+/g, " ") === orgName.trim().toLowerCase().replace(/\s+/g, " ");
  const others = st.blockers.filter((b) => !/backup/i.test(b));
  const c = st.counts;
  const nothing = !st.hasMoney && (!removeMembers || c.otherMembers + c.otherLogins === 0);

  return (
    <div className="flex flex-col gap-3 text-sm">
      <ChoicePills
        label="What to reset"
        value={removeMembers ? "all" : "money"}
        onChange={(v) => setRemoveMembers(v === "all")}
        options={[
          { value: "money", label: "Money only" },
          { value: "all", label: "Money and members" },
        ]}
      />
      <FormNote tone="warn">
        <b>Everything with money is deleted:</b> hapta payments and receipts, interest, upad and its interest, withdrawals, cash book, expenses and donations. Hapta months go back to unpaid and every balance becomes ₹0.{" "}
        {removeMembers ? (
          <>
            <b>Members go too:</b> all {c.otherMembers} other member{c.otherMembers === 1 ? "" : "s"} are deleted and {c.otherLogins} login{c.otherLogins === 1 ? " is" : "s are"} unlinked from the Mandal (their accounts stay — they can join again with the code or an invitation). Pending invitations are cancelled. <b>Only you stay</b>, as admin with your own member record. Kept: settings and meetings.
          </>
        ) : (
          <>
            <b>Kept:</b> members and their shares, logins, settings and meetings. Members get a notification.
          </>
        )}
      </FormNote>

      <ul className="grid grid-cols-2 gap-1.5 text-xs sm:grid-cols-4">
        {[
          ["Money entries", c.transactions],
          ["Payments", c.payments],
          ["Upads", c.upads],
          removeMembers ? ["Other members", c.otherMembers] : ["Interest runs", c.interestRuns],
        ].map(([l, n]) => (
          <li key={l} className="rounded-lg bg-muted/60 px-2 py-1.5">
            <span className="block text-muted-foreground">{l}</span>
            <b className="text-base">{n}</b>
          </li>
        ))}
      </ul>

      {nothing && <FormNote tone="warn">There is nothing to reset{removeMembers ? "" : " — no money has been recorded yet"}.</FormNote>}
      {others.map((b) => (
        <FormNote key={b} tone="warn">
          {b}
        </FormNote>
      ))}

      <div className={cn("flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2.5", st.backup.fresh ? "bg-emerald-500/8" : "bg-amber-500/10 ring-1 ring-amber-500/25")}>
        <p className="flex items-center gap-2">
          {st.backup.fresh ? <CheckCircle2 className="size-4 text-emerald-600" /> : <TriangleAlert className="size-4 text-amber-600" />}
          <span>
            <b>Step 1: backup</b>
            <span className="block text-xs text-muted-foreground">
              {st.backup.fresh ? `Taken ${formatDateTime(st.backup.lastBackupAt)} — keep that file safe.` : st.backup.lastBackupAt ? `Last one ${formatDateTime(st.backup.lastBackupAt)} is too old or out of date.` : "No backup yet."} If anything goes wrong, MandalHisab can load it back.
            </span>
          </span>
        </p>
        <div className="flex gap-2">
          {!st.backup.fresh && (
            <ExportCsvButton href={`/api/backup?orgId=${orgId}`} className="h-9">
              <DatabaseBackup /> Download backup
            </ExportCsvButton>
          )}
          <Button variant="ghost" size="sm" onClick={refresh} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />} Check
          </Button>
        </div>
      </div>

      <Field label={`Step 2: type the Mandal's name — ${orgName}`} htmlFor="reset-name">
        <Input id="reset-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" placeholder={orgName} />
      </Field>
      <Field label="Why" htmlFor="reset-why" hint="Kept in the audit log, e.g. “Start again and bring in the paper hisab”.">
        <Input id="reset-why" value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)} />
      </Field>
      <FormError message={error} />
      <Button
        size="lg"
        variant="destructive"
        disabled={pending || !st.canReset || nothing || !typedOk || reason.trim().length < 3}
        onClick={() =>
          start(async () => {
            setError(null);
            const r = await apiMutate<{ ok: true }>({ path: `/orgs/${orgId}/money-reset`, body: { confirmName: name, reason, removeMembers } });
            if (!r.ok) return setError(r.error);
            toast.success(removeMembers ? "Money and members removed. Now bring in the members and closing figures." : "The hisab has been reset. Now bring in the closing figures.");
            router.push(`/org/${orgId}/settings/import`);
          })
        }
      >
        {pending ? <Loader2 className="animate-spin" /> : <RotateCcw />} {removeMembers ? "Delete money and members" : "Delete all money entries"}
      </Button>
    </div>
  );
}

export function MoneyResetDialog({ orgId, orgName }: { orgId: string; orgName: string }) {
  return (
    <FormDialog trigger={<><RotateCcw /> Reset money…</>} triggerVariant="outline" title="Start the hisab afresh" description="For when entries were typed in before the old hisab was brought in properly." wide icon={<RotateCcw />} tone="rose" openParam="reset">
      <ResetForm orgId={orgId} orgName={orgName} />
    </FormDialog>
  );
}
