"use client";

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
        <Loader2 className="size-4 animate-spin" /> {error ?? "Loading…"}
      </div>
    );

  const run = () =>
    start(async () => {
      setError(null);
      const r = await apiMutate<{ ok: boolean }>({ path: `/orgs/${orgId}/me/manage-only`, body: { reason: reason.trim() || undefined } });
      if (!r.ok) return setError(r.error);
      toast.success("Done — you now only manage this Mandal");
      close();
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-3 text-sm">
      <FormNote>
        <b>You stay {st.role === "admin" ? "an admin" : "a manager"}</b> and can do everything as before, and you still show under Users. <b>You won&apos;t be a member:</b> not in the members list, no monthly hapta, not counted in the totals or the share-out, and no &quot;My account&quot; page.
      </FormNote>
      {st.member && st.action === "delete" && st.canSwitch && (
        <FormNote tone="warn">
          Your member record <b>{st.member.name} ({st.member.membershipNumber})</b> has no money in it, so it is deleted with its unpaid hapta months. You can add yourself back as a member later.
        </FormNote>
      )}
      {st.member && st.action === "unlink" && <FormNote>You have left the Mandal as a member: {st.member.name} ({st.member.membershipNumber}) stays in the records as a past member, without your login.</FormNote>}
      {st.blockers.map((b, i) => (
        <FormNote key={i} tone="warn">
          {b}
        </FormNote>
      ))}
      {st.canSwitch && (
        <>
          <Field label="Reason (optional)" htmlFor="mo-reason" hint="Kept in the activity log.">
            <Input id="mo-reason" value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)} placeholder="e.g. I only keep the books" />
          </Field>
          <FormError message={error} />
          <Button size="lg" disabled={pending} onClick={run}>
            {pending ? <Loader2 className="animate-spin" /> : <UserMinus />} Only manage — remove me from members
          </Button>
        </>
      )}
      {!st.canSwitch && <FormError message={error} />}
    </div>
  );
}

/** For an admin / manager who is also a member: stay on only to manage the Mandal. */
export function ManageOnlyDialog({ orgId }: { orgId: string }) {
  return (
    <FormDialog trigger={<><UserMinus /> Only manage this Mandal…</>} triggerVariant="outline" title="Only manage this Mandal" icon={<UserMinus />} tone="amber">
      <SwitchForm orgId={orgId} />
    </FormDialog>
  );
}

function AddBackForm({ orgId, hasMonthlyHapta, thisMonth }: { orgId: string; hasMonthlyHapta: boolean; thisMonth: string }) {
  const router = useRouter();
  const close = useDialogClose();
  const [month, setMonth] = useState(thisMonth);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const run = () =>
    start(async () => {
      setError(null);
      const r = await apiMutate<{ ok: boolean }>({ path: `/orgs/${orgId}/me/member`, body: { haptaStartMonth: hasMonthlyHapta ? month : undefined } });
      if (!r.ok) return setError(r.error);
      toast.success("You are a member of the Mandal again");
      close();
      router.refresh();
    });
  return (
    <div className="flex flex-col gap-3 text-sm">
      <FormNote>You get a new member record{hasMonthlyHapta ? " and pay the monthly hapta from the month you pick" : ""}, like any other member.</FormNote>
      {hasMonthlyHapta && (
        <Field label="Hapta from month" htmlFor="mo-month">
          <Input id="mo-month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </Field>
      )}
      <FormError message={error} />
      <Button size="lg" disabled={pending} onClick={run}>
        {pending ? <Loader2 className="animate-spin" /> : <UserPlus />} Add me as a member
      </Button>
    </div>
  );
}

/** Undo: the admin who only manages becomes a member again. */
export function AddMeAsMemberDialog(props: { orgId: string; hasMonthlyHapta: boolean; thisMonth: string }) {
  return (
    <FormDialog trigger={<><UserPlus /> Add me as a member…</>} triggerVariant="outline" title="Become a member again" icon={<UserPlus />} tone="emerald">
      <AddBackForm {...props} />
    </FormDialog>
  );
}
