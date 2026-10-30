import Link from "next/link";
import { ArrowRight, CalendarCheck2, CalendarDays, Flag, HandCoins, PiggyBank, Settings2, UserPlus, Users } from "lucide-react";
import { IconChip } from "@/components/app/bits";
import type { Tone } from "@/lib/tones";
import { PageHero, Section, SectionHeading } from "@/features/public/blocks";
import { CtaBand } from "@/features/public/cta-band";
import { JsonLd } from "@/features/public/json-ld";
import { NativeRedirect } from "@/features/public/native-redirect";
import { absUrl, breadcrumbLd, pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "How it works",
  description: "How MandalHisab works from start to finish: register your Mandal, add members, collect hapta, give upad, share interest, report to members and settle at the end.",
  path: "/how-it-works",
});

type Stage = { tone: Tone; icon: React.ReactNode; title: string; when: string; text: string; points: string[]; guide: { href: string; label: string } };

const STAGES: Stage[] = [
  {
    tone: "indigo",
    icon: <Settings2 />,
    title: "Register your Mandal",
    when: "Day 1 · about 5 minutes",
    text: "Create a free account, choose New Mandal, and enter its name, the monthly hapta, the month it starts and how long it will run. You become its first admin.",
    points: ["Hapta amount and due-by day", "Currency and financial year", "Optional: place, contact, registration number, logo"],
    guide: { href: "/guides/start-a-new-mandal", label: "Start a new Mandal" },
  },
  {
    tone: "sky",
    icon: <UserPlus />,
    title: "Add your members",
    when: "Day 1 · 10–30 minutes",
    text: "Add members one by one or import them from a spreadsheet. If the Mandal has been running on paper, enter each member's opening balance so their passbook starts from the right amount.",
    points: ["Auto-numbered or your own membership numbers", "Haptas per month for families paying more than one", "Opening balances as audited adjustments"],
    guide: { href: "/guides/add-and-import-members", label: "Add and import members" },
  },
  {
    tone: "emerald",
    icon: <CalendarDays />,
    title: "Collect hapta every month",
    when: "Every meeting",
    text: "Open Monthly hapta, filter to To collect, and tap Collect next to each member as they pay. Part payments are allowed, earlier dues carry forward and every payment gets a receipt.",
    points: ["Collected vs expected for the month", "Oldest unpaid month cleared first", "Payments reported by members verified by the admin"],
    guide: { href: "/guides/collect-hapta-at-the-monthly-meeting", label: "Collect hapta" },
  },
  {
    tone: "orange",
    icon: <HandCoins />,
    title: "Give upad and collect interest",
    when: "Whenever a member needs it",
    text: "Lend from the Mandal's cash at a monthly rate. Interest is due every month on what's outstanding and is shared with every member in proportion to their savings when it's received.",
    points: ["Upad requests from members, approved by the admin", "Unpaid interest carried forward", "Part repayments lower next month's interest"],
    guide: { href: "/guides/give-upad-and-collect-interest", label: "Give upad" },
  },
  {
    tone: "violet",
    icon: <PiggyBank />,
    title: "Share earnings and pay out savings",
    when: "Monthly or as needed",
    text: "Credit monthly interest to savings by a rate or by amounts you enter, with a preview first. Pay members from their savings with a withdrawal voucher.",
    points: ["Interest credit with preview", "Withdrawals checked against the available balance", "Reversals with a reason for any mistake"],
    guide: { href: "/guides/credit-interest-to-members", label: "Credit interest" },
  },
  {
    tone: "slate",
    icon: <CalendarCheck2 />,
    title: "Report to members",
    when: "After every meeting · once a year",
    text: "Share the month summary after each meeting. For the annual meeting or an audit, print income & expenditure, the trial balance, the balance sheet and the cash book.",
    points: ["Print, save as PDF or download CSV", "Member passbooks and statements", "Audit log of every change"],
    guide: { href: "/guides/reports-and-month-summary", label: "Reports" },
  },
  {
    tone: "rose",
    icon: <Flag />,
    title: "Close and settle",
    when: "At the end of the term",
    text: "Finish what's open, share out the Mandal's own money by hapta shares, pay each member their savings plus share minus any upad owed, and close the Mandal read-only.",
    points: ["Waive remaining hapta if members agree", "A payout voucher for every member", "All history kept after closing"],
    guide: { href: "/guides/close-and-settle-a-mandal", label: "Close and settle" },
  },
];

