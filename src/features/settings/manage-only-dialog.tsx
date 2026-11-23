"use client";

import { useT } from "@/i18n/client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, UserMinus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/app/field";
import { FormNote } from "@/components/app/form-bits";
import { FormDialog, useDialogClose } from "@/components/app/form-dialog";
import { apiMutate, apiRead } from "@/app/actions/api";

interface ManageOnlyStatus {
  role: string;
  isMember: boolean;
  member: { _id: string; name: string; membershipNumber: string; status: string } | null;
  action: "delete" | "unlink" | null;
  money: string[];
  canSwitch: boolean;
  blockers: string[];
  canAddBack: boolean;
}

function SwitchForm({ orgId }: { orgId: string }) {
  const router = useRouter();
  const t = useT();
  const close = useDialogClose();
  const [st, setSt] = useState<ManageOnlyStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();

  useEffect(() => {
    apiRead<ManageOnlyStatus>(`/orgs/${orgId}/me/manage-only`).then((r) => (r.ok ? setSt(r.data) : setError(r.error)));
  }, [orgId]);

  if (!st)
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> {error ?? t("setd.loading")}
      </div>
    );

  const run = () =>
    start(async () => {
      setError(null);
      const r = await apiMutate<{ ok: boolean }>({ path: `/orgs/${orgId}/me/manage-only`, body: { reason: reason.trim() || undefined } });
      if (!r.ok) return setError(r.error);
      toast.success(t("setd.mo.done"));
      close();
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-3 text-sm">
      <FormNote>
        <b>{st.role === "admin" ? t("setd.mo.stayAdmin") : t("setd.mo.stayManager")}</b> {t("setd.mo.stayRest")} <b>{t("setd.mo.notMember")}</b> {t("setd.mo.notMemberRest")}
      </FormNote>
      {st.member && st.action === "delete" && st.canSwitch && (
        <FormNote tone="warn">
          {t("setd.mo.deleteRec", { rec: `${st.member.name} (${st.member.membershipNumber})` })}
        </FormNote>
      )}
      {st.member && st.action === "unlink" && <FormNote>{t("setd.mo.unlinked", { rec: `${st.member.name} (${st.member.membershipNumber})` })}</FormNote>}
      {st.blockers.map((b, i) => (
        <FormNote key={i} tone="warn">
          {b}
        </FormNote>
      ))}
      {st.canSwitch && (
        <>
          <Field label={t("setd.reasonOpt")} htmlFor="mo-reason" hint={t("setd.keptInLog")}>
            <Input id="mo-reason" value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)} placeholder={t("setd.mo.reasonPh")} />
          </Field>
          <FormError message={error} />
          <Button size="lg" disabled={pending} onClick={run}>
            {pending ? <Loader2 className="animate-spin" /> : <UserMinus />} {t("setd.mo.button")}
          </Button>
        </>
      )}
      {!st.canSwitch && <FormError message={error} />}
    </div>
  );
}

/** For an admin / manager who is also a member: stay on only to manage the Mandal. */
export function ManageOnlyDialog({ orgId }: { orgId: string }) {
  const t = useT();
  return (
    <FormDialog trigger={<><UserMinus /> {t("setd.mo.trigger")}</>} triggerVariant="outline" title={t("setd.mo.title")} icon={<UserMinus />} tone="amber">
      <SwitchForm orgId={orgId} />
    </FormDialog>
  );
}

function AddBackForm({ orgId, hasMonthlyHapta, thisMonth }: { orgId: string; hasMonthlyHapta: boolean; thisMonth: string }) {
  const router = useRouter();
  const t = useT();
  const close = useDialogClose();
  const [month, setMonth] = useState(thisMonth);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const run = () =>
    start(async () => {
      setError(null);
      const r = await apiMutate<{ ok: boolean }>({ path: `/orgs/${orgId}/me/member`, body: { haptaStartMonth: hasMonthlyHapta ? month : undefined } });
      if (!r.ok) return setError(r.error);
      toast.success(t("setd.ab.done"));
      close();
      router.refresh();
    });
  return (
    <div className="flex flex-col gap-3 text-sm">
      <FormNote>{hasMonthlyHapta ? t("setd.ab.noteHapta") : t("setd.ab.note")}</FormNote>
      {hasMonthlyHapta && (
        <Field label={t("setd.ab.month")} htmlFor="mo-month">
          <Input id="mo-month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </Field>
      )}
      <FormError message={error} />
      <Button size="lg" disabled={pending} onClick={run}>
        {pending ? <Loader2 className="animate-spin" /> : <UserPlus />} {t("setd.ab.button")}
      </Button>
    </div>
  );
}

/** Undo: the admin who only manages becomes a member again. */
export function AddMeAsMemberDialog(props: { orgId: string; hasMonthlyHapta: boolean; thisMonth: string }) {
  const t = useT();
  return (
    <FormDialog trigger={<><UserPlus /> {t("setd.ab.trigger")}</>} triggerVariant="outline" title={t("setd.ab.title")} icon={<UserPlus />} tone="emerald">
      <AddBackForm {...props} />
    </FormDialog>
  );
}
