import type { Tone } from "@/lib/tones";

/**
 * Content blocks for a guide. Text may use **bold** and [link text](/path) — nothing else.
 * Kept as data (not JSX) so the same text feeds the page, the table of contents and the
 * structured data for search engines.
 */
export type GuideBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "list"; items: string[] }
  | { type: "steps"; items: { title: string; text: string }[] }
  | { type: "tip"; tone?: "tip" | "note" | "warn"; title: string; text: string }
  | { type: "table"; head: string[]; rows: string[][]; caption?: string };

export type GuideCategoryId = "start" | "everyday" | "upad" | "members" | "books" | "closing" | "learn";

export type GuideCategory = { id: GuideCategoryId; title: string; description: string; tone: Tone };

export type Guide = {
  slug: string;
  title: string;
  /** One or two sentences: meta description and card text. */
  description: string;
  category: GuideCategoryId;
  /** "howto" guides walk through the app; "article" ones explain an idea. */
  kind: "howto" | "article";
  /** Who it's mainly for, shown on the card. */
  audience: "Admins & treasurers" | "Members" | "Everyone";
  updated: string; // ISO date
  body: GuideBlock[];
  related?: string[];
};
