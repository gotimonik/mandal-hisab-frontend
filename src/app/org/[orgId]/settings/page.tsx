import { getOrg } from "@/lib/server/data";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "@/features/settings/settings-form";
import { ChangeHaptaDialog, HaptaSetupForm } from "@/features/monthly/hapta-setup";
import { formatDate, formatINR, paiseToRupeeInput } from "@/lib/format";
import { requestMonth } from "@/lib/server/today";

export const metadata = { title: "Settings" };

const monthAfter = (month: string) => {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 7);
};

export default async function SettingsPage({ params }: PageProps<"/org/[orgId]/settings">) {
  const { orgId } = await params;
  const org = await getOrg(orgId);
  const h = org.settings.monthlyHapta;
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
                <span className="text-lg font-semibold">{formatINR(h.amountPaise)}</span> per member per month · due by day {h.dueDay} · since {formatDate(h.startDate)}
              </p>
              {org.status === "active" && <ChangeHaptaDialog currentRupees={paiseToRupeeInput(h.amountPaise)} nextMonth={monthAfter(await requestMonth())} />}
            </div>
          ) : (
            <HaptaSetupForm inline />
          )}
        </CardContent>
      </Card>
      <SettingsForm org={org} />
    </div>
  );
}
