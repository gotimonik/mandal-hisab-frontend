"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormDialog, useDialogClose } from "@/components/app/form-dialog";
import { FormError } from "@/components/app/field";
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
      <p className="text-muted-foreground">
        CSV columns: <code>name</code> (required), <code>membership number</code>, <code>phone</code>, <code>email</code>, <code>address</code>, <code>joining date</code> (YYYY-MM-DD or DD-MM-YYYY), <code>notes</code>. Duplicates by membership number or phone are skipped.
      </p>
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-6 hover:bg-muted/50">
        <Upload className="size-4" />
        <span>{fileName || "Choose a .csv file"}</span>
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
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="font-medium">
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
      <div className="flex gap-2">
        <Button variant="outline" disabled={!csv || pending} onClick={() => run(true)}>
          {pending && <Loader2 className="animate-spin" />} Validate
        </Button>
        <Button disabled={!csv || pending || !result || result.errors.length > 0 || result.created === 0} onClick={() => run(false)}>
          Import
        </Button>
      </div>
    </div>
  );
}

export function ImportMembersDialog({ orgId }: { orgId: string }) {
  const t = useT();
  return (
    <FormDialog trigger={<><Upload /> {t("members.importCsv")}</>} triggerVariant="outline" title="Import members from CSV" wide>
      <ImportForm orgId={orgId} />
    </FormDialog>
  );
}
