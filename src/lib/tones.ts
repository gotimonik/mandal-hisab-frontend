/**
 * Colour per kind of money, used for icon chips, tiles and accents so each feature is
 * recognisable at a glance: hapta = indigo, upad = orange, withdrawals = rose,
 * cash = emerald, members = sky, interest/reports = violet.
 * Full class strings (not built dynamically) so Tailwind keeps them.
 */
export type Tone = "indigo" | "orange" | "amber" | "rose" | "emerald" | "sky" | "violet" | "pink" | "slate";

export const TONE_CHIP: Record<Tone, string> = {
  indigo: "bg-indigo-500/12 text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-300",
  orange: "bg-orange-500/12 text-orange-600 dark:bg-orange-400/15 dark:text-orange-300",
  amber: "bg-amber-500/15 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  rose: "bg-rose-500/12 text-rose-600 dark:bg-rose-400/15 dark:text-rose-300",
  emerald: "bg-emerald-500/12 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300",
  sky: "bg-sky-500/12 text-sky-600 dark:bg-sky-400/15 dark:text-sky-300",
  violet: "bg-violet-500/12 text-violet-600 dark:bg-violet-400/15 dark:text-violet-300",
  pink: "bg-pink-500/12 text-pink-600 dark:bg-pink-400/15 dark:text-pink-300",
  slate: "bg-slate-500/12 text-slate-600 dark:bg-slate-400/15 dark:text-slate-300",
};

export const TONE_SOLID: Record<Tone, string> = {
  indigo: "bg-indigo-500 text-white",
  orange: "bg-orange-500 text-white",
  amber: "bg-amber-500 text-white",
  rose: "bg-rose-500 text-white",
  emerald: "bg-emerald-500 text-white",
  sky: "bg-sky-500 text-white",
  violet: "bg-violet-500 text-white",
  pink: "bg-pink-500 text-white",
  slate: "bg-slate-500 text-white",
};

export const TONE_TEXT: Record<Tone, string> = {
  indigo: "text-indigo-600 dark:text-indigo-300",
  orange: "text-orange-600 dark:text-orange-300",
  amber: "text-amber-700 dark:text-amber-300",
  rose: "text-rose-600 dark:text-rose-300",
  emerald: "text-emerald-600 dark:text-emerald-300",
  sky: "text-sky-600 dark:text-sky-300",
  violet: "text-violet-600 dark:text-violet-300",
  pink: "text-pink-600 dark:text-pink-300",
  slate: "text-slate-600 dark:text-slate-300",
};

/** Stable colour for a person's avatar, from their name. */
const AVATAR: Tone[] = ["indigo", "orange", "emerald", "sky", "violet", "rose", "pink", "amber"];
export function avatarTone(name: string): Tone {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR[h % AVATAR.length];
}
export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts.at(-1)![0] : "")).toUpperCase() || "?";
}