const A_MONTH = [
  { day: "Before the meeting", text: "The dashboard lists what needs attention: older hapta due, upad interest to collect, payments members reported and upad requests." },
  { day: "Meeting day", text: "Collect hapta and interest member by member. Give or receive upad. Record tea and other expenses as cash out." },
  { day: "Same evening", text: "Count the cash box against the cash book. Share the month summary on the Mandal's WhatsApp group." },
  { day: "During the month", text: "Members check their balance and receipts in the app, report payments made outside the meeting and request upad." },
  { day: "Month end", text: "Credit monthly interest if your Mandal does. Everything rolls into next month automatically." },
];

export default function HowItWorksPage() {
  return (
    <>
      <NativeRedirect />
      <JsonLd
        nodes={[
          breadcrumbLd([{ name: "How it works", path: "/how-it-works" }]),
          {
            "@type": "HowTo",
            name: "How to run a Mandal's hisab with MandalHisab",
            url: absUrl("/how-it-works"),
            step: STAGES.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.title, text: s.text, url: absUrl(s.guide.href) })),
          },
        ]}
      />
      <PageHero eyebrow="How it works" title="From the first hapta to the final settlement" description="MandalHisab follows the life of a real Mandal. Here's the whole journey — what you do at each stage, and what the app does for you." />

      <Section>
        <ol className="relative flex flex-col gap-5 before:absolute before:top-4 before:bottom-4 before:left-6 before:w-px before:bg-border sm:before:left-7">
          {STAGES.map((s, i) => (
            <li key={s.title} className="relative grid grid-cols-[3rem_1fr] gap-3 sm:grid-cols-[3.5rem_1fr] sm:gap-5">
              <div className="relative z-10 flex flex-col items-center">
                <IconChip tone={s.tone} size="lg" className="bg-card ring-4 ring-background">
                  {s.icon}
                </IconChip>
              </div>
              <div className="rounded-3xl bg-card p-5 shadow-card ring-1 ring-foreground/[0.06] sm:p-6">
                <p className="text-xs font-bold tracking-wider text-primary uppercase">
                  Step {i + 1} · {s.when}
                </p>
                <h2 className="mt-1 text-xl font-extrabold tracking-tight sm:text-2xl">{s.title}</h2>
                <p className="mt-2 text-sm text-pretty text-muted-foreground sm:text-base">{s.text}</p>
                <ul className="mt-3 flex flex-col gap-1.5 text-sm">
                  {s.points.map((p) => (
                    <li key={p} className="flex gap-2">
                      <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                      {p}
                    </li>
                  ))}
                </ul>
                <Link href={s.guide.href} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                  Guide: {s.guide.label} <ArrowRight className="size-4" />
                </Link>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section tinted>
        <SectionHeading eyebrow="A month in MandalHisab" title="What a normal month looks like" description="Once the Mandal is set up, the routine is short and the same every month." />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          {A_MONTH.map((m, i) => (
            <div key={m.day} className="rounded-2xl bg-card p-4 shadow-card ring-1 ring-foreground/[0.06]">
              <p className="text-2xl font-extrabold text-primary/70">{i + 1}</p>
              <h3 className="mt-1 font-bold">{m.day}</h3>
              <p className="mt-1 text-sm text-pretty text-muted-foreground">{m.text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="Who does what" title="Three roles, one set of books" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { tone: "indigo" as Tone, title: "Admin", text: "Sets up the Mandal, manages members and access, records money and runs reports. Usually the treasurer and one backup." },
            { tone: "violet" as Tone, title: "Manager", text: "Helps with day-to-day work such as collecting hapta at the meeting, with permissions the admin chooses." },
            { tone: "emerald" as Tone, title: "Member", text: "Sees only their own savings, dues, upad and receipts. Can report a payment and request upad." },
          ].map((r) => (
            <div key={r.title} className="flex flex-col gap-3 rounded-3xl bg-card p-5 shadow-card ring-1 ring-foreground/[0.06]">
              <IconChip tone={r.tone}>
                <Users />
              </IconChip>
              <h3 className="text-lg font-bold">{r.title}</h3>
              <p className="text-sm text-pretty text-muted-foreground">{r.text}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Members don&apos;t need to sign in at all — the treasurer can run everything. Read more about{" "}
          <Link href="/guides/roles-and-inviting-people" className="font-medium text-primary hover:underline">
            roles, join codes and invitations
          </Link>
          .
        </p>
      </Section>

      <Section tinted>
        <CtaBand title="Ready to set up your Mandal?" />
      </Section>
    </>
  );
}
