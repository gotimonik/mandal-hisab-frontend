import type { ReactNode } from "react";
import { KeyRound, LogOut, MailWarning, UserRound } from "lucide-react";
import { api } from "@/lib/server/api";
import type { Me } from "@/lib/types";
import { PageHeader } from "@/components/app/page-header";
import { IconChip, MemberAvatar, SectionTitle } from "@/components/app/bits";
import { ProfileForm, PasswordForm } from "@/features/account/account-forms";
import { ActionButton } from "@/components/app/action-button";
import { PhoneSettings } from "@/features/account/phone-settings";
import { PushSetting } from "@/features/account/push-setting";
import { cn } from "@/lib/utils";
import { getT } from "@/i18n/server";
import type { Tone } from "@/lib/tones";

export const metadata = { title: "Account" };

/** A settings card: coloured icon chip · title + description, then its controls. */
function Block({ tone, icon, title, description, children, className }: { tone: Tone; icon: ReactNode; title: string; description?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl bg-card p-4 shadow-card ring-1 ring-foreground/[0.06] sm:p-5", className)}>
      <div className="mb-3 flex items-start gap-3">
        <IconChip tone={tone}>{icon}</IconChip>
        <div className="min-w-0">
          <h2 className="font-semibold">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export default async function AccountPage() {
  const me = await api<Me>("/auth/me");
  const { t } = await getT();
  return (
    <>
      <PageHeader title={t("setx.acc.title")} description={t("setx.acc.desc")} />

      <section className="bg-hero relative mb-5 flex items-center gap-4 overflow-hidden rounded-3xl p-5 text-white shadow-lg shadow-primary/20 sm:p-6">
        <div className="pointer-events-none absolute -top-12 -right-10 size-40 rounded-full bg-white/10" />
        <MemberAvatar name={me.user.name} className="relative size-14 bg-white/20 text-lg text-white dark:bg-white/20 dark:text-white" />
        <div className="relative min-w-0">
          <p className="truncate text-xl font-extrabold tracking-tight sm:text-2xl">{me.user.name}</p>
          <p className="truncate text-sm text-white/85">{me.user.email}</p>
          {me.user.phone && <p className="truncate text-xs text-white/75">{me.user.phone}</p>}
        </div>
      </section>

      {!me.user.emailVerified && (
        <div className="mb-4 flex flex-col gap-3 rounded-2xl bg-amber-500/10 p-3.5 text-sm ring-1 ring-amber-500/30 sm:flex-row sm:items-center">
          <IconChip tone="amber" size="sm">
            <MailWarning />
          </IconChip>
          <p className="min-w-0 flex-1">
            <b>{t("setx.acc.unverified")}</b>
            <span className="block text-xs text-muted-foreground">{t("setx.acc.unverifiedHint")}</span>
          </p>
          <ActionButton path="/auth/resend-verification" successMessage={t("setx.acc.verifySent")}>
            {t("setx.acc.resend")}
          </ActionButton>
        </div>
      )}

      <SectionTitle>{t("setx.acc.notifications")}</SectionTitle>
      <PushSetting initialOn={me.user.pushEnabled !== false} className="mb-5" />

      {/* app only: Face ID / fingerprint lock for this phone */}
      <PhoneSettings />

      <SectionTitle>{t("setx.acc.profileSecurity")}</SectionTitle>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Block tone="sky" icon={<UserRound />} title={t("setx.acc.profile")} description={t("setx.acc.profileDesc")}>
          <ProfileForm name={me.user.name} phone={me.user.phone ?? ""} />
        </Block>
        <Block tone="violet" icon={<KeyRound />} title={t("setx.acc.password")} description={t("setx.acc.passwordDesc")}>
          <PasswordForm />
        </Block>
        <Block tone="rose" icon={<LogOut />} title={t("setx.acc.sessions")} description={t("setx.acc.sessionsDesc")} className="ring-rose-500/20">
          <ActionButton path="/auth/logout-all" redirectTo="/login" successMessage={t("setx.acc.signedOutAll")} confirm={{ title: t("setx.acc.signOutAllQ"), destructive: true, confirmLabel: t("setx.acc.signOutAll") }}>
            {t("setx.acc.signOutAllBtn")}
          </ActionButton>
        </Block>
      </div>
    </>
  );
}
