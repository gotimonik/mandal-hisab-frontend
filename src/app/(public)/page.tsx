import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpenCheck,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardList,
  FileSpreadsheet,
  HandCoins,
  History,
  Landmark,
  Languages,
  Lock,
  MessageSquareWarning,
  Percent,
  PiggyBank,
  Receipt,
  ShieldCheck,
  Smartphone,
  Undo2,
  UserCog,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { IconChip } from "@/components/app/bits";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/tones";
import { site } from "@/config/site";
import { Container, Section, SectionHeading } from "@/features/public/blocks";
import { StoreBadges } from "@/features/public/store-badges";
import { NativeRedirect } from "@/features/public/native-redirect";
import { PhoneMockup } from "@/features/public/home/phone-mockup";
import { RoleTabs, type RoleInfo } from "@/features/public/home/role-tabs";

export const metadata: Metadata = {
  title: { absolute: "MandalHisab — Transparent hisab for your Mandal" },
  description: site.description,
  openGraph: {
    title: "MandalHisab — Transparent hisab for your Mandal",
    description: site.description,
    url: site.url,
    siteName: site.name,
    type: "website",
    locale: "en_IN",
  },
};

const PROBLEMS: { icon: React.ReactNode; tone: Tone; title: string; problem: string; fix: string }[] = [
  {
    icon: <ClipboardList />,
    tone: "amber",
    title: "No more paper registers",
    problem: "One notebook, one treasurer, and totals added up by hand every month.",
    fix: "Every hapta, upad and withdrawal is recorded on the phone and the totals add up themselves.",
  },
  {
    icon: <MessageSquareWarning />,
    tone: "rose",
    title: "No more WhatsApp screenshots",
    problem: "Members asking “how much have I saved?” and waiting for a photo of the page.",
    fix: "Each member signs in and sees their own balance, passbook and receipts any time.",
  },
  {
    icon: <ShieldCheck />,
    tone: "emerald",
    title: "Trust everyone can see",
    problem: "Doubts and arguments when a figure doesn't match what someone remembers.",
    fix: "A balanced ledger, receipts for every payment and an audit log of who did what.",
  },
];

const FEATURES: { icon: React.ReactNode; tone: Tone; title: string; text: string }[] = [
  { icon: <CalendarDays />, tone: "indigo", title: "Monthly hapta", text: "Pick a month and see who has paid, who is due and who recorded it. Tap Collect — part payments allowed, double entries flagged." },
  { icon: <Users />, tone: "sky", title: "Members & savings passbook", text: "Every member's balance with a passbook: opening balance, hapta, interest, withdrawals and audited adjustments." },
  { icon: <HandCoins />, tone: "orange", title: "Upad with interest", text: "Give upad from the Mandal's cash at a monthly rate. Interest due is tracked month by month; receive interest or part of the upad back." },
  { icon: <Percent />, tone: "violet", title: "Interest credit", text: "Preview interest on last month's balances or enter amounts by hand, then credit everyone once a month." },
  { icon: <Wallet />, tone: "rose", title: "Withdrawals", text: "Pay out a member's savings with their available balance shown first, and print a voucher." },
  { icon: <BookOpenCheck />, tone: "emerald", title: "Cash book", text: "Opening cash, every receipt and payment, and closing cash — line by line, for any period." },
  { icon: <Receipt />, tone: "emerald", title: "Collections & receipts", text: "Record any money received, verify what members report, and give a receipt for each payment." },
  { icon: <Landmark />, tone: "pink", title: "Donations & expenses", text: "Donations with receipts, expenses with bills attached, approval and reimbursement." },
  { icon: <FileSpreadsheet />, tone: "violet", title: "Reports & CSV", text: "Month summary, statements, dues, cash book and more — print, save as PDF or export to CSV." },
  { icon: <UserCog />, tone: "slate", title: "Roles & permissions", text: "Admins, managers and members each see and do only what they should." },
  { icon: <Bell />, tone: "amber", title: "Notifications", text: "Due-date reminders, payment confirmations and approvals, right inside the app." },
  { icon: <Smartphone />, tone: "indigo", title: "Member self-service", text: "Members check their savings, request upad and tell the treasurer “I have paid” from their own phone." },
];

const STEPS = [
  { title: "Create your Mandal", text: "Add its name and the monthly hapta amount. It takes about two minutes." },
  { title: "Add or invite members", text: "Add members yourself, import a list, or share your join code so they can ask to join." },
  { title: "Collect and record on the phone", text: "Each month, tap Collect as cash comes in. Upad, interest and withdrawals go in the same way." },
  { title: "Everyone sees the same hisab", text: "Members see their own passbook; committee members see reports any time." },
];

