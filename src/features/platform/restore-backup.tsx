"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, DatabaseBackup, FileSearch, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormDialog } from "@/components/app/form-dialog";
import { FormError } from "@/components/app/field";
import { restoreMandalBackup, type RestoreSummary } from "@/app/actions/api";
import { formatDateTime } from "@/lib/format";


/** Shrink the file before upload (a backup's JSON compresses ~10×); the API accepts both. */
async function compress(file: File): Promise<File> {
  const head = new Uint8Array(await file.slice(0, 2).arrayBuffer());
  if ((head[0] === 0x1f && head[1] === 0x8b) || typeof CompressionStream === "undefined") return file;
  const gz = await new Response(file.stream().pipeThrough(new CompressionStream("gzip"))).blob();
  return new File([gz], `${file.name}.gz`, { type: "application/gzip" });
}

const LABEL: Record<string, string> = {
  members: "Members",
  organizationMemberships: "App users",
  installments: "Hapta entries",
  payments: "Payments",
  receipts: "Receipts",
  fundLoans: "Upad",
  withdrawals: "Withdrawals",
  financialTransactions: "Cash book entries",
  meetings: "Meetings",
};

function Body() {
  const [file, setFile] = useState<File | null>(null);
  const [check, setCheck] = useState<RestoreSummary | null>(null);
  const [done, setDone] = useState<RestoreSummary | null>(null);
  const [trust, setTrust] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = (f: File, opts: { dryRun?: boolean; replace?: boolean; trustUnsigned?: boolean }) =>
    start(async () => {
      setError(null);
      const fd = new FormData();
      fd.set("file", await compress(f));
      const res = await restoreMandalBackup(fd, opts);
      if (!res.ok) return setError(res.error);
      if (opts.dryRun) setCheck(res.data);
      else {
        setDone(res.data);
        toast.success(`${res.data.organization.name} restored`);
      }
    });

  if (done) {
    return (
      <div className="flex flex-col gap-3 text-sm">
        <p className="flex items-start gap-2 rounded-xl bg-emerald-500/10 p-3 ring-1 ring-emerald-500/25">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
          <span>
            <b>{done.organization.name}</b> is back, as it was on {formatDateTime(done.backupCreatedAt)}.
            {done.usersCreated > 0 && ` ${done.usersCreated} ${done.usersCreated === 1 ? "person gets their account" : "people get their accounts"} back without a password — they sign in with "Forgot password".`}
          </span>
        </p>
        <Link href={`/org/${done.organization.id}`} className={buttonVariants()}>
          Open {done.organization.name}
        </Link>
      </div>
    );
  }

  const needsTrust = check && !check.signatureValid;
  return (
    <div className="flex flex-col gap-3 text-sm">
      <FormError message={error} />
      <label className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-dashed border-foreground/15 p-4 text-center hover:bg-muted/40">
        <Upload className="size-5 text-muted-foreground" />
        <span className="font-medium">{file ? file.name : "Choose the backup file"}</span>
        <span className="text-xs text-muted-foreground">MandalHisab-backup-….json, as the Mandal&apos;s admin downloaded it</span>
        <input
          type="file"
          accept=".json,.gz,application/json,application/gzip"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setFile(f);
            setCheck(null);
            setTrust(false);
            if (f) run(f, { dryRun: true });
          }}
        />
      </label>

      {pending && !check && <p className="text-muted-foreground">Checking the file…</p>}

      {check && (
        <>
          <div className="rounded-xl bg-muted/50 p-3">
            <p className="font-semibold">
              {check.organization.name} <span className="font-mono text-xs text-muted-foreground">{check.organization.code}</span>
            </p>
            <p className="text-xs text-muted-foreground">Backup taken {formatDateTime(check.backupCreatedAt)}</p>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
              {Object.entries(LABEL)
                .filter(([k]) => (check.counts[k] ?? 0) > 0)
                .map(([k, l]) => (
                  <div key={k} className="contents">
                    <dt className="text-muted-foreground">{l}</dt>
                    <dd className="text-right tabular-nums">{check.counts[k]}</dd>
                  </div>
                ))}
            </dl>
            <p className="mt-2 text-xs text-muted-foreground">
              People: {check.usersMatchedByEmail} still have an account; {check.usersCreated} will get theirs back without a password.
            </p>
          </div>
          {check.existsInDatabase && (
            <p className="flex items-start gap-2 rounded-xl bg-amber-500/10 p-3 ring-1 ring-amber-500/30">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
              <span>
                <b>This Mandal is still in the database.</b> Restoring replaces everything it has now with the backup — anything recorded after{" "}
                {formatDateTime(check.backupCreatedAt)} is lost.
              </span>
            </p>
          )}
          {needsTrust && (
            <label className="flex items-start gap-2 rounded-xl bg-red-500/10 p-3 ring-1 ring-red-500/30">
              <input type="checkbox" className="mt-1" checked={trust} onChange={(e) => setTrust(e.target.checked)} />
              <span>
                <b>This file was changed after it was downloaded</b> (or made with a different AUTH_SECRET). Its numbers may not be genuine. Tick only if you&apos;re sure the file can be trusted.
              </span>
            </label>
          )}
          <Button
            variant={check.existsInDatabase || needsTrust ? "destructive" : "default"}
            disabled={pending || (needsTrust && !trust) || !file}
            onClick={() => file && run(file, { replace: check.existsInDatabase, trustUnsigned: needsTrust ? trust : undefined })}
          >
            <DatabaseBackup /> {pending ? "Restoring…" : check.existsInDatabase ? "Replace with this backup" : "Restore this Mandal"}
          </Button>
        </>
      )}
    </div>
  );
}

/** Platform panel: load a Mandal back from the backup file its admin sends. */
export function RestoreBackupDialog() {
  return (
    <FormDialog trigger={<><FileSearch /> Restore from backup</>} triggerVariant="outline" title="Restore a Mandal from backup" description="Upload the backup file the Mandal's admin sends. It's checked first; nothing changes until you confirm." icon={<DatabaseBackup />} tone="emerald">
      <Body />
    </FormDialog>
  );
}

