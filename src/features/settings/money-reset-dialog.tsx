"use client";

import { useT } from "@/i18n/client";
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
  const t = useT();
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
        <Loader2 className="size-4 animate-spin" /> {error ?? t("setd.loading")}
      </div>
    );

  const typedOk = name.trim().toLowerCase().replace(/\s+/g, " ") === orgName.trim().toLowerCase().replace(/\s+/g, " ");
  const others = st.blockers.filter((b) => !/backup/i.test(b));
  const c = st.counts;
  const nothing = !st.hasMoney && (!removeMembers || c.otherMembers + c.otherLogins === 0);

  return (
    <div className="flex flex-col gap-3 text-sm">
      <ChoicePills
        label={t("setd.mr.what")}
        value={removeMembers ? "all" : "money"}
        onChange={(v) => setRemoveMembers(v === "all")}
        options={[
          { value: "money", label: t("setd.mr.moneyOnly") },
          { value: "all", label: t("setd.mr.moneyMembers") },
        ]}
      />
      <FormNote tone="warn">
        <b>{t("setd.mr.deletedTitle")}</b> {t("setd.mr.deletedRest")}{" "}
        {removeMembers ? (
          <>
            <b>{t("setd.mr.membersGo")}</b> {t("setd.mr.membersRest", { members: c.otherMembers, logins: c.otherLogins })} <b>{t("setd.mr.onlyYou")}</b>{t("setd.mr.onlyYouRest")}
          </>
        ) : (
          <>
            <b>{t("setd.mr.kept")}</b> {t("setd.mr.keptRest")}
          </>
        )}
      </FormNote>

      <ul className="grid grid-cols-2 gap-1.5 text-xs sm:grid-cols-4">
        {[
          [t("setd.mr.cEntries"), c.transactions],
          [t("setd.mr.cPayments"), c.payments],
          [t("setd.mr.cUpads"), c.upads],
          removeMembers ? [t("setd.mr.cOthers"), c.otherMembers] : [t("setd.mr.cInterest"), c.interestRuns],
        ].map(([l, n]) => (
          <li key={l} className="rounded-lg bg-muted/60 px-2 py-1.5">
            <span className="block text-muted-foreground">{l}</span>
            <b className="text-base">{n}</b>
          </li>
        ))}
      </ul>

      {nothing && <FormNote tone="warn">{removeMembers ? t("setd.mr.nothing") : t("setd.mr.nothingMoney")}</FormNote>}
      {others.map((b) => (
        <FormNote key={b} tone="warn">
          {b}
        </FormNote>
      ))}

      <div className={cn("flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2.5", st.backup.fresh ? "bg-emerald-500/8" : "bg-amber-500/10 ring-1 ring-amber-500/25")}>
        <p className="flex items-center gap-2">
          {st.backup.fresh ? <CheckCircle2 className="size-4 text-emerald-600" /> : <TriangleAlert className="size-4 text-amber-600" />}
          <span>
            <b>{t("setd.mr.step1")}</b>
            <span className="block text-xs text-muted-foreground">
              {st.backup.fresh ? t("setd.mr.taken", { at: formatDateTime(st.backup.lastBackupAt) }) : st.backup.lastBackupAt ? t("setd.mr.old", { at: formatDateTime(st.backup.lastBackupAt) }) : t("setd.mr.none")} {t("setd.mr.loadBack")}
            </span>
          </span>
        </p>
        <div className="flex gap-2">
          {!st.backup.fresh && (
            <ExportCsvButton href={`/api/backup?orgId=${orgId}`} className="h-9">
              <DatabaseBackup /> {t("setd.mr.download")}
            </ExportCsvButton>
          )}
          <Button variant="ghost" size="sm" onClick={refresh} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />} {t("setd.mr.check")}
          </Button>
        </div>
      </div>

      <Field label={t("setd.mr.step2", { name: orgName })} htmlFor="reset-name">
        <Input id="reset-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" placeholder={orgName} />
      </Field>
      <Field label={t("setd.mr.why")} htmlFor="reset-why" hint={t("setd.mr.whyHint")}>
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
            toast.success(removeMembers ? t("setd.mr.doneAll") : t("setd.mr.doneMoney"));
            router.push(`/org/${orgId}/settings/import`);
          })
        }
      >
        {pending ? <Loader2 className="animate-spin" /> : <RotateCcw />} {removeMembers ? t("setd.mr.btnAll") : t("setd.mr.btnMoney")}
      </Button>
    </div>
  );
}

export function MoneyResetDialog({ orgId, orgName }: { orgId: string; orgName: string }) {
  const t = useT();
  return (
    <FormDialog trigger={<><RotateCcw /> {t("setd.mr.trigger")}</>} triggerVariant="outline" title={t("setd.mr.title")} description={t("setd.mr.desc")} wide icon={<RotateCcw />} tone="rose" openParam="reset">
      <ResetForm orgId={orgId} orgName={orgName} />
    </FormDialog>
  );
}
