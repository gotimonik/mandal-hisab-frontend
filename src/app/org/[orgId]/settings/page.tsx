import type { ReactNode } from "react";
import Link from "next/link";
import { CalendarClock, CalendarDays, DatabaseBackup, History, KeyRound, Lock, RotateCcw, UserCog } from "lucide-react";
import { getAccounts, getMe, getOrg, getMoney } from "@/lib/server/data";
import { api } from "@/lib/server/api";
import { ExportCsvButton } from "@/components/app/export-csv-button";
import { PageHeader } from "@/components/app/page-header";
import { SummaryBand } from "@/components/app/summary-band";
import { IconChip, SectionTitle } from "@/components/app/bits";
import { SettingsForm } from "@/features/settings/settings-form";
import { ChangeHaptaDialog, HaptaSetupForm } from "@/features/monthly/hapta-setup";
import { ChangeStartDialog } from "@/features/monthly/change-start-dialog";
import { formatDate, paiseToRupeeInput } from "@/lib/format";
import { requestMonth } from "@/lib/server/today";
import { buttonVariants } from "@/components/ui/button";
import { EndMonthForm } from "@/features/settlement/end-month-form";
import { MoneyResetDialog } from "@/features/settings/money-reset-dialog";
import { AddMeAsMemberDialog, ManageOnlyDialog } from "@/features/settings/manage-only-dialog";
import { SettingsPanel, SettingsTabs } from "@/features/settings/settings-tabs";
import { PushSetting } from "@/features/account/push-setting";
import { isSettingsTab, type SettingsTab } from "@/features/settings/settings-tab-ids";
import { cn } from "@/lib/utils";
import { getT } from "@/i18n/server";
import { monthName } from "@/i18n/core";
import type { Tone } from "@/lib/tones";

export const metadata = { title: "Settings" };

const monthAfter = (month: string) => {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 7);
};

