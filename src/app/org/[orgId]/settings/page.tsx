import type { ReactNode } from "react";
import Link from "next/link";
import { CalendarClock, CalendarDays, KeyRound, Lock } from "lucide-react";
import { getOrg, getMoney } from "@/lib/server/data";
import { PageHeader } from "@/components/app/page-header";
import { SummaryBand } from "@/components/app/summary-band";
import { IconChip, SectionTitle } from "@/components/app/bits";
import { SettingsForm } from "@/features/settings/settings-form";
import { ChangeHaptaDialog, HaptaSetupForm } from "@/features/monthly/hapta-setup";
import { formatDate, paiseToRupeeInput } from "@/lib/format";
import { requestMonth } from "@/lib/server/today";
import { buttonVariants } from "@/components/ui/button";
import { monthLabelYM } from "@/lib/months";
import { EndMonthForm } from "@/features/settlement/end-month-form";
import { cn } from "@/lib/utils";
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

export default async function SettingsPage({ params }: PageProps<"/org/[orgId]/settings">) {
  const { orgId } = await params;
  const money = await getMoney(orgId);
  const org = await getOrg(orgId);
  const h = org.settings.monthlyHapta;
  const thisMonth = await requestMonth();
  const settlement = org.settings.settlement;
  return (
    <div className="max-w-3xl">
      <PageHeader title="Mandal settings" description={org.name} />
      <SummaryBand
        icon={<KeyRound />}
        label="Join code"
        value={<span className="font-mono tracking-widest">{org.code}</span>}
        sub="Share this code so people can ask to join the Mandal."
        stats={[
          { label: "Monthly hapta", value: h ? money.fmt(h.amountPaise) : "Not set" },
          { label: "Runs until", value: org.settings.endMonth ? monthLabelYM(org.settings.endMonth) : "No end date" },
        ]}
      />

      <SectionTitle>Hapta & duration</SectionTitle>
      <SettingBlock tone="indigo" icon={<CalendarDays />} title="Monthly hapta" description={h ? "Changes apply to future months only." : "Set the amount each member pays every month."}>
        {h ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-indigo-500/6 px-3.5 py-3">
            <p className="text-sm">
              <span className="text-lg font-bold tabular-nums">{money.fmt(h.amountPaise)}</span> per member per month
              <span className="block text-xs text-muted-foreground">
                Due by day {h.dueDay} · since {formatDate(h.startDate)}
              </span>
            </p>
            {org.status === "active" && <ChangeHaptaDialog currentRupees={paiseToRupeeInput(h.amountPaise)} nextMonth={monthAfter(thisMonth)} />}
          </div>
        ) : (
          <HaptaSetupForm inline />
        )}
      </SettingBlock>
      <SettingBlock tone="violet" icon={<CalendarClock />} title="How long the Mandal runs" description={org.settings.endMonth ? `Until ${monthLabelYM(org.settings.endMonth)}.` : "No end date."}>
        {org.status === "active" && h ? (
          <EndMonthForm orgId={orgId} endMonth={org.settings.endMonth ?? null} startMonth={new Date(h.startDate).toISOString().slice(0, 7)} thisMonth={thisMonth} />
        ) : (
          <p className="text-sm text-muted-foreground">{h ? "The Mandal isn't active." : "Set up the monthly hapta first."}</p>
        )}
      </SettingBlock>
      <SettingBlock
        tone="rose"
        icon={<Lock />}
        title="Close & settle the Mandal"
        description="Share out the Mandal's money by hapta shares, pay every member, then close it. History is kept."
        className="ring-rose-500/20"
      >
        <Link href={`/org/${orgId}/settings/close`} className={buttonVariants({ variant: settlement && !settlement.closedAt ? "default" : "outline" })}>
          {settlement?.closedAt ? "View settlement" : settlement ? "Continue closing" : "Close & settle…"}
        </Link>
      </SettingBlock>

      <SectionTitle className="mt-6">Mandal details & rules</SectionTitle>
      <SettingsForm org={org} />
    </div>
  );
}
