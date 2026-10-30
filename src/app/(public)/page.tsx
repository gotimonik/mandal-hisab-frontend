import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardList,
  FileSpreadsheet,
  HandCoins,
  History,
  Lock,
  MessageSquareWarning,
  PiggyBank,
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
import { PhoneMockup } from "@/features/public/home/phone-mockup";
import { HisabCalculator } from "@/features/public/home/hisab-calculator";
import { organizationLd, pageMeta, softwareAppLd, websiteLd } from "@/lib/seo";
import { JsonLd } from "@/features/public/json-ld";
import { NativeRedirect } from "@/features/public/native-redirect";
import { getGuide } from "@/features/public/guides";
import { GuideCard } from "@/features/public/guides/render";

const HOME_GUIDES = ["what-is-a-mandal", "collect-hapta-at-the-monthly-meeting", "how-upad-interest-is-calculated"].map((s) => getGuide(s)!);

export const metadata: Metadata = pageMeta({
  title: "MandalHisab — Hapta, savings & upad app for Mandals",
  description: site.description,
  path: "/",
  absoluteTitle: true,
});

const PROBLEMS: {
  icon: React.ReactNode;
  tone: Tone;
  title: string;
  problem: string;
  fix: string;
}[] = [
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

/** Six highlights — the full list lives on /features. */
const FEATURES: {
  icon: React.ReactNode;
  tone: Tone;
  title: string;
  text: string;
}[] = [
  {
    icon: <CalendarDays />,
    tone: "indigo",
    title: "Monthly hapta",
    text: "See who has paid and who is due for any month. Tap Collect — part payments allowed, double entries flagged.",
  },
  {
    icon: <Users />,
    tone: "sky",
    title: "Savings passbook",
    text: "Every member's balance with a running passbook: opening balance, hapta, interest and withdrawals.",
  },
  {
    icon: <HandCoins />,
    tone: "orange",
    title: "Upad with interest",
    text: "Lend from the fund at a monthly rate. Interest is tracked month by month and shared with every member.",
  },
  {
    icon: <Wallet />,
    tone: "rose",
    title: "Withdrawals & settlement",
    text: "Pay out savings with the balance shown first, and settle everyone fairly when the Mandal closes.",
  },
  {
    icon: <FileSpreadsheet />,
    tone: "violet",
    title: "Reports in one tap",
    text: "Month summary, cash book, statements and annual accounts — print, save as PDF or export to CSV.",
  },
  {
    icon: <Smartphone />,
    tone: "emerald",
    title: "Member self-service",
    text: "Members check their savings, request upad and tell the treasurer “I have paid” from their own phone.",
  },
];

const STEPS = [
  {
    title: "Create your Mandal",
    text: "Its name and monthly hapta. About two minutes.",
  },
  {
    title: "Add your members",
    text: "One by one, from a spreadsheet, or with a join code.",
  },
  {
    title: "Collect at the meeting",
    text: "Tap Collect as cash comes in. Upad and withdrawals the same way.",
  },
  {
    title: "Everyone sees the hisab",
    text: "Members see their passbook; the committee sees reports.",
  },
];

const TRUST: { icon: React.ReactNode; title: string; text: string }[] = [
  {
    icon: <BookOpenCheck />,
    title: "Double-entry ledger",
    text: "Every amount is posted to a balanced ledger, accurate to the paisa.",
  },
  {
    icon: <Undo2 />,
    title: "Reversals, not edits",
    text: "Mistakes are corrected with a reversal entry. History is never overwritten.",
  },
  {
    icon: <History />,
    title: "Audit log",
    text: "Who recorded, verified or changed what — and when.",
  },
  {
    icon: <Lock />,
    title: "Each Mandal is separate",
    text: "Every Mandal's data is kept apart, and members only see their own records.",
  },
];

const ROLES: { icon: React.ReactNode; role: string; text: string }[] = [
  {
    icon: <ShieldCheck />,
    role: "Admin",
    text: "The treasurer or president. Rules, money, members, reports and the audit log.",
  },
  {
    icon: <UserCog />,
    role: "Manager",
    text: "Committee helpers. Day-to-day collection, with only the permissions the admin gives.",
  },
  {
    icon: <Users />,
    role: "Member",
    text: "Everyone else. Their own balance, receipts and upad — nobody else's.",
  },
];

const FAQ_TEASER = [
  { q: "Is MandalHisab free?", a: site.pricing.detail },
  {
    q: "Do members need to install anything?",
    a: "No. MandalHisab works in any phone browser. Members sign in to see their own balance — apps for Android and iPhone are coming soon.",
  },
  {
    q: "Can we start with the balances we already have?",
    a: "Yes. Enter each member's opening balance when you add them, and carry on from there.",
  },
  {
    q: "Does MandalHisab handle our money?",
    a: "No. Members pay in cash as usual and the treasurer records it. MandalHisab never takes payments or asks for bank details — it only keeps the hisab.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* never shown inside the iOS / Android app */}
      <NativeRedirect />
      <JsonLd nodes={[organizationLd(), websiteLd(), softwareAppLd()]} />

      {/* 1. Hero */}
      <section className="bg-hero relative overflow-hidden text-white">
        <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-white/10" />
        <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-24 size-96 rounded-full bg-white/10" />
        <Container className="relative grid grid-cols-1 items-center gap-8 pt-7 pb-10 sm:gap-12 sm:py-20 lg:grid-cols-[1.15fr_1fr] lg:py-24">
          <div className="min-w-0">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold ring-1 ring-white/20 backdrop-blur sm:mb-4 sm:text-xs">
              <PiggyBank className="size-3.5" /> For Mandals, trusts and community groups
            </p>
            <h1 className="text-[2.1rem] leading-[1.1] font-extrabold tracking-tight text-balance sm:text-6xl">Transparent hisab for your Mandal.</h1>
            <p className="mt-3 max-w-xl text-[0.95rem] text-pretty text-white/85 sm:mt-5 sm:text-lg">
              Monthly hapta, member savings, upad and interest, withdrawals and reports — in one app on your phone. Accurate to the paisa, and open to every member who needs to see it.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:mt-7 sm:flex-row sm:flex-wrap sm:gap-3">
              <Link href="/register" className={cn(buttonVariants({ size: "lg" }), "h-12 w-full rounded-2xl bg-white px-5 text-base text-primary hover:bg-white/90 sm:w-auto")}>
                Create your Mandal <ArrowRight />
              </Link>
              <Link
                href="/onboarding?join=1"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "h-12 w-full rounded-2xl border-white/30 bg-white/10 px-5 text-base text-white hover:bg-white/20 hover:text-white sm:w-auto",
                )}
              >
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
            <p className="mt-5 flex items-start gap-2.5 rounded-2xl bg-black/10 p-3 text-sm text-white/90 ring-1 ring-white/15 sm:mt-8 sm:max-w-md sm:items-center">
              <Lock className="mt-0.5 size-4 shrink-0 text-amber-200 sm:mt-0" />
              <span>
                <b className="font-semibold text-white">Cash stays cash.</b> No bank details, no online payments — MandalHisab only keeps the hisab.
              </span>
            </p>
          </div>
          <PhoneMockup className="max-w-[15.5rem] sm:max-w-[18.5rem]" />
        </Container>
      </section>

      {/* 2. Before → after */}
      <Section>
        <SectionHeading
          eyebrow="Why MandalHisab"
          title="Made for how Mandals actually work"
          description="Hapta in cash, upad between members, interest shared by everyone — MandalHisab follows the way your Mandal already runs, and takes the counting off the treasurer."
        />
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
          {PROBLEMS.map((p) => (
            <div key={p.title} className="flex flex-col overflow-hidden rounded-2xl bg-card shadow-card ring-1 ring-foreground/[0.06] sm:rounded-3xl md:row-span-3 md:grid md:grid-rows-subgrid md:gap-0">
              <div className="flex items-center gap-2.5 p-4 pb-3 sm:p-5 sm:pb-3">
                <IconChip tone={p.tone} size="sm" className="sm:size-10 sm:rounded-xl sm:[&_svg]:size-5">
                  {p.icon}
                </IconChip>
                <h3 className="text-[0.95rem] font-bold sm:text-base">{p.title}</h3>
              </div>
              <div className="px-4 pb-3 sm:px-5">
                <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">Before</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{p.problem}</p>
              </div>
              <div className="mt-auto border-t border-emerald-500/15 md:mt-0 bg-emerald-500/[0.06] px-4 py-3 sm:px-5 sm:py-4">
                <p className="text-[11px] font-bold tracking-wider text-emerald-700 uppercase dark:text-emerald-300">With MandalHisab</p>
                <p className="mt-0.5 flex gap-2 text-sm font-medium">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" /> {p.fix}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 3. Features — a list, not another card grid */}
      <Section tinted>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[22rem_1fr] lg:gap-14">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <SectionHeading
              eyebrow="Everything in one place"
              title="All of your Mandal's hisab, from one phone"
              description="The everyday work of the treasurer, and the answers every member wants."
              className="mb-4 sm:mb-6"
            />
            <Link href="/features" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "hidden h-11 rounded-2xl lg:inline-flex [.native-app_&]:hidden")}>
              See every feature <ArrowRight />
            </Link>
          </div>
          <ul className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex gap-3.5 border-b border-foreground/[0.08] py-4 sm:py-5">
                <IconChip tone={f.tone}>{f.icon}</IconChip>
                <div className="min-w-0">
                  <h3 className="font-bold">{f.title}</h3>
                  <p className="mt-1 text-sm text-pretty text-muted-foreground">{f.text}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link href="/features" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 rounded-2xl lg:hidden [.native-app_&]:hidden")}>
            See every feature <ArrowRight />
          </Link>
        </div>
      </Section>

      {/* 4. How it works — numbered timeline */}
      <Section id="how-it-works">
        <SectionHeading eyebrow="How it works" title="Up and running in an evening" center />
        <ol className="relative grid grid-cols-1 gap-5 md:grid-cols-4 md:gap-6">
          <span
            aria-hidden
            className="absolute top-5 bottom-5 left-5 w-px bg-gradient-to-b from-primary/40 to-primary/0 md:top-5 md:right-[12.5%] md:bottom-auto md:left-[12.5%] md:h-px md:w-auto md:bg-gradient-to-r md:from-primary/40 md:via-primary/40 md:to-primary/10"
          />
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative flex gap-4 md:flex-col md:items-center md:gap-3 md:text-center">
              <span className="bg-hero relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full text-base font-extrabold text-white shadow-md ring-4 shadow-primary/25 ring-background">
                {i + 1}
              </span>
              <div className="min-w-0 pt-1.5 md:pt-0">
                <h3 className="font-bold">{s.title}</h3>
                <p className="mt-1 text-sm text-pretty text-muted-foreground">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-7 text-center">
          <Link href="/how-it-works" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-primary hover:underline [.native-app_&]:hidden">
            See the whole journey, step by step <ArrowRight className="size-4" />
          </Link>
        </div>
      </Section>

      {/* 5. Calculator */}
      <Section tinted id="calculator">
        <SectionHeading
          eyebrow="Try the numbers"
          title="Work out upad interest and Mandal savings"
          description="Change the amounts to see what a member pays on upad, or how much your Mandal collects over its term."
        />
        <HisabCalculator />
      </Section>

      {/* 6. Trust + roles */}
      <Section>
        <div className="bg-hero-green relative overflow-hidden rounded-3xl p-5 text-white shadow-lg shadow-emerald-600/15 sm:rounded-[2rem] sm:p-10">
          <div aria-hidden className="pointer-events-none absolute -top-16 -right-16 size-64 rounded-full bg-white/10" />
          <div className="relative grid grid-cols-1 gap-5 sm:gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-center">
            <div className="min-w-0">
              <p className="mb-2 text-xs font-bold tracking-wider text-white/80 uppercase">Trust & accuracy</p>
              <h2 className="text-[1.4rem] leading-tight font-extrabold tracking-tight text-balance sm:text-4xl">Every rupee accounted for</h2>
              <p className="mt-2 text-sm text-white/85 sm:mt-3 sm:text-base">MandalHisab keeps the books the way an accountant would, so the numbers always agree and nothing can quietly disappear.</p>
              <Link
                href="/features#security"
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold ring-1 ring-white/25 hover:bg-white/25 [.native-app_&]:hidden"
              >
                How we keep your data safe <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
              {TRUST.map((t) => (
                <div key={t.title} className="flex min-w-0 gap-3 rounded-2xl bg-white/15 p-3 ring-1 ring-white/20 backdrop-blur sm:block sm:p-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/20 sm:mb-2 sm:size-9 sm:rounded-xl [&_svg]:size-4 sm:[&_svg]:size-5">{t.icon}</span>
                  <div className="min-w-0">
                    <h3 className="text-sm leading-snug font-bold sm:text-base">{t.title}</h3>
                    <p className="mt-0.5 text-xs text-white/85 sm:mt-1 sm:text-sm">{t.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative mt-6 border-t border-white/20 pt-5 sm:mt-8 sm:pt-7">
            <p className="mb-3 text-xs font-bold tracking-wider text-white/80 uppercase">The right view for each person</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {ROLES.map((r) => (
                <div key={r.role} className="flex gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/20 [&_svg]:size-5">{r.icon}</span>
                  <div className="min-w-0">
                    <h3 className="font-bold">{r.role}</h3>
                    <p className="text-sm text-white/85">{r.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* 7. Download + pricing */}
      <Section tinted>
        <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-[1.4fr_1fr] lg:[.native-app_&]:grid-cols-1">
          <div className="bg-hero relative min-w-0 overflow-hidden rounded-3xl p-5 text-white shadow-lg shadow-primary/20 sm:rounded-[2rem] sm:p-10 [.native-app_&]:hidden">
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
              <Link href="/download" className="mt-3 inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-white/90 hover:text-white">
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

      {/* 8. Guides teaser */}
      <Section className="[.native-app_&]:hidden">
        <SectionHeading
          eyebrow="Guides & help"
          title="Learn how Mandal hisab works"
          description="Step-by-step guides for treasurers and members, and plain-language articles on hapta, upad and interest."
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {HOME_GUIDES.map((g) => (
            <GuideCard key={g.slug} guide={g} />
          ))}
        </div>
        <div className="mt-5 text-center">
          <Link href="/guides" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            Browse all guides <ArrowRight className="size-4" />
          </Link>
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
          <Link href="/faq" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-primary hover:underline [.native-app_&]:hidden">
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
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "h-12 w-full rounded-2xl border-white/40 bg-white/10 px-5 text-base text-white hover:bg-white/20 hover:text-white sm:w-auto",
                )}
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
