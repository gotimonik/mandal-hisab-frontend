import Link from "next/link";
import { BadgeCheck, Calculator, Check, Clock, FileBarChart, HandCoins, History, Languages, MessageSquareOff, ShieldCheck, Smartphone, UserCheck, Users, X } from "lucide-react";
import { IconChip } from "@/components/app/bits";
import type { Tone } from "@/lib/tones";
import { FeatureCard, PageHero, Section, SectionHeading } from "@/features/public/blocks";
import { CtaBand } from "@/features/public/cta-band";
import { Breadcrumb } from "@/features/public/json-ld";
import { NativeRedirect } from "@/features/public/native-redirect";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Benefits for treasurers, members and committees",
  description: "What changes when a Mandal moves its hisab to MandalHisab: less work for the treasurer, instant answers for members, clean books for the committee, and fewer disputes for everyone.",
  path: "/benefits",
});

type Audience = { id: string; tone: Tone; icon: React.ReactNode; who: string; headline: string; intro: string; points: { title: string; text: string }[] };

const AUDIENCES: Audience[] = [
  {
    id: "treasurer",
    tone: "indigo",
    icon: <Calculator />,
    who: "For the treasurer",
    headline: "Hours of counting become minutes",
    intro: "The treasurer does the most work in a Mandal, usually for free. MandalHisab takes the arithmetic, the reminders and the questions off their shoulders.",
    points: [
      { title: "No more adding up", text: "Every total — collected, due, interest, cash in hand, each member's balance — is calculated the moment you record a payment." },
      { title: "Interest done for you", text: "Upad interest is worked out every month, carried forward when unpaid, and shared with members in proportion to their savings." },
      { title: "One tap per payment", text: "On the monthly screen, tap Collect next to a name and confirm. A numbered receipt is created automatically." },
      { title: "Fewer phone calls", text: "Members check their own balance in the app instead of calling you to ask." },
      { title: "Mistakes caught early", text: "A possible double entry is flagged before saving, and the cash book shows at once if the cash box doesn't match." },
      { title: "An easy handover", text: "When someone else takes over, change their role. The full history stays — nothing to copy from a register." },
    ],
  },
  {
    id: "members",
    tone: "emerald",
    icon: <Users />,
    who: "For members",
    headline: "Your savings, on your phone, any time",
    intro: "Members trust their Mandal, but they still like to know where they stand. Now they can see it without asking anyone.",
    points: [
      { title: "See your own balance", text: "Hapta paid, interest earned, withdrawals and your running balance — always up to date." },
      { title: "Receipts for every rupee", text: "Every payment you make gets a receipt you can open, print or save as PDF." },
      { title: "Know what you owe", text: "Hapta due, upad outstanding and interest due this month, clearly shown." },
      { title: "Report a payment", text: "Paid outside the meeting? Tap I have paid; it counts once the treasurer verifies it." },
      { title: "Ask for upad", text: "See how much the Mandal has available and send a request, then follow its status." },
      { title: "Private by design", text: "You see only your own money. Nobody else's balance, and nobody sees yours except the Mandal's admins." },
    ],
  },
  {
    id: "committee",
    tone: "violet",
    icon: <FileBarChart />,
    who: "For the committee and trustees",
    headline: "Books you can stand behind",
    intro: "Pramukh, mantri and trustees are answerable to members. MandalHisab gives them records that are complete, consistent and easy to check.",
    points: [
      { title: "Reports in one click", text: "Month summary, income & expenditure, trial balance, balance sheet and cash book — ready for any meeting." },
      { title: "Nothing silently changed", text: "Corrections are reversals with a reason. The original stays visible." },
      { title: "Audit log", text: "Who recorded, approved or reversed what, and when." },
      { title: "Control who does what", text: "Admins, managers with adjustable permissions, and members who see only their own data." },
      { title: "Fair closing", text: "Share out the Mandal's own money by hapta shares and pay each member with a voucher, step by step." },
      { title: "Your data, exportable", text: "Download CSV files of reports and statements whenever you like." },
    ],
  },
];

const BEFORE_AFTER: [string, string][] = [
  ["Totals added by hand at the end of each meeting", "Totals update the moment a payment is recorded"],
  ["“What's my balance?” — wait for the treasurer", "Every member checks their own balance on their phone"],
  ["Interest worked out on paper, month by month", "Upad interest calculated, carried forward and shared automatically"],
  ["Mistakes crossed out or overwritten", "Mistakes reversed with a reason; history kept"],
  ["Receipts from a receipt book — if any", "Numbered receipts for every payment, print or PDF"],
  ["The register lives with one person", "Records kept online, exportable at any time"],
  ["Closing the Mandal means days of calculations", "Settlement worked out per member, with a voucher for each"],
];

const GROUP_WIDE = [
  { icon: <ShieldCheck />, tone: "emerald", title: "More trust, fewer disputes", text: "When everyone can see the same numbers, there's nothing to argue about. Most Mandal disagreements come from records nobody could check." },
  { icon: <Clock />, tone: "indigo", title: "Shorter meetings", text: "Collection is faster, and the month summary is ready before people leave. More time for the social side of the meeting." },
  { icon: <History />, tone: "violet", title: "A complete history", text: "Every hapta, upad and withdrawal since the start, in one place — useful when a question comes up years later." },
  { icon: <Languages />, tone: "sky", title: "Everyone included", text: "English, ગુજરાતી and हिन्दी, so older members can read their own savings in the language they're comfortable with." },
  { icon: <Smartphone />, tone: "orange", title: "Works on any phone", text: "In any phone browser today, with the Android and iPhone apps on the way. Also works on a computer." },
  { icon: <MessageSquareOff />, tone: "rose", title: "No more screenshot hisab", text: "No more photos of register pages on WhatsApp. Share a clean month summary instead." },
] as const;

