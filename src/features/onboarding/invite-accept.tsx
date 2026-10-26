"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, HandCoins, Loader2, LogOut, UserRound } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormError } from "@/components/app/field";
import { apiMutate } from "@/app/actions/api";
import { logoutAction } from "@/app/actions/auth";

export interface InvitePreview {
  organization: { _id: string; name: string; city: string | null } | null;
  invitedByName: string | null;
  role: "admin" | "manager" | "member";
  email: string;
  member: { name: string; membershipNumber: string } | null;
  emailMatches: boolean;
  signedInAs: string;
  expiresAt: string;
}

export function InviteAccept({ token, preview, error: initialError }: { token: string; preview: InvitePreview | null; error: string | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(initialError);
  const orgName = preview?.organization?.name ?? "the Mandal";
  return (
    <Card className="mx-auto max-w-md gap-0 overflow-hidden p-0">
      <div className="bg-hero flex flex-col items-center gap-2 px-6 py-7 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
          <HandCoins className="size-6" />
        </span>
        <p className="text-sm text-white/85">{preview?.invitedByName ? `${preview.invitedByName} invited you to join` : "You're invited to join"}</p>
        <h1 className="text-2xl font-extrabold tracking-tight">{orgName}</h1>
        {preview?.organization?.city && <p className="text-sm text-white/80">{preview.organization.city}</p>}
      </div>
      <CardContent className="flex flex-col gap-4 p-5">
        <FormError message={error} />
        {preview && (
          <ul className="flex flex-col gap-2 text-sm">
            {preview.member && (
              <li className="flex items-start gap-2.5">
                <UserRound className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>
                  You&apos;ll see the savings, hapta and upad of <b>{preview.member.name}</b> ({preview.member.membershipNumber})
                </span>
              </li>
            )}
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="size-4 shrink-0 text-primary" />
              <span>
                Joining as <b className="capitalize">{preview.role}</b>
              </span>
            </li>
          </ul>
        )}
        {preview && !preview.emailMatches ? (
          <div className="flex flex-col gap-3 rounded-xl bg-amber-500/10 p-3 text-sm">
            <p>
              This invitation is for <b>{preview.email}</b>, but you&apos;re signed in as <b>{preview.signedInAs}</b>. Sign out and sign in (or create an account) with {preview.email}.
            </p>
            <form action={logoutAction}>
              <Button type="submit" variant="outline" className="w-full">
                <LogOut /> Sign out
              </Button>
            </form>
          </div>
        ) : preview ? (
          <Button
            size="lg"
            disabled={pending || !token}
            onClick={() =>
              start(async () => {
                const r = await apiMutate<{ organizationId: string }>({ path: "/invitations/accept", body: { token } });
                if (!r.ok) return setError(r.error);
                router.push(`/org/${r.data.organizationId}`);
              })
            }
          >
            {pending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} Join {orgName}
          </Button>
        ) : (
          <Link href="/onboarding" className={buttonVariants({ variant: "outline" })}>
            Go to my Mandals
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
