"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Loader2 } from "lucide-react";
import { apiMutate } from "@/app/actions/api";

/**
 * "Open" on a notification. An unread one is marked as read first, so the bell count
 * is already right on the page it opens. If marking fails we still open the link.
 */
export function OpenNotificationLink({ id, href, unread }: { id: string; href: string; unread: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Link
      href={href}
      aria-busy={pending || undefined}
      onClick={(e) => {
        // Let ctrl/cmd-click, middle-click etc. behave like a normal link.
        if (!unread || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        start(async () => {
          await apiMutate({ path: "/notifications/read", body: { ids: [id] } }).catch(() => null);
          router.push(href);
        });
      }}
      className="flex items-center gap-0.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/15"
    >
      Open {pending ? <Loader2 className="size-3.5 animate-spin" /> : <ChevronRight className="size-3.5" />}
    </Link>
  );
}
