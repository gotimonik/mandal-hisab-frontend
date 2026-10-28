import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Bell,
  BookOpenCheck,
  CalendarDays,
  Check,
  FileBarChart,
  HandCoins,
  Landmark,
  Languages,
  Lock,
  PiggyBank,
  Smartphone,
  UserCircle2,
  Users,
  Wallet,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { IconChip } from "@/components/app/bits";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/tones";
import { Container, PageHero, Section, SectionHeading } from "@/features/public/blocks";
import { site } from "@/config/site";
import { NativeRedirect } from "@/features/public/native-redirect";
import { pageMeta } from "@/lib/seo";
import { Breadcrumb } from "@/features/public/json-ld";

export const metadata = pageMeta({ title: "Features", description: "Everything MandalHisab does: hapta, savings, upad and interest, loans, collections, expenses, withdrawals, cash book, reports, roles, member self-service and more.", path: "/features" });

type Group = { id: string; tone: Tone; icon: React.ReactNode; title: string; intro: string; points: string[] };

const GROUPS: Group[] = [
  {
    id: "hapta",
    tone: "indigo",
    icon: <CalendarDays />,
    title: "Hapta & schemes",
    intro: "Set the monthly hapta once and see, month by month, who has paid and who hasn't.",
    points: [
      "Monthly hapta screen: every member's expected, collected and due amount for the month you pick",
      "Tap Collect to record cash — part payments allowed, possible double entries flagged before saving",
      "Hapta schemes that run weekly, monthly or quarterly, with members enrolled per scheme",
      "Change a period's due date or amount, skip it, or change the amount for future months only",
      "Installments can be deferred, waived or cancelled — always with a reason",
      "Pause, resume or close a scheme; set how long the Mandal runs and close & settle at the end",
      "Month summary report of who paid what, ready to print or share",
    ],
  },
  {
    id: "members",
    tone: "sky",
    icon: <Users />,
    title: "Members & savings",
    intro: "Each member has a savings passbook that adds up hapta, interest and withdrawals.",
    points: [
      "Member list with savings balance, search and status",
      "Add members one by one or import a CSV file",
      "Members can pay more than one hapta a month (haptas per month)",
      "Savings passbook with a running balance, opening balance and audited adjustments",
      "Member statements and dues statements, printable and downloadable as CSV",
      "Invite a member by email so they can see their own savings",
    ],
  },
  {
    id: "upad",
    tone: "orange",
    icon: <HandCoins />,
    title: "Upad & interest",
    intro: "Lend from the Mandal's fund to members, collect interest, and share it fairly.",
    points: [
      "Give upad (a loan from the Mandal's cash) at a monthly rate, with a default rate in Settings",
      "See what's lent out and how much interest is due, month by month",
      "Receive interest (oldest month first) and/or part of the upad returned, with receipts",
      "Unpaid interest from earlier months is carried forward on the monthly screen",
      "Members can request upad up to the cash available; admins approve with a rate or reject with a reason",
      "Credit interest to members' savings once a month — by rate on last month's balance or manual amounts — with a preview first",
    ],
  },
  {
    id: "loans",
    tone: "violet",
    icon: <Landmark />,
    title: "Loans with schedules",
    intro: "For Mandals that run formal loans with EMIs and repayment schedules.",
    points: [
      "Reducing-balance (EMI), flat, simple and compound interest methods",
      "Preview the full repayment schedule before submitting an application",
      "Approve, disburse and record repayments with a preview of how each payment is applied",
      "Early closure quote, rate changes and reversals of mistaken repayments",
      "Overdue tracking and loan outstanding report",
    ],
  },
  {
    id: "money-in",
    tone: "emerald",
    icon: <Banknote />,
    title: "Money in: collections, receipts & donations",
    intro: "Every rupee received is recorded once, with a receipt.",
    points: [
      "Record hapta, membership fees, event collections and other income",
      "Live preview of which dues a payment will settle",
      "Payments reported by members wait for an admin to verify, reject or reverse",
      "Numbered receipts with a print-friendly layout — save as PDF from the browser",
      "Donations with donor details and event tagging",
    ],
  },
  {
    id: "money-out",
    tone: "rose",
    icon: <Wallet />,
    title: "Money out: withdrawals & expenses",
    intro: "Pay out savings and spend the Mandal's money with checks along the way.",
    points: [
      "Withdrawals show the member's available balance before you pay",
      "Printable withdrawal voucher, and a reversal if a mistake was made",
      "Expenses with bill attachments, approval and reimbursement of out-of-pocket spending",
      "Optionally let admins approve a withdrawal above a member's balance — with a recorded reason",
    ],
  },
  {
    id: "books",
    tone: "slate",
    icon: <BookOpenCheck />,
    title: "Cash book, accounts & transactions",
    intro: "Behind every screen is a proper double-entry ledger, so the books always balance.",
    points: [
      "Cash book: opening cash, every receipt and payment, and closing cash for any period",
      "Cash in / cash out entries for anything that isn't hapta or a withdrawal",
      "Cash accounts (the cash box, the treasurer…) with opening balances, transfers and adjustments",
      "Transactions journal showing every balanced entry",
      "Corrections are reversals — history is never overwritten",
    ],
  },
  {
    id: "reports",
    tone: "violet",
    icon: <FileBarChart />,
    title: "Reports",
    intro: "Ready-made reports for meetings, audits and members.",
    points: [
      "Income & expenditure, trial balance, balance sheet, cash flow, account summary and ledger",
      "Collections, hapta, overdue dues, interest, donations, events and loans outstanding",
      "Filter by period, then download as CSV or print / save as PDF",
      "Dashboard with this month's hapta, member balances, the Mandal's fund and a 12-month chart",
    ],
  },
  {
    id: "people",
    tone: "sky",
    icon: <UserCircle2 />,
    title: "People, roles & joining",
    intro: "Admins, managers and members each see only what they should.",
    points: [
      "Three roles — admin, manager and member — with manager permissions you can adjust",
      "Join code to share; people can find your Mandal by name or code and ask to join",
      "Approve join requests as new members, with the month their hapta starts",
      "Email and in-app invitations, which also work for people without an account yet",
      "One login can belong to several Mandals",
    ],
  },
  {
    id: "self-service",
    tone: "emerald",
    icon: <PiggyBank />,
    title: "Member self-service",
    intro: "Members can check their own money without asking the treasurer.",
    points: [
      "My savings: balance, hapta paid, interest earned, withdrawals and the full passbook",
      "I have paid: tell the treasurer about a hapta, upad or other payment — the admin verifies it",
      "Request upad and follow its status",
      "Receipts, statements and loans — their own data only",
    ],
  },
  {
    id: "notifications",
    tone: "amber",
    icon: <Bell />,
    title: "Notifications",
    intro: "Know when something needs you.",
    points: ["Due-date reminders, payment confirmations, approvals and join requests", "Unread count on the bell; open a notification to go straight to it"],
  },
  {
    id: "languages",
    tone: "pink",
    icon: <Languages />,
    title: "Your language",
    intro: `Use MandalHisab in ${site.languages.join(", ")}.`,
    points: ["Switch language any time from the menu or the sign-in page", "Amounts in Indian format (₹1,25,000.00) and clear dates"],
  },
  {
    id: "phone",
    tone: "indigo",
    icon: <Smartphone />,
    title: "Made for the phone",
    intro: "Designed for the treasurer collecting cash at the meeting, with one hand.",
    points: [
      "Bottom navigation and quick actions: Collect, Receive, Give upad, Withdraw, Add member",
      "Your phone's own date pickers and dropdowns",
      "Works on desktop too, with a full sidebar and wide tables",
      "Light and dark themes",
    ],
  },
];

