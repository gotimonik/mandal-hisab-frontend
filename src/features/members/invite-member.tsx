"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/app/field";
import { FormDialog } from "@/components/app/form-dialog";
import { apiMutate } from "@/app/actions/api";

type Result = { inviteLink: string; existingUser: boolean; emailed: boolean };

function InviteForm({ orgId, memberId, defaultEmail }: { orgId: string; memberId: string; defaultEmail: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(defaultEmail);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

  if (result) {
    return (
      <div className="flex flex-col gap-3 text-sm">
        <p className="flex items-start gap-2 rounded-xl bg-emerald-500/10 p-3 text-emerald-800 dark:text-emerald-200">
          <Check className="mt-0.5 size-4 shrink-0" />
          {result.emailed ? `Invitation emailed to ${email}.` : "Invitation created. Email isn't set up yet, so share this link with them."}{" "}
          {result.existingUser ? "They already use MandalHisab and can join with one tap." : "They create their account (own password) and join straight away."}
        </p>
        <div className="flex items-center gap-2 rounded-xl bg-muted/60 p-2 text-xs">
          <span className="min-w-0 flex-1 truncate">{result.inviteLink}</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={async () => {
              await navigator.clipboard.writeText(result.inviteLink);
              setCopied(true);
            }}
          >
            {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        <a className="text-center text-xs font-medium text-primary hover:underline" href={`https://wa.me/?text=${encodeURIComponent(`You're invited to our Mandal on MandalHisab: ${result.inviteLink}`)}`} target="_blank" rel="noreferrer">
          Share on WhatsApp
        </a>
      </div>
    );
  }
  return (
    <form
      noValidate
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Enter a valid email");
        start(async () => {
          const r = await apiMutate<Result>({ path: `/orgs/${orgId}/invitations`, body: { email: email.trim().toLowerCase(), role: "member", memberId } });
          if (!r.ok) return setError(r.fieldErrors?.email ?? r.error);
          setResult(r.data);
          router.refresh();
        });
      }}
    >
      <FormError message={error} />
      <Field label="Their email" htmlFor="inv-m-email" hint="They sign in with this email. New to MandalHisab? They create an account and set their own password.">
        <Input id="inv-m-email" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Send />} Send invitation
      </Button>
    </form>
  );
}

/** "Invite to app" / "Send again" for a member who has no app login yet. */
export function InviteMemberButton({ orgId, memberId, memberName, email, again = false }: { orgId: string; memberId: string; memberName: string; email?: string | null; again?: boolean }) {
  return (
    <FormDialog
      trigger={
        <>
          <Mail /> {again ? "Send again" : "Invite to app"}
        </>
      }
      triggerVariant={again ? "outline" : "default"}
      triggerSize="sm"
      title={`Invite ${memberName} to the app`}
      description="They'll see their own savings, hapta, upad and receipts — nobody else's."
    >
      <InviteForm orgId={orgId} memberId={memberId} defaultEmail={email ?? ""} />
    </FormDialog>
  );
}
