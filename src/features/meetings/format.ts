import { intlLocale, type Lang } from "@/i18n/core";

export interface Meeting {
  _id: string;
  /** ISO date at UTC midnight */
  date: string;
  /** "HH:mm" */
  time: string;
  place: string;
  events?: string;
  status: "scheduled" | "cancelled";
  cancelReason?: string;
}

/** "Sunday, 15 November 2026" */
export function meetingDate(lang: Lang, iso: string) {
  return new Intl.DateTimeFormat(intlLocale(lang), { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC", numberingSystem: "latn" }).format(new Date(iso));
}

/** "6:30 pm" */
export function meetingTime(lang: Lang, hhmm: string) {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!m) return hhmm;
  return new Intl.DateTimeFormat(intlLocale(lang), { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC", numberingSystem: "latn" }).format(new Date(Date.UTC(2000, 0, 1, Number(m[1]), Number(m[2]))));
}

export const mapLink = (place: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`;
