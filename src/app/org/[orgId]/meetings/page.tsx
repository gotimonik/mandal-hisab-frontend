import { CalendarCheck } from "lucide-react";
import { api } from "@/lib/server/api";
import { getOrg } from "@/lib/server/data";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { SectionTitle } from "@/components/app/bits";
import { ActionButton } from "@/components/app/action-button";
import { todayISO } from "@/lib/format";
import { getT } from "@/i18n/server";
import { MeetingDialog } from "@/features/meetings/meeting-dialog";
import { MeetingCard } from "@/features/meetings/meeting-card";
import type { Meeting } from "@/features/meetings/format";

export const metadata = { title: "Meetings" };

export default async function MeetingsPage({ params, searchParams }: PageProps<"/org/[orgId]/meetings">) {
  const { orgId } = await params;
  const sp = await searchParams;
  const [org, data, { t: tr, lang }] = await Promise.all([getOrg(orgId), api<{ upcoming: Meeting[]; past: Meeting[]; defaultPlace: string; canManage: boolean }>(`/orgs/${orgId}/meetings`), getT()]);
  const canManage = data.canManage && org.status !== "archived";
  const today = todayISO(org.settings.timezone);

  return (
    <>
      <PageHeader
        title={tr("meetings.title")}
        description={tr("meetings.desc")}
        actions={canManage ? <MeetingDialog defaultPlace={data.defaultPlace} timezone={org.settings.timezone} defaultOpen={sp.new === "1"} /> : null}
      />
      <section aria-label={tr("meetings.upcoming")}>
        <SectionTitle>{tr("meetings.upcoming")}</SectionTitle>
        {data.upcoming.length === 0 ? (
          <EmptyState icon={<CalendarCheck />} title={tr("meetings.none")} description={canManage ? tr("meetings.noneAdmin") : tr("meetings.noneMember")} />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {data.upcoming.map((m) => (
              <MeetingCard
                key={m._id}
                m={m}
                lang={lang}
                tr={tr}
                today={today}
                actions={
                  canManage && m.status === "scheduled" ? (
                    <ActionButton
                      path={`/orgs/${orgId}/meetings/${m._id}/cancel`}
                      size="xs"
                      variant="ghost"
                      successMessage={tr("meetings.cancelledToast")}
                      confirm={{ title: tr("meetings.cancelTitle"), description: tr("meetings.cancelDesc"), reason: "optional", reasonLabel: tr("meetings.cancelReason"), destructive: true, confirmLabel: tr("meetings.cancel") }}
                    >
                      {tr("meetings.cancel")}
                    </ActionButton>
                  ) : null
                }
              />
            ))}
          </div>
        )}
      </section>
      {data.past.length > 0 && (
        <section className="mt-6" aria-label={tr("meetings.past")}>
          <SectionTitle>{tr("meetings.past")}</SectionTitle>
          <div className="grid gap-3 md:grid-cols-2">
            {data.past.map((m) => (
              <MeetingCard key={m._id} m={m} lang={lang} tr={tr} className="opacity-80" />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