const SECURITY = [
  "Every request is checked on the server: what you can see and do depends on your role in that Mandal",
  "Each Mandal's data is kept separate — even platform administrators get no automatic access to it",
  "Your sign-in is kept in a secure, HttpOnly cookie that page scripts cannot read",
  "Passwords are stored only as salted hashes, and repeated sign-in attempts are rate-limited",
  "Sign out of every device at once from your account page",
  "Audit log of who did what and when",
  "Mistakes are fixed with reversals, never by editing history",
  "Sensitive actions ask for confirmation and a reason",
  "Export your data as CSV whenever you want",
];

export default function FeaturesPage() {
  return (
    <>
      <Breadcrumb name="Features" path="/features" />
      <NativeRedirect />
      <PageHero eyebrow="Features" title="Everything your Mandal's hisab needs, in one place" description="From the first hapta to closing and settling the Mandal — members, savings, upad, interest, loans, expenses, withdrawals, cash book and reports, accurate to the paisa.">
        <div className="flex flex-wrap gap-2">
          <Link href="/register" className={cn(buttonVariants({ size: "lg" }), "bg-white text-primary hover:bg-white/90")}>
            Get started free <ArrowRight />
          </Link>
          <Link href="/download" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white")}>
            Get the app
          </Link>
        </div>
      </PageHero>

      <nav aria-label="Jump to" className="no-print sticky top-[calc(4rem+env(safe-area-inset-top))] z-30 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <Container className="scrollbar-none flex gap-2 overflow-x-auto py-2.5">
          {[...GROUPS.map((g) => ({ id: g.id, label: g.title.split(/[:&]/)[0].trim() })), { id: "security", label: "Security" }].map((l) => (
            <a key={l.id} href={`#${l.id}`} className="shrink-0 rounded-full bg-card px-3.5 py-1.5 text-sm font-semibold text-muted-foreground ring-1 ring-foreground/10 hover:text-foreground">
              {l.label}
            </a>
          ))}
        </Container>
      </nav>

      <Container className="flex flex-col gap-5 py-10 sm:py-14">
        {GROUPS.map((g) => (
          <section key={g.id} id={g.id} className="grid scroll-mt-32 grid-cols-1 gap-4 rounded-3xl bg-card p-5 shadow-card ring-1 ring-foreground/[0.06] sm:p-7 lg:grid-cols-[18rem_1fr] lg:gap-8">
            <div className="flex flex-col gap-3">
              <IconChip tone={g.tone} size="lg">
                {g.icon}
              </IconChip>
              <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">{g.title}</h2>
              <p className="text-sm text-muted-foreground">{g.intro}</p>
            </div>
            <ul className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
              {g.points.map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" />
                  <span className="min-w-0">{p}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </Container>

      <Section id="security" tinted>
        <SectionHeading eyebrow="Security & trust" title="Built so everyone can trust the numbers" description="A Mandal runs on trust. MandalHisab is designed so the right people see the right data, and nothing is quietly changed." />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SECURITY.map((s) => (
            <div key={s} className="flex items-start gap-3 rounded-2xl bg-card p-4 shadow-card ring-1 ring-foreground/[0.06]">
              <IconChip tone="emerald" size="sm">
                <Lock />
              </IconChip>
              <p className="min-w-0 text-sm">{s}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="bg-hero relative overflow-hidden rounded-3xl p-6 text-white shadow-lg shadow-primary/20 sm:p-10">
          <div aria-hidden className="pointer-events-none absolute -top-16 -right-10 size-56 rounded-full bg-white/10" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Ready to move your hisab off paper?</h2>
              <p className="mt-2 text-white/85">{site.pricing.headline}. Set up your Mandal in a few minutes.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/register" className={cn(buttonVariants({ size: "lg" }), "bg-white text-primary hover:bg-white/90")}>
                Create your Mandal
              </Link>
              <Link href="/faq" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white")}>
                Read the FAQ
              </Link>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
