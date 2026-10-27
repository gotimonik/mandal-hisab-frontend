"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Mail, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/app/field";
import { FormDialog } from "@/components/app/form-dialog";
import { FormNote, SubmitButton } from "@/components/app/form-bits";
import { apiMutate } from "@/app/actions/api";
import { useT } from "@/i18n/client";

type Result = { inviteLink: string; existingUser: boolean; emailed: boolean };

function InviteForm({ orgId, memberId, defaultEmail }: { orgId: string; memberId: string; defaultEmail: string }) {
  const router = useRouter();
  const t = useT();
  const [email, setEmail] = useState(defaultEmail);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

  if (result) {
    return (
      <div className="flex flex-col gap-3 text-sm">
        <FormNote tone="good" className="text-sm">
          {result.emailed ? t("members.invEmailed", { email }) : t("members.invCreated")}{" "}
          {result.existingUser ? t("members.invExisting") : t("members.invNew")}
        </FormNote>
        <div className="flex items-center gap-2 rounded-2xl bg-muted/60 p-2 pl-3 text-xs ring-1 ring-foreground/[0.06]">
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
            {copied ? <Check /> : <Copy />} {copied ? t("members.copied") : t("members.copy")}
          </Button>
        </div>
        <a className="flex items-center justify-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300" href={`https://wa.me/?text=${encodeURIComponent(t("members.waText", { link: result.inviteLink }))}`} target="_blank" rel="noreferrer">
          <MessageCircle className="size-4" /> {t("members.shareWa")}
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
      <Field label={t("members.theirEmail")} htmlFor="inv-m-email" hint={t("members.theirEmailHint")}>
        <Input id="inv-m-email" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <SubmitButton pending={pending} icon={<Send />}>
        {t("members.sendInvite")}
      </SubmitButton>
    </form>
  );
}

/** "Invite to app" / "Send again" for a member who has no app login yet. */
export function InviteMemberButton({ orgId, memberId, memberName, email, again = false }: { orgId: string; memberId: string; memberName: string; email?: string | null; again?: boolean }) {
  const t = useT();
  return (
    <FormDialog
      trigger={
        <>
          <Mail /> {again ? t("members.sendAgain") : t("members.inviteToApp")}
        </>
      }
      triggerVariant={again ? "outline" : "default"}
      triggerSize="sm"
      title={t("members.inviteTitle", { name: memberName })}
      description={t("members.inviteDesc")}
      icon={<Mail />}
      tone="sky"
    >
      <InviteForm orgId={orgId} memberId={memberId} defaultEmail={email ?? ""} />
    </FormDialog>
  );
}
