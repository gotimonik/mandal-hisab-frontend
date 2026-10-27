"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, FileSpreadsheet, ListChecks, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormDialog, useDialogClose } from "@/components/app/form-dialog";
import { FormError } from "@/components/app/field";
import { FormNote } from "@/components/app/form-bits";
import { cn } from "@/lib/utils";
import { apiMutate } from "@/app/actions/api";
import { useT } from "@/i18n/client";

interface Result {
  created: number;
  skipped: { row: number; reason: string }[];
  errors: { row: number; message: string }[];
  dryRun: boolean;
}

function ImportForm({ orgId }: { orgId: string }) {
  const router = useRouter();
  const close = useDialogClose();
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = (dryRun: boolean) =>
    start(async () => {
      setError(null);
      const r = await apiMutate<Result>({ path: `/orgs/${orgId}/members/import`, body: { csv, dryRun } });
      if (!r.ok) return setError(r.error);
      setResult(r.data);
      if (!dryRun) {
        toast.success(`${r.data.created} members imported`);
        router.refresh();
        close();
      }
    });

  return (
    <div className="flex flex-col gap-3 text-sm">
      <FormNote>
        CSV columns: <code>name</code> (required), <code>membership number</code>, <code>phone</code>, <code>email</code>, <code>address</code>, <code>joining date</code> (YYYY-MM-DD or DD-MM-YYYY), <code>notes</code>. Duplicates by membership number or phone are skipped.
      </FormNote>
      <label className={cn("flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-3 py-7 text-center transition-colors hover:bg-muted/50", fileName ? "border-sky-500/40 bg-sky-500/5" : "border-primary/25 bg-secondary/30")}>
        <span className="flex size-12 items-center justify-center rounded-2xl bg-sky-500/12 text-sky-600 dark:text-sky-300">{fileName ? <FileSpreadsheet className="size-6" /> : <Upload className="size-6" />}</span>
        <span className="font-semibold">{fileName || "Choose a .csv file"}</span>
        {!fileName && <span className="text-xs text-muted-foreground">Max 2 MB</span>}
        <input
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            if (f.size > 2_000_000) return setError("File is too large (max 2 MB)");
            setFileName(f.name);
            setCsv(await f.text());
            setResult(null);
          }}
        />
      </label>
      <FormError message={error} />
      {result && (
        <div className={cn("rounded-2xl p-3 ring-1", result.errors.length > 0 ? "bg-rose-500/5 ring-rose-500/20" : "bg-emerald-500/5 ring-emerald-500/20")}>
          <p className="font-semibold">
            {result.dryRun ? `${result.created} members ready to import` : `${result.created} imported`} · {result.skipped.length} skipped · {result.errors.length} errors
          </p>
          <ul className="mt-2 max-h-40 overflow-y-auto text-xs">
            {result.errors.map((x) => (
              <li key={`e${x.row}`} className="text-destructive">
                Row {x.row}: {x.message}
              </li>
            ))}
            {result.skipped.map((x) => (
              <li key={`s${x.row}`} className="text-muted-foreground">
                Row {x.row}: {x.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Button size="lg" variant="outline" disabled={!csv || pending} onClick={() => run(true)}>
          {pending ? <Loader2 className="animate-spin" /> : <ListChecks />} Validate
        </Button>
        <Button size="lg" disabled={!csv || pending || !result || result.errors.length > 0 || result.created === 0} onClick={() => run(false)}>
          <CheckCircle2 /> Import
        </Button>
      </div>
    </div>
  );
}

export function ImportMembersDialog({ orgId }: { orgId: string }) {
  const t = useT();
  return (
    <FormDialog trigger={<><Upload /> {t("members.importCsv")}</>} triggerVariant="outline" title="Import members from CSV" wide icon={<FileSpreadsheet />} tone="sky">
      <ImportForm orgId={orgId} />
    </FormDialog>
  );
}