export default function BenefitsPage() {
  return (
    <>
      <Breadcrumb name="Benefits" path="/benefits" />
      <NativeRedirect />
      <PageHero tone="green" eyebrow="Benefits" title="Better for the treasurer, the members and the whole Mandal" description="MandalHisab keeps the Mandal you already run — cash, meetings and your own rules — and replaces only the counting, the register and the guesswork." />

      <nav aria-label="Jump to" className="no-print border-b border-border/60 bg-background">
        <div className="mx-auto flex w-full max-w-6xl gap-2 overflow-x-auto px-4 py-2.5 sm:px-6">
          {AUDIENCES.map((a) => (
            <a key={a.id} href={`#${a.id}`} className="shrink-0 rounded-full bg-card px-3.5 py-1.5 text-sm font-semibold text-muted-foreground ring-1 ring-foreground/10 hover:text-foreground">
              {a.who}
            </a>
          ))}
          <a href="#before-after" className="shrink-0 rounded-full bg-card px-3.5 py-1.5 text-sm font-semibold text-muted-foreground ring-1 ring-foreground/10 hover:text-foreground">
            Before & after
          </a>
        </div>
      </nav>

      {AUDIENCES.map((a, i) => (
        <Section key={a.id} id={a.id} tinted={i % 2 === 1}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[20rem_1fr] lg:gap-12">
            <div className="flex flex-col gap-3">
              <IconChip tone={a.tone} size="lg">
                {a.icon}
              </IconChip>
              <p className="text-xs font-bold tracking-wider text-primary uppercase">{a.who}</p>
              <h2 className="text-[1.4rem] leading-tight font-extrabold tracking-tight text-balance sm:text-3xl">{a.headline}</h2>
              <p className="text-sm text-pretty text-muted-foreground sm:text-base">{a.intro}</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {a.points.map((p) => (
                <div key={p.title} className="flex gap-3 rounded-2xl bg-card p-4 shadow-card ring-1 ring-foreground/[0.06]">
                  <BadgeCheck className="mt-0.5 size-5 shrink-0 text-success" />
                  <div className="min-w-0">
                    <h3 className="font-semibold">{p.title}</h3>
                    <p className="mt-1 text-sm text-pretty text-muted-foreground">{p.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>
      ))}

      <Section id="before-after" tinted>
        <SectionHeading eyebrow="Before & after" title="What actually changes" description="The same Mandal, the same members, the same cash — with the hisab taken care of." />
        <div className="overflow-hidden rounded-3xl bg-card shadow-card ring-1 ring-foreground/[0.06]">
          <div className="hidden grid-cols-2 border-b bg-secondary/50 text-sm font-bold sm:grid">
            <p className="px-5 py-3">With a register</p>
            <p className="px-5 py-3">With MandalHisab</p>
          </div>
          <ul>
            {BEFORE_AFTER.map(([b, a]) => (
              <li key={b} className="grid grid-cols-1 border-b last:border-0 sm:grid-cols-2">
                <p className="flex items-start gap-2.5 px-5 pt-4 text-sm text-muted-foreground sm:py-4">
                  <X className="mt-0.5 size-4 shrink-0 text-destructive" /> {b}
                </p>
                <p className="flex items-start gap-2.5 px-5 pt-2 pb-4 text-sm font-medium sm:py-4">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" /> {a}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="For the whole Mandal" title="Good for the group, not just the books" center />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GROUP_WIDE.map((g) => (
            <FeatureCard key={g.title} icon={g.icon} tone={g.tone} title={g.title}>
              {g.text}
            </FeatureCard>
          ))}
        </div>
      </Section>

      <Section tinted>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-3 rounded-3xl bg-card p-6 shadow-card ring-1 ring-foreground/[0.06]">
            <IconChip tone="amber">
              <HandCoins />
            </IconChip>
            <h2 className="text-xl font-bold">What MandalHisab doesn&apos;t do</h2>
            <p className="text-sm text-pretty text-muted-foreground">
              It never touches your money. MandalHisab doesn&apos;t take payments, hold funds or ask for bank details — members hand over cash as they always have, and the treasurer records it. It
              keeps the hisab, nothing more. It also doesn&apos;t run chit-fund auctions or draws.
            </p>
          </div>
          <div className="flex flex-col gap-3 rounded-3xl bg-card p-6 shadow-card ring-1 ring-foreground/[0.06]">
            <IconChip tone="sky">
              <UserCheck />
            </IconChip>
            <h2 className="text-xl font-bold">See it for yourself</h2>
            <p className="text-sm text-pretty text-muted-foreground">
              Read the step-by-step <Link href="/guides" className="font-medium text-primary hover:underline">guides</Link> to see exactly how each task works, or{" "}
              <Link href="/how-it-works" className="font-medium text-primary hover:underline">how it works</Link> for the whole journey from the first hapta to the final settlement.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <CtaBand />
      </Section>
    </>
  );
}
