import type { Guide, GuideBlock, GuideCategory, GuideCategoryId } from "./types";
import { START_GUIDES } from "./content/start";
import { EVERYDAY_GUIDES } from "./content/everyday";
import { LEARN_GUIDES } from "./content/learn";

export type { Guide, GuideBlock, GuideCategory, GuideCategoryId } from "./types";

export const GUIDE_CATEGORIES: GuideCategory[] = [
  { id: "start", title: "Getting started", description: "Create your Mandal, set the hapta and add members.", tone: "indigo" },
  { id: "everyday", title: "Everyday hisab", description: "Collect hapta, pay out savings and run the monthly meeting.", tone: "emerald" },
  { id: "upad", title: "Upad & interest", description: "Lend from the fund, collect interest and share it with members.", tone: "orange" },
  { id: "members", title: "Members & access", description: "Roles, join codes, invitations and the member's own view.", tone: "sky" },
  { id: "books", title: "Cash book & reports", description: "Other income and expenses, donations and every report.", tone: "violet" },
  { id: "closing", title: "Closing a Mandal", description: "Share out the money and settle with every member.", tone: "rose" },
  { id: "learn", title: "Learn", description: "How Mandals work, interest explained and good practice.", tone: "amber" },
];

export const GUIDES: Guide[] = [...START_GUIDES, ...EVERYDAY_GUIDES, ...LEARN_GUIDES];

export const getGuide = (slug: string) => GUIDES.find((g) => g.slug === slug);
export const guidesIn = (cat: GuideCategoryId) => GUIDES.filter((g) => g.category === cat);
export const categoryOf = (g: Guide) => GUIDE_CATEGORIES.find((c) => c.id === g.category)!;

/** Strip **bold** and [text](href) markup to plain text. */
export const plain = (s: string) => s.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\[(.+?)\]\((.+?)\)/g, "$1");

/** Anchor id for a heading. */
export const slugify = (s: string) =>
  plain(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function blockText(b: GuideBlock): string {
  switch (b.type) {
    case "p":
    case "h2":
    case "h3":
      return b.text;
    case "list":
      return b.items.join(" ");
    case "steps":
      return b.items.map((i) => `${i.title} ${i.text}`).join(" ");
    case "tip":
      return `${b.title} ${b.text}`;
    case "table":
      return [...b.head, ...b.rows.flat(), b.caption ?? ""].join(" ");
  }
}

export const wordCount = (g: Guide) => g.body.map(blockText).join(" ").split(/\s+/).filter(Boolean).length;
/** Reading time at ~200 words a minute. */
export const readMinutes = (g: Guide) => Math.max(2, Math.round(wordCount(g) / 200));
