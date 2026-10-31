import Link from "next/link";
import { CalendarCheck, ChevronRight, MapPin } from "lucide-react";
import { IconChip } from "@/components/app/bits";
import { getT } from "@/i18n/server";
import { meetingDate, meetingTime, type Meeting } from "./format";

/** Dashboard banner for the next Mandal meeting (nothing when none is planned). */
export async function NextMeeting({ orgId, meeting }: { orgId: string; meeting: Meeting | null | undefined }) {
  if (!meeting) return null;
  const { t: tr, lang } = await getT();
  return (
    <Link href={`/org/${orgId}/meetings`} className="mb-3 flex items-center gap-3 rounded-2xl bg-card p-3.5 shadow-card ring-2 ring-sky-400/30">
      <IconChip tone="sky">
        <CalendarCheck />
      </IconChip>
      <span className="min-w-0 flex-1 text-sm">
        <span className="block text-xs font-medium text-muted-foreground">{tr("meetings.next")}</span>
        <span className="block font-semibold">
          {meetingDate(lang, meeting.date)} · {meetingTime(lang, meeting.time)}
        </span>
        <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
          <MapPin className="size-3 shrink-0" />
          <span className="truncate">{meeting.place}</span>
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
