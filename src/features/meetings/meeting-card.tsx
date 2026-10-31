import Link from "next/link";
import { CalendarCheck, Clock, MapPin, Sparkles } from "lucide-react";
import { IconChip } from "@/components/app/bits";
import { cn } from "@/lib/utils";
import type { Lang, T } from "@/i18n/core";
import { mapLink, meetingDate, meetingTime, type Meeting } from "./format";

/** One meeting: date, time, place (with a map link) and what else is on that day. */
export function MeetingCard({ m, lang, tr, today, actions, className }: { m: Meeting; lang: Lang; tr: T; today?: string; actions?: React.ReactNode; className?: string }) {
  const cancelled = m.status === "cancelled";
  const isToday = !!today && m.date.slice(0, 10) === today;
  return (
    <article className={cn("rounded-2xl bg-card p-4 shadow-card ring-1 ring-foreground/[0.06]", isToday && !cancelled && "ring-2 ring-sky-400/50", cancelled && "opacity-70", className)}>
      <div className="flex items-start gap-3">
        <IconChip tone={cancelled ? "slate" : "sky"}>
          <CalendarCheck />
        </IconChip>
        <div className="min-w-0 flex-1">
          <p className={cn("font-semibold", cancelled && "line-through")}>
            {meetingDate(lang, m.date)}
            {isToday && !cancelled && <span className="ml-2 rounded-full bg-sky-500/15 px-2 py-0.5 text-xs font-semibold text-sky-700 dark:text-sky-300">{tr("meetings.today")}</span>}
            {cancelled && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground no-underline">{tr("meetings.cancelled")}</span>}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="size-3.5 shrink-0" /> {meetingTime(lang, m.time)}
          </p>
          <p className="mt-0.5 flex items-start gap-1.5 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 size-3.5 shrink-0" />
            <span className="min-w-0 break-words">
              {m.place}{" "}
              {!cancelled && (
                <Link href={mapLink(m.place)} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline-offset-2 hover:underline">
                  {tr("meetings.map")}
                </Link>
              )}
            </span>
          </p>
          {m.events && (
            <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-muted/60 px-2.5 py-1.5 text-sm">
              <Sparkles className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
              <span className="min-w-0 break-words whitespace-pre-line">
                <span className="font-medium">{tr("meetings.alsoThatDay")}:</span> {m.events}
              </span>
            </p>
          )}
          {cancelled && m.cancelReason && <p className="mt-2 text-xs text-muted-foreground">{m.cancelReason}</p>}
        </div>
      </div>
      {actions && <div className="mt-2 flex flex-wrap items-center justify-end gap-1 empty:hidden">{actions}</div>}
    </article>
  );
}
