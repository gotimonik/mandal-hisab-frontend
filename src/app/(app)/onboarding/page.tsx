import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, ShieldCheck } from "lucide-react";
import { api } from "@/lib/server/api";
import { lastOrg } from "@/lib/server/session";
import type { Me } from "@/lib/types";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CreateOrgForm } from "@/features/onboarding/create-org-form";
import { JoinOrgForm } from "@/features/onboarding/join-org-form";
import { ActionButton } from "@/components/app/action-button";

interface MyInvitation {
  id: string;
  role: string;
  expiresAt: string;
  organization: { _id: string; name: string; city?: string | null } | null;
  invitedByName: string | null;
}

export const metadata = { title: "Your organizations" };

export default async function OnboardingPage({ searchParams }: PageProps<"/onboarding">) {
  const sp = await searchParams;
  const [me, invitations] = await Promise.all([api<Me>("/auth/me"), api<MyInvitation[]>("/invitations/mine")]);
  const active = me.organizations.filter((o) => o.membershipStatus === "active" && o.status !== "suspended");
  const pending = me.organizations.filter((o) => o.membershipStatus === "pending");
  // Only jump straight into a Mandal right after signing in (?auto=1). Any other visit —
  // "Create or join a Mandal", the logo, a typed URL — shows this page.
  if (sp.auto === "1" && active.length >= 1 && pending.length === 0 && invitations.length === 0) {
    const last = await lastOrg();
    const target = active.find((o) => o.id === last) ?? (active.length === 1 ? active[0] : null);
    if (target) redirect(`/org/${target.id}`);
  }
  return (
    <>
      <PageHeader
        title={`Namaste, ${me.user.name.split(" ")[0]}`}
        description="Open one of your Mandals, request to join another, or register a new one."
        actions={
          me.user.isPlatformAdmin ? (
            <Link href="/platform" className={cn(buttonVariants({ variant: "outline" }))}>
              <ShieldCheck /> Platform admin
            </Link>
          ) : null
        }
      />
      {invitations.length > 0 && (
        <section className="mb-6 flex flex-col gap-2" aria-label="Invitations">
          <h2 className="font-medium">Invitations for you</h2>
          {invitations.map((i) => (
            <Card key={i.id} size="sm" className="flex-row flex-wrap items-center justify-between gap-3 px-4">
              <div className="min-w-0 text-sm">
                <p className="font-medium">{i.organization?.name ?? "A Mandal"}</p>
                <p className="text-xs text-muted-foreground">
                  {i.invitedByName ? `${i.invitedByName} invited you` : "You're invited"} as <span className="capitalize">{i.role}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <ActionButton path={`/invitations/${i.id}/decline`} variant="ghost" successMessage="Invitation declined">
                  Decline
                </ActionButton>
                <ActionButton path={`/invitations/${i.id}/accept`} variant="default" successMessage="Welcome to the Mandal" redirectTo={i.organization ? `/org/${i.organization._id}` : undefined}>
                  Accept
                </ActionButton>
              </div>
            </Card>
          ))}
        </section>
      )}
      {me.organizations.length > 0 && (
        <section className="mb-8 grid gap-3 sm:grid-cols-2">
          {me.organizations.map((o) => (
            <Card key={o.id} size="sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="size-4 text-primary" /> {o.name}
                </CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-2">
                  <span className="capitalize">{o.role}</span>
                  {o.membershipStatus === "pending" ? <StatusBadge status="pending" /> : <StatusBadge status={o.status} />}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {o.membershipStatus === "active" && o.status !== "suspended" ? (
                  <Link href={`/org/${o.id}`} className={cn(buttonVariants({ size: "sm" }))}>
                    Open
                  </Link>
                ) : (
                  <p className="text-xs text-muted-foreground">{o.membershipStatus === "pending" ? "Waiting for an admin to approve your request." : `This organization is ${o.status}.`}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </section>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Join a Mandal</CardTitle>
            <CardDescription>Search by the Mandal&apos;s name, or enter the join code the admin shared.</CardDescription>
          </CardHeader>
          <CardContent>
            <JoinOrgForm />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Register a new Mandal</CardTitle>
            <CardDescription>You will be its first admin. New organizations may need platform approval before recording money.</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateOrgForm />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