/** A settings block: coloured icon chip · title + description, then its controls. */
function SettingBlock({ tone, icon, title, description, children, className }: { tone: Tone; icon: ReactNode; title: string; description: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("mb-4 rounded-2xl bg-card p-4 shadow-card ring-1 ring-foreground/[0.06] sm:p-5", className)}>
      <div className="mb-3 flex items-start gap-3">
        <IconChip tone={tone}>{icon}</IconChip>
        <div className="min-w-0">
          <h2 className="font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export default async function SettingsPage({ params, searchParams }: PageProps<"/org/[orgId]/settings">) {
  const { orgId } = await params;
  const { t, lang } = await getT();
  const wanted = (await searchParams).tab;
  const money = await getMoney(orgId);
  const org = await getOrg(orgId);
  const me = await getMe();
  const role = org.myRole === "admin" ? t("setp.roleAdmin") : t("setp.roleManager");
  const h = org.settings.monthlyHapta;
  const thisMonth = await requestMonth();
  const settlement = org.settings.settlement;
  const backup = await api<{ lastBackupAt: string | null; lastBackupBy: string | null; due: boolean }>(`/orgs/${orgId}/backup/status`).catch(() => null);
  const backupDue = backup?.due ?? true;
  // the section to open: ?tab=… (kept in the address), else Hapta
  const tab: SettingsTab = isSettingsTab(wanted) ? wanted : "hapta";
  // the Mandal's UPI accounts, to choose which one members pay into
  const upiAccounts = (await getAccounts(orgId).catch(() => [])).filter((a) => a.type === "upi" && a.isActive && a.upiId).map((a) => ({ _id: a._id, name: a.name, upiId: a.upiId! }));
  return (
    <div className="max-w-3xl">
      <PageHeader title={t("setp.title")} description={org.name} />
      <SummaryBand
        icon={<KeyRound />}
        label={t("setp.joinCode")}
        value={<span className="font-mono tracking-widest">{org.code}</span>}
        sub={t("setp.joinCodeSub")}
        stats={[
          { label: t("setp.monthlyHapta"), value: h ? money.fmt(h.amountPaise) : t("setp.notSet") },
          { label: t("setp.runsUntil"), value: org.settings.endMonth ? monthName(lang, org.settings.endMonth) : t("setp.noEndDate") },
        ]}
      />

      <SettingsTabs initial={tab} alerts={{ data: backupDue, hapta: !h }}>
        <SettingsPanel tab="hapta">
          <SettingBlock tone="indigo" icon={<CalendarDays />} title={t("setp.monthlyHapta")} description={h ? t("setp.haptaFuture") : t("setp.haptaSetDesc")}>
            {h ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-indigo-500/6 px-3.5 py-3">
                <p className="text-sm">
                  <span className="text-lg font-bold tabular-nums">{money.fmt(h.amountPaise)}</span> {t("setp.perMemberMonth")}
                  <span className="block text-xs text-muted-foreground">
                    {t("setp.dueSince", { day: h.dueDay, date: formatDate(h.startDate) })}
                  </span>
                </p>
                {org.status === "active" && (
                  <span className="flex flex-wrap gap-2">
                    <ChangeStartDialog orgId={orgId} currentMonth={new Date(h.startDate).toISOString().slice(0, 7)} />
                    <ChangeHaptaDialog currentRupees={paiseToRupeeInput(h.amountPaise)} nextMonth={monthAfter(thisMonth)} />
                  </span>
                )}
              </div>
            ) : (
              <HaptaSetupForm inline />
            )}
          </SettingBlock>
          <SettingBlock tone="violet" icon={<CalendarClock />} title={t("setp.durationTitle")} description={org.settings.endMonth ? t("setp.until", { month: monthName(lang, org.settings.endMonth) }) : t("setp.noEndDateDot")}>
            {org.status === "active" && h ? (
              <EndMonthForm orgId={orgId} endMonth={org.settings.endMonth ?? null} startMonth={new Date(h.startDate).toISOString().slice(0, 7)} thisMonth={thisMonth} />
            ) : (
              <p className="text-sm text-muted-foreground">{h ? t("setp.notActive") : t("setp.setupHaptaFirst")}</p>
            )}
          </SettingBlock>
        </SettingsPanel>

        <SettingsPanel tab="team">
          {org.status === "active" && org.myRole !== "member" && (
            <>
              <SettingBlock
                tone="amber"
                icon={<UserCog />}
                title={org.myMemberId ? t("setp.managerAndMember") : t("setp.onlyManaging")}
                description={org.myMemberId ? t("setp.youBoth", { role }) : t("setp.youOnly", { role })}
              >
                {org.myMemberId ? (
                  <ManageOnlyDialog orgId={orgId} />
                ) : org.myPermissions.includes("memberships.manage") ? (
                  <AddMeAsMemberDialog orgId={orgId} hasMonthlyHapta={!!h} thisMonth={thisMonth} />
                ) : null}
              </SettingBlock>
            </>
          )}
        </SettingsPanel>

        <SettingsPanel tab="notifications">
          <PushSetting initialOn={me.user.pushEnabled !== false} />
          <p className="mt-2 px-1 text-xs text-muted-foreground">
            {t("setp.pushNote")}
          </p>
        </SettingsPanel>

        <SettingsPanel tab="data">
          <SettingBlock
            tone="emerald"
            icon={<DatabaseBackup />}
            title={t("setp.backupTitle")}
            description={t("setp.backupDesc")}
          >
            <div className={cn("flex flex-wrap items-center justify-between gap-3 rounded-xl px-3.5 py-3", backupDue ? "bg-amber-500/10 ring-1 ring-amber-500/25" : "bg-emerald-500/8")}>
              <p className="text-sm">
                {backup?.lastBackupAt ? (
                  <>
                    {t("setp.lastBackup")} <b>{formatDate(backup.lastBackupAt)}</b>
                    {backup.lastBackupBy ? t("setp.byName", { name: backup.lastBackupBy }) : ""}
                  </>
                ) : (
                  <b>{t("setp.noBackup")}</b>
                )}
                <span className="block text-xs text-muted-foreground">{t("setp.backupEvery")}</span>
              </p>
              <ExportCsvButton href={`/api/backup?orgId=${orgId}`} className="h-10" refreshAfter>
                <DatabaseBackup /> {t("setp.downloadBackup")}
              </ExportCsvButton>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {t("setp.backupPrivate")}
            </p>
          </SettingBlock>
          <SettingBlock
            tone="sky"
            icon={<History />}
            title={t("setp.importTitle")}
            description={
              org.settings.openingImport
                ? t("setp.importDone", { cutover: formatDate(org.settings.openingImport.cutoverDate), at: formatDate(org.settings.openingImport.at) })
                : t("setp.importDesc")
            }
          >
            <Link href={`/org/${orgId}/settings/import`} className={buttonVariants({ variant: "outline" })}>
              {org.settings.openingImport ? t("setp.importView") : t("setp.importStart")}
            </Link>
          </SettingBlock>

          <SectionTitle className="mt-6">{t("setp.careful")}</SectionTitle>
          {org.status === "active" && !settlement && org.myPermissions.includes("org.settings.manage") && (
            <SettingBlock
              tone="rose"
              icon={<RotateCcw />}
              title={t("setp.resetTitle")}
              description={t("setp.resetDesc", { cur: money.symbol })}
              className="ring-rose-500/20"
            >
              <MoneyResetDialog orgId={orgId} orgName={org.name} />
            </SettingBlock>
          )}
          <SettingBlock
            tone="rose"
            icon={<Lock />}
            title={t("setp.closeTitle")}
            description={t("setp.closeDesc")}
            className="ring-rose-500/20"
          >
            <Link href={`/org/${orgId}/settings/close`} className={buttonVariants({ variant: settlement && !settlement.closedAt ? "default" : "outline" })}>
              {settlement?.closedAt ? t("setp.viewSettlement") : settlement ? t("setp.continueClosing") : t("setp.closeStart")}
            </Link>
          </SettingBlock>
        </SettingsPanel>

        <SettingsForm org={org} upiAccounts={upiAccounts} />
      </SettingsTabs>
    </div>
  );
}
