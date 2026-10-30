import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Clock, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { api } from "@/lib/server/api";
import { lastOrg } from "@/lib/server/session";
import type { Me } from "@/lib/types";
import { StatusBadge } from "@/components/app/status-badge";
import { IconChip, MemberAvatar, SectionTitle } from "@/components/app/bits";
import { ActionButton } from "@/components/app/action-button";
import { OnboardingActions } from "@/features/onboarding/onboarding-actions";
import { OrgLogo } from "@/components/app/org-logo";
import { getT } from "@/i18n/server";
import type { Key } from "@/i18n/core";

interface MyInvitation {
  id: string;
  role: string;
  expiresAt: string;
  organization: { _id: string; name: string; city?: string | null; logoUrl?: string | null } | null;
  invitedByName: string | null;
}

export const metadata = { title: "Your Mandals" };

export default async function OnboardingPage({ searchParams }: PageProps<"/onboarding">) {
  const sp = await searchParams;
  const [me, invitations, { t }] = await Promise.all([api<Me>("/auth/me"), api<MyInvitation[]>("/invitations/mine"), getT()]);
  const active = me.organizations.filter((o) => o.membershipStatus === "active" && o.status !== "suspended");
  const pending = me.organizations.filter((o) => o.membershipStatus === "pending");
  // Only jump straight into a Mandal right after signing in (?auto=1). Any other visit —
  // "Create or join a Mandal", the logo, a typed URL — shows this page.
  if (sp.auto === "1" && active.length >= 1 && pending.length === 0 && invitations.length === 0) {
    const last = await lastOrg();
    const target = active.find((o) => o.id === last) ?? (active.length === 1 ? active[0] : null);
    if (target) redirect(`/org/${target.id}`);
  }
  const role = (r: string) => t(`shell.roles.${r}` as Key);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      {/* greeting */}
      <section className="bg-hero relative overflow-hidden rounded-3xl p-5 text-white shadow-lg shadow-primary/20 sm:p-6">
        <div className="pointer-events-none absolute -top-12 -right-10 size-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute right-16 -bottom-16 size-32 rounded-full bg-white/10" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-[1.7rem]">{t("dash.namaste", { name: me.user.name.split(" ")[0] })}</h1>
            <p className="mt-1 text-sm text-white/85">{t("onb.greetingDesc")}</p>
          </div>
          {me.user.isPlatformAdmin && (
            <Link href="/platform" className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur hover:bg-white/25">
              <ShieldCheck className="size-3.5" /> {t("onb.platformAdmin")}
            </Link>
          )}
        </div>
      </section>

      {/* invitations */}
      {invitations.length > 0 && (
        <section aria-label={t("onb.invitations")}>
          <SectionTitle>{t("onb.invitations")}</SectionTitle>
          <div className="flex flex-col gap-2">
            {invitations.map((i) => (
              <div key={i.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-card p-3.5 shadow-card ring-2 ring-amber-400/40">
                <OrgLogo logoUrl={i.organization?.logoUrl} className="rounded-xl">
                  <IconChip tone="amber">
                    <Mail />
                  </IconChip>
                </OrgLogo>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="truncate font-semibold">{i.organization?.name ?? t("onb.aMandal")}</p>
                  <p className="text-xs text-muted-foreground">{i.invitedByName ? t("onb.invitedBy", { who: i.invitedByName, role: role(i.role) }) : t("onb.invitedAs", { role: role(i.role) })}</p>
                </div>
                <div className="flex w-full gap-2 sm:w-auto">
                  <ActionButton path={`/invitations/${i.id}/decline`} variant="ghost" successMessage={t("onb.declined")} className="flex-1 sm:flex-none">
                    {t("onb.decline")}
                  </ActionButton>
                  <ActionButton path={`/invitations/${i.id}/accept`} variant="default" successMessage={t("onb.welcome")} redirectTo={i.organization ? `/org/${i.organization._id}` : undefined} className="flex-1 sm:flex-none">
                    {t("onb.accept")}
                  </ActionButton>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* my Mandals */}
      {me.organizations.length > 0 ? (
        <section aria-label={t("onb.yourMandals")}>
          <SectionTitle>{t("onb.yourMandals")}</SectionTitle>
          <ul className="flex flex-col gap-2">
            {me.organizations.map((o) => {
              const open = o.membershipStatus === "active" && o.status !== "suspended";
              const body = (
                <>
                  <OrgLogo logoUrl={o.logoUrl}>
                    <MemberAvatar name={o.name} />
                  </OrgLogo>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{o.name}</span>
                    <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      {role(o.role)}
                      {o.membershipStatus === "pending" ? <StatusBadge status="pending" /> : o.status !== "active" ? <StatusBadge status={o.status} /> : null}
                    </span>
                    {!open && (
                      <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        {o.membershipStatus === "pending" ? t("onb.waiting") : t("onb.orgStatus", { status: t(`status.${o.status}` as Key) })}
                      </span>
                    )}
                  </span>
                  {open && <ChevronRight className="size-5 shrink-0 text-muted-foreground" />}
                </>
              );
              return (
                <li key={o.id}>
                  {open ? (
                    <Link href={`/org/${o.id}`} className="flex items-center gap-3 rounded-2xl bg-card p-3.5 shadow-card ring-1 ring-foreground/[0.06] transition-colors hover:bg-muted/50 active:scale-[0.99]">
                      {body}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 rounded-2xl bg-card/70 p-3.5 ring-1 ring-foreground/[0.06]">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        invitations.length === 0 && (
          <section className="flex items-start gap-3 rounded-2xl bg-card p-4 shadow-card ring-1 ring-foreground/[0.06]">
            <IconChip tone="violet">
              <Sparkles />
            </IconChip>
            <div>
              <p className="font-semibold">{t("onb.noneYet")}</p>
              <p className="text-sm text-muted-foreground">{t("onb.noneYetDesc")}</p>
            </div>
          </section>
        )
      )}

      <OnboardingActions defaultTab={sp.new === "1" ? "create" : "join"} defaultCode={typeof sp.code === "string" ? sp.code.slice(0, 12) : undefined} focusJoin={sp.join === "1" || typeof sp.code === "string"} />
    </div>
  );
}
