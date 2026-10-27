import { Bell, CalendarClock, HandCoins, Landmark, Lock, Percent, Receipt, UserPlus, Wallet } from "lucide-react";
import { api, qs } from "@/lib/server/api";
import type { Notification } from "@/lib/types";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ActionButton } from "@/components/app/action-button";
import { CountPill, IconChip } from "@/components/app/bits";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { OpenNotificationLink } from "@/features/notifications/open-link";
import type { Tone } from "@/lib/tones";

export const metadata = { title: "Notifications" };

/** Icon and colour by what the notification is about (prefix of its type, e.g. "payment.verified"). */
const LOOK: Record<string, { tone: Tone; icon: React.ReactNode }> = {
  payment: { tone: "emerald", icon: <HandCoins /> },
  installment: { tone: "indigo", icon: <CalendarClock /> },
  scheme: { tone: "indigo", icon: <CalendarClock /> },
  expense: { tone: "pink", icon: <Receipt /> },
  loan: { tone: "violet", icon: <Landmark /> },
  interest: { tone: "violet", icon: <Percent /> },
  withdrawal: { tone: "rose", icon: <Wallet /> },
  membership: { tone: "sky", icon: <UserPlus /> },
  settlement: { tone: "amber", icon: <Lock /> },
};
const look = (type: string) => LOOK[type.split(".")[0]] ?? { tone: "slate" as Tone, icon: <Bell /> };

export default async function NotificationsPage({ params }: PageProps<"/org/[orgId]/notifications">) {
  const { orgId } = await params;
  const data = await api<{ items: Notification[]; unread: number }>(`/notifications${qs({ orgId })}`);
  return (
    <>
      <PageHeader
        title="Notifications"
        description={
          data.unread > 0 ? (
            <span className="inline-flex items-center gap-1.5">
              <CountPill n={data.unread} tone="indigo" /> unread
            </span>
          ) : (
            "Nothing unread"
          )
        }
        actions={
          data.unread > 0 ? (
            <ActionButton path="/notifications/read" body={{ ids: "all" }} successMessage="All marked as read">
              Mark all read
            </ActionButton>
          ) : null
        }
      />
      {data.items.length === 0 ? (
        <EmptyState icon={<Bell />} title="You're all caught up" description="Due-date reminders, payment confirmations and approvals appear here." />
      ) : (
        <ul className="flex flex-col gap-2" aria-label="Notifications">
          {data.items.map((n) => {
            const lk = look(n.type);
            const unread = !n.readAt;
            return (
              <li key={n._id} className={cn("rounded-2xl bg-card p-3.5 shadow-card ring-1 ring-foreground/[0.06]", unread && "bg-primary/[0.04] ring-2 ring-primary/25")}>
                <div className="flex items-start gap-3">
                  <span className="relative">
                    <IconChip tone={lk.tone}>{lk.icon}</IconChip>
                    {unread && <span aria-label="Unread" className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-primary ring-2 ring-card" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm", unread ? "font-bold" : "font-semibold text-foreground/85")}>{n.title}</p>
                    <p className="text-sm text-muted-foreground">{n.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(n.createdAt)}</p>
                  </div>
                </div>
                {(n.link || unread) && (
                  <div className="mt-2 flex items-center justify-end gap-1">
                    {unread && (
                      <ActionButton path="/notifications/read" body={{ ids: [n._id] }} size="xs" variant="ghost" successMessage="Marked as read">
                        Mark read
                      </ActionButton>
                    )}
                    {n.link && (
                      <OpenNotificationLink id={n._id} href={n.link} unread={unread} />
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