const ROLES: RoleInfo[] = [
  {
    icon: <ShieldCheck />,
    tone: "indigo",
    role: "Admin",
    who: "The treasurer or president",
    points: ["Set the hapta, interest and upad rules", "Collect, give upad and pay withdrawals", "Approve members, expenses and upad requests", "All reports, settings and the audit log"],
  },
  {
    icon: <UserCog />,
    tone: "violet",
    role: "Manager",
    who: "Committee members who help",
    points: ["Record collections and cash", "Look after members and dues", "Only the permissions the admin gives", "See the reports they need"],
  },
  {
    icon: <Users />,
    tone: "sky",
    role: "Member",
    who: "Everyone in the Mandal",
    points: ["Own balance and savings passbook", "Receipts and statements", "Request upad from the Mandal", "Tell the treasurer “I have paid”"],
  },
];

const TRUST: { icon: React.ReactNode; tone: Tone; title: string; text: string }[] = [
  { icon: <BookOpenCheck />, tone: "emerald", title: "Double-entry ledger", text: "Every amount is posted to a balanced ledger, accurate to the paisa." },
  { icon: <Undo2 />, tone: "rose", title: "Reversals, not edits", text: "Mistakes are corrected with a reversal entry. History is never overwritten." },
  { icon: <History />, tone: "violet", title: "Audit log", text: "Who recorded, verified or changed what — and when." },
  { icon: <Lock />, tone: "indigo", title: "Each Mandal is separate", text: "Every Mandal's data is kept apart, and members only see their own records." },
];

const FAQ_TEASER = [
  { q: "Is MandalHisab free?", a: site.pricing.detail },
  { q: "Do members need to install anything?", a: "No. MandalHisab works in any phone browser. Members sign in to see their own balance — apps for Android and iPhone are coming soon." },
  { q: "Can we start with the balances we already have?", a: "Yes. Enter each member's opening balance when you add them, and carry on from there." },
  { q: "Which languages does it support?", a: `The app works in ${site.languages.join(", ")}. Each person can choose their own.` },
];

