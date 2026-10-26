import { getOrg, getMoney } from "@/lib/server/data";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "@/features/settings/settings-form";
import { ChangeHaptaDialog, HaptaSetupForm } from "@/features/monthly/hapta-setup";
import { formatDate, paiseToRupeeInput } from "@/lib/format";
import { requestMonth } from "@/lib/server/today";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { monthLabelYM } from "@/lib/months";
import { EndMonthForm } from "@/features/settlement/end-month-form";

export const metadata = { title: "Settings" };

const monthAfter = (month: string) => {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 7);
};

export default async function SettingsPage({ params }: PageProps<"/org/[orgId]/settings">) {
  const { orgId } = await params;
  const money = await getMoney(orgId);
  const org = await getOrg(orgId);
  const h = org.settings.monthlyHapta;
  const thisMonth = await requestMonth();
  return (
    <div className="max-w-3xl">
      <PageHeader title="Mandal settings" description={`Join code ${org.code}`} />
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Monthly hapta</CardTitle>
          <CardDescription>{h ? "Changes apply to future months only." : "Set the amount each member pays every month."}</CardDescription>
        </CardHeader>
        <CardContent>
          {h ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm">
                <span className="text-lg font-semibold">{money.fmt(h.amountPaise)}</span> per member per month · due by day {h.dueDay} · since {formatDate(h.startDate)}
              </p>
              {org.status === "active" && <ChangeHaptaDialog currentRupees={paiseToRupeeInput(h.amountPaise)} nextMonth={monthAfter(thisMonth)} />}
            </div>
          ) : (
            <HaptaSetupForm inline />
          )}
        </CardContent>
      </Card>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>How long the Mandal runs</CardTitle>
          <CardDescription>{org.settings.endMonth ? `Until ${monthLabelYM(org.settings.endMonth)}.` : "No end date."}</CardDescription>
        </CardHeader>
        <CardContent>
          {org.status === "active" && h ? (
            <EndMonthForm orgId={orgId} endMonth={org.settings.endMonth ?? null} startMonth={new Date(h.startDate).toISOString().slice(0, 7)} thisMonth={thisMonth} />
          ) : (
            <p className="text-sm text-muted-foreground">{h ? "The Mandal isn't active." : "Set up the monthly hapta first."}</p>
          )}
        </CardContent>
      </Card>
      <Card className="mb-4 ring-rose-500/20">
        <CardHeader>
          <CardTitle>Close & settle the Mandal</CardTitle>
          <CardDescription>Share out the Mandal&apos;s money by hapta shares, pay every member, then close it. History is kept.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={`/org/${orgId}/settings/close`} className={buttonVariants({ variant: org.settings.settlement && !org.settings.settlement.closedAt ? "default" : "outline" })}>
            {org.settings.settlement?.closedAt ? "View settlement" : org.settings.settlement ? "Continue closing" : "Close & settle…"}
          </Link>
        </CardContent>
      </Card>
      <SettingsForm org={org} />
    </div>
  );
}
