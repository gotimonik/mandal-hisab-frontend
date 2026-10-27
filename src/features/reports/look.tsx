import { BookOpen, CalendarRange, ChartPie, FileBarChart, HandCoins, Landmark, Percent, Scale, Sparkles, TriangleAlert, Wallet, Waves } from "lucide-react";
import type { Tone } from "@/lib/tones";

/** Colour + icon per report so lists and headers are easy to scan (money kinds keep their usual colours). */
const LOOK: Record<string, { tone: Tone; icon: React.ReactNode }> = {
  collections: { tone: "emerald", icon: <HandCoins /> },
  hapta: { tone: "indigo", icon: <CalendarRange /> },
  overdue: { tone: "rose", icon: <TriangleAlert /> },
  donations: { tone: "pink", icon: <Sparkles /> },
  events: { tone: "violet", icon: <Sparkles /> },
  loans: { tone: "orange", icon: <Landmark /> },
  interest: { tone: "violet", icon: <Percent /> },
  "income-expense": { tone: "violet", icon: <ChartPie /> },
  "cash-flow": { tone: "sky", icon: <Waves /> },
  "account-summary": { tone: "emerald", icon: <Wallet /> },
  "trial-balance": { tone: "slate", icon: <Scale /> },
  "balance-sheet": { tone: "slate", icon: <BookOpen /> },
};

export const reportLook = (kind: string) => LOOK[kind] ?? { tone: "violet" as Tone, icon: <FileBarChart /> };