export default function HomePage() {
  return (
    <>
      <NativeRedirect />

      {/* 1. Hero */}
      <section className="bg-hero relative overflow-hidden text-white">
        <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-white/10" />
        <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-24 size-96 rounded-full bg-white/10" />
        <Container className="relative grid grid-cols-1 items-center gap-8 pt-7 pb-10 sm:gap-12 sm:py-20 lg:grid-cols-[1.15fr_1fr] lg:py-24">
          <div className="min-w-0">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold sm:mb-4 sm:text-xs ring-1 ring-white/20 backdrop-blur">
              <PiggyBank className="size-3.5" /> For Mandals, trusts and community groups
            </p>
            <h1 className="text-[2.1rem] leading-[1.1] font-extrabold tracking-tight text-balance sm:text-6xl">Transparent hisab for your Mandal.</h1>
            <p className="mt-3 max-w-xl text-[0.95rem] text-pretty text-white/85 sm:mt-5 sm:text-lg">
              Monthly hapta, member savings, upad and interest, withdrawals, cash book and reports — in one app on your phone. Accurate to the paisa, and open to every member who needs to see it.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:mt-7 sm:flex-row sm:flex-wrap sm:gap-3">
              <Link href="/register" className={cn(buttonVariants({ size: "lg" }), "h-12 w-full rounded-2xl bg-white px-5 text-base text-primary hover:bg-white/90 sm:w-auto")}>
                Create your Mandal <ArrowRight />
              </Link>
              <Link href="/login" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "h-12 w-full rounded-2xl border-white/30 bg-white/10 px-5 text-base text-white hover:bg-white/20 hover:text-white sm:w-auto")}>
                Join with a code
              </Link>
            </div>
            <ul className="mt-4 flex flex-wrap gap-1.5 text-xs text-white/90 sm:mt-6 sm:gap-x-5 sm:gap-y-2 sm:text-sm">
              {[site.pricing.headline, site.languages.join(" · "), "Works on any phone"].map((t) => (
                <li key={t} className="inline-flex items-center gap-1 rounded-full bg-white/12 px-2.5 py-1 sm:gap-1.5 sm:bg-transparent sm:p-0">
                  <Check className="size-3.5 text-amber-200 sm:size-4" /> {t}
                </li>
              ))}
            </ul>
            <StoreBadges className="mt-5 sm:mt-8" showWeb={false} />
          </div>
          <PhoneMockup className="max-w-[15.5rem] sm:max-w-[18.5rem]" />
        </Container>
      </section>

      {/* 2. Problem → solution */}
      <Section>
        <SectionHeading eyebrow="Why MandalHisab" title="Made for how Mandals actually work" description="Hapta in cash, upad between members, interest shared by everyone — MandalHisab follows the way your Mandal already runs, and takes the counting off the treasurer." />
        <div className="grid grid-cols-1 gap-2.5 sm:gap-4 md:grid-cols-3">
          {PROBLEMS.map((p) => (
            <div key={p.title} className="flex flex-col gap-2 rounded-2xl bg-card p-4 shadow-card ring-1 ring-foreground/[0.06] sm:gap-3 sm:rounded-3xl sm:p-5">
              <div className="flex items-center gap-2.5 md:flex-col md:items-start md:gap-3">
                <IconChip tone={p.tone} size="sm" className="md:size-10 md:rounded-xl md:[&_svg]:size-5">
                  {p.icon}
                </IconChip>
                <h3 className="text-[0.95rem] font-bold sm:text-base">{p.title}</h3>
              </div>
              <p className="text-xs text-muted-foreground line-through decoration-foreground/20 sm:text-sm">{p.problem}</p>
              <p className="flex gap-2 text-[0.8rem] font-medium sm:text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" /> {p.fix}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* 3. Features */}
      <Section tinted>
        <SectionHeading eyebrow="Everything in one place" title="All of your Mandal's hisab, from one phone" description="The everyday work of the treasurer, and the answers every member wants." />
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex min-w-0 flex-col gap-1.5 rounded-2xl bg-card p-3.5 shadow-card ring-1 ring-foreground/[0.06] sm:gap-3 sm:rounded-3xl sm:p-5">
              <IconChip tone={f.tone} size="sm" className="sm:size-10 sm:rounded-xl sm:[&_svg]:size-5">
                {f.icon}
              </IconChip>
              <h3 className="mt-0.5 text-sm leading-snug font-bold sm:text-base">{f.title}</h3>
              <p className="line-clamp-2 text-xs text-muted-foreground sm:line-clamp-none sm:text-sm">{f.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-center sm:mt-8">
          <Link href="/features" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 rounded-2xl")}>
            See every feature <ArrowRight />
          </Link>
        </div>
      </Section>

      {/* 4. How it works */}
      <Section id="how-it-works">
        <SectionHeading eyebrow="How it works" title="Up and running in an evening" center className="mb-4" />
        <ol className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative flex gap-3 rounded-2xl bg-card p-3.5 shadow-card ring-1 ring-foreground/[0.06] sm:flex-col sm:gap-2 sm:rounded-3xl sm:p-5">
              <span className="bg-hero flex size-8 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-white shadow-md shadow-primary/25 sm:size-10 sm:rounded-2xl sm:text-lg">{i + 1}</span>
              <div className="min-w-0">
                <h3 className="text-[0.95rem] font-bold sm:mt-1 sm:text-base">{s.title}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground sm:mt-2 sm:text-sm">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-center text-xs text-muted-foreground sm:mt-6 sm:text-sm">
          <BarChart3 className="mr-1 inline size-4 align-text-bottom text-violet-500" /> Reports are ready whenever the committee meets — no adding up at the end of the year.
        </p>
      </Section>

      {/* 5. Roles */}
      <Section tinted>
        <SectionHeading eyebrow="For everyone in the Mandal" title="The right view for each person" description="One Mandal, three kinds of access. Everyone sees exactly what they should — nothing more." />
        <RoleTabs roles={ROLES} />
      </Section>

      {/* 6. Trust */}
      <Section>
        <div className="bg-hero-green relative overflow-hidden rounded-3xl p-5 text-white shadow-lg shadow-emerald-600/15 sm:rounded-[2rem] sm:p-10">
          <div aria-hidden className="pointer-events-none absolute -top-16 -right-16 size-64 rounded-full bg-white/10" />
          <div className="relative grid grid-cols-1 gap-5 sm:gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-center">
            <div className="min-w-0">
              <p className="mb-2 text-xs font-bold tracking-wider text-white/80 uppercase">Trust & accuracy</p>
              <h2 className="text-[1.4rem] leading-tight font-extrabold tracking-tight text-balance sm:text-4xl">Every rupee accounted for</h2>
              <p className="mt-2 text-sm text-white/85 sm:mt-3 sm:text-base">MandalHisab keeps the books the way an accountant would, so the numbers always agree and nothing can quietly disappear.</p>
              <Link href="/features#security" className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold ring-1 ring-white/25 hover:bg-white/25">
                How we keep your data safe <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {TRUST.map((t) => (
                <div key={t.title} className="min-w-0 rounded-2xl bg-white/15 p-3 ring-1 ring-white/20 backdrop-blur sm:p-4">
                  <span className="mb-1.5 flex size-8 items-center justify-center rounded-lg bg-white/20 sm:mb-2 sm:size-9 sm:rounded-xl [&_svg]:size-4 sm:[&_svg]:size-5">{t.icon}</span>
                  <h3 className="text-sm leading-snug font-bold sm:text-base">{t.title}</h3>
                  <p className="mt-1 text-xs text-white/85 sm:text-sm">{t.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* 7. Languages */}
      <Section tinted className="py-8 sm:py-16">
        <div className="flex flex-col items-center gap-4 text-center sm:gap-6">
          <IconChip tone="violet" className="sm:size-12 sm:rounded-2xl sm:[&_svg]:size-6">
            <Languages />
          </IconChip>
          <div className="max-w-2xl">
            <h2 className="text-xl font-extrabold tracking-tight sm:text-3xl">In the language your members speak</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">Each person picks their own language — the treasurer can use English while members read their passbook in Gujarati or Hindi.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {site.languages.map((l) => (
              <span key={l} className="rounded-xl bg-card px-4 py-2 text-base font-bold sm:rounded-2xl sm:px-5 sm:py-3 sm:text-xl shadow-card ring-1 ring-foreground/[0.06]">
                {l}
              </span>
            ))}
          </div>
        </div>
      </Section>

      {/* 8. Download + pricing */}
      <Section>
        <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="bg-hero relative min-w-0 overflow-hidden rounded-3xl p-5 text-white shadow-lg shadow-primary/20 sm:rounded-[2rem] sm:p-10">
            <div aria-hidden className="pointer-events-none absolute -right-12 -bottom-16 size-56 rounded-full bg-white/10" />
            <div className="relative">
              <h2 className="flex items-center gap-2.5 text-xl font-extrabold tracking-tight sm:text-3xl">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/20 sm:size-10 [&_svg]:size-5">
                  <Smartphone />
                </span>
                On your phone, today
              </h2>
              <p className="mt-2 max-w-lg text-sm text-white/85 sm:text-base">MandalHisab works fully in any phone browser right now. Apps for Android and iPhone are on the way.</p>
              <StoreBadges className="mt-4 sm:mt-6" />
              <Link href="/download" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white/90 hover:text-white">
                More about the apps <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
          <div className="flex min-w-0 flex-col justify-center gap-2 rounded-3xl bg-card p-5 shadow-card ring-1 ring-foreground/[0.06] sm:gap-3 sm:rounded-[2rem] sm:p-8">
            <h2 className="flex items-center gap-2.5 text-xl font-extrabold tracking-tight sm:text-2xl">
              <IconChip tone="emerald" size="sm" className="sm:size-10 sm:rounded-xl sm:[&_svg]:size-5">
                <UserPlus />
              </IconChip>
              {site.pricing.headline}
            </h2>
            <p className="text-sm text-muted-foreground">{site.pricing.detail}</p>
            <Link href="/register" className={cn(buttonVariants({ size: "lg" }), "mt-2 h-11 w-full rounded-xl sm:w-auto sm:self-start sm:rounded-2xl")}>
              Create your Mandal <ArrowRight />
            </Link>
          </div>
        </div>
      </Section>

      {/* 9. FAQ teaser */}
      <Section tinted>
        <SectionHeading eyebrow="Questions" title="Good to know" center className="mb-4" />
        <div className="mx-auto flex max-w-3xl flex-col gap-2 sm:gap-3">
          {FAQ_TEASER.map((f) => (
            <details key={f.q} className="group rounded-2xl bg-card shadow-card ring-1 ring-foreground/[0.06] [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-3.5 text-sm font-semibold sm:p-4 sm:text-base">
                {f.q}
                <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="px-3.5 pb-3.5 text-sm text-muted-foreground sm:px-4 sm:pb-4">{f.a}</p>
            </details>
          ))}
        </div>
        <div className="mt-4 text-center sm:mt-6">
          <Link href="/faq" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            Read all questions <ArrowRight className="size-4" />
          </Link>
        </div>
      </Section>

      {/* 10. Final CTA */}
      <Section>
        <div className="bg-hero-warm relative overflow-hidden rounded-3xl p-6 text-center text-white shadow-lg shadow-orange-500/20 sm:rounded-[2rem] sm:p-14">
          <div aria-hidden className="pointer-events-none absolute -top-20 -left-16 size-64 rounded-full bg-white/10" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-2xl leading-tight font-extrabold tracking-tight text-balance sm:text-4xl">Start this month&apos;s hisab the easy way</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-white/90 sm:mt-3 sm:text-base">Create your Mandal in a couple of minutes, or ask your treasurer for the join code.</p>
            <div className="mt-5 flex flex-col gap-2 sm:mt-7 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-3">
              <Link href="/register" className={cn(buttonVariants({ size: "lg" }), "h-12 w-full rounded-2xl bg-white px-5 text-base text-orange-700 hover:bg-white/90 sm:w-auto")}>
                Create your Mandal <ArrowRight />
              </Link>
              <Link href="/login" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "h-12 w-full rounded-2xl border-white/40 bg-white/10 px-5 text-base text-white hover:bg-white/20 hover:text-white sm:w-auto")}>
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
