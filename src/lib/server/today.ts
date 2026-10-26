import "server-only";
import { connection } from "next/server";
import { todayISO } from "@/lib/format";

/**
 * Today's date (YYYY-MM-DD, Indian time) read at request time.
 * With Cache Components, reading the clock during prerender is an error
 * (next.js.org/docs/messages/blocking-prerender-current-time); `connection()`
 * defers it to the request. Pages calling this stream behind their loading.tsx.
 */
export async function requestToday(timeZone?: string): Promise<string> {
  await connection();
  return todayISO(timeZone);
}

export async function requestMonth(): Promise<string> {
  return (await requestToday()).slice(0, 7);
}
