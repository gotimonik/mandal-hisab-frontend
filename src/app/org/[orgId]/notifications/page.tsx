import Link from "next/link";
import { Bell } from "lucide-react";
import { api, qs } from "@/lib/server/api";
import type { Notification } from "@/lib/types";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ActionButton } from "@/components/app/action-button";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage({ params }: PageProps<"/org/[orgId]/notifications">) {
  const { orgId } = await params;
  const data = await api<{ items: Notification[]; unread: number }>(`/notifications${qs({ orgId })}`);
  return (
    <>
      <PageHeader
        title="Notifications"
        description={`${data.unread} unread`}
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
        <ul className="divide-y rounded-xl ring-1 ring-foreground/10">
          {data.items.map((n) => (
            <li key={n._id} className={cn("flex items-start justify-between gap-3 px-4 py-3", !n.readAt && "bg-primary/5")}>
              <div className="min-w-0">
                <p className={cn("text-sm", !n.readAt && "font-semibold")}>{n.title}</p>
                <p className="text-sm text-muted-foreground">{n.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(n.createdAt)}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                {n.link && (
                  <Link href={n.link} className="text-xs font-medium text-primary hover:underline">
                    Open
                  </Link>
                )}
                {!n.readAt && (
                  <ActionButton path="/notifications/read" body={{ ids: [n._id] }} size="xs" variant="ghost" successMessage="Marked as read">
                    Mark read
                  </ActionButton>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
