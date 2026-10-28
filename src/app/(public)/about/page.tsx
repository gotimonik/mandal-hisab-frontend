import Link from "next/link";
import { ArrowRight, BookOpenCheck, Eye, HandHeart, Languages, Lock, MessageSquareText, PiggyBank, ScrollText, Smartphone, Users, Landmark, Building2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { site } from "@/config/site";
import { FeatureCard, PageHero, Section, SectionHeading } from "@/features/public/blocks";
import { IconChip } from "@/components/app/bits";
import { NativeRedirect } from "@/features/public/native-redirect";
import { pageMeta } from "@/lib/seo";
import { Breadcrumb } from "@/features/public/json-ld";

export const metadata = pageMeta({ title: "About us", description: "Why MandalHisab exists, what we believe and who it's for — simple, transparent hisab for Mandals, savings groups and trusts.", path: "/about" });

const BELIEFS = [
  { icon: <Eye />, tone: "indigo", title: "Every member can see", text: "Members see their own balance, hapta, interest and receipts on their phone — no need to ask the treasurer or wait for the yearly meeting." },
  { icon: <BookOpenCheck />, tone: "emerald", title: "Accurate to the paisa", text: "Every rupee is posted to a balanced, double-entry ledger. Totals always add up, and reports match the cash book." },
  { icon: <ScrollText />, tone: "violet", title: "History is never overwritten", text: "Mistakes are corrected with a reversal that keeps the original entry and the reason. The audit log shows who did what, and when." },
  { icon: <Smartphone />, tone: "orange", title: "Simple on a phone", text: "Built for the treasurer collecting cash at the monthly meeting: big buttons, quick actions, and it works on any phone browser." },
  { icon: <Languages />, tone: "sky", title: "In your language", text: `Use MandalHisab in ${site.languages.join(", ")}. Everyone in the Mandal can switch to the language they read best.` },
  { icon: <Lock />, tone: "rose", title: "Your data stays yours", text: "Each Mandal's data is kept separate. We don't show ads or sell data, and you can export your records whenever you like." },
] as const;

const AUDIENCE = [
  { icon: <HandHeart />, tone: "indigo", title: "Mandals", text: "Monthly hapta, member savings, upad to members and interest shared back to everyone." },
  { icon: <PiggyBank />, tone: "emerald", title: "Savings groups", text: "Bachat mandals and self-help groups that collect regularly and lend from the common fund." },
  { icon: <Landmark />, tone: "violet", title: "Trusts", text: "Donations with receipts, approved expenses, accounts and reports the trustees can check." },
  { icon: <Building2 />, tone: "sky", title: "Community & society groups", text: "Festival committees, samaj groups and housing societies that collect and spend for members." },
] as const;

export default function AboutPage() {
  return (
    <>
      <Breadcrumb name="About us" path="/about" />
      <NativeRedirect />
      <PageHero eyebrow="About us" title="Hisab everyone can trust — and check." description="MandalHisab helps the people who look after a group's money keep clear, honest records, and lets every member see where things stand." />

      <Section>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          <SectionHeading eyebrow="Why we exist" title="Mandals run on trust. The records should make that easy." className="mb-0" />
          <div className="flex flex-col gap-4 text-base text-pretty text-muted-foreground">
            <p>
              Across India, Mandals, savings groups and trusts quietly do something remarkable: neighbours and families pool money every month, lend to each other when it&apos;s needed, and share the
              interest back. All of it rests on trust in the people keeping the accounts.
            </p>
            <p>
              But the hisab usually lives in a paper register, a spreadsheet on one person&apos;s laptop, or a pile of WhatsApp screenshots. It&apos;s hard for members to check their own balance, hard
              for a new treasurer to take over, and a single mistake can take hours to find.
            </p>
            <p>
              We built MandalHisab so the records are <b className="text-foreground">clear, complete and visible to the people they belong to</b> — without making the treasurer&apos;s job any harder.
            </p>
          </div>
        </div>
      </Section>

      <Section tinted>
        <SectionHeading eyebrow="What we believe" title="Six promises we build around" center />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BELIEFS.map((b) => (
            <FeatureCard key={b.title} icon={b.icon} tone={b.tone} title={b.title}>
              {b.text}
            </FeatureCard>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="Who it's for" title="Any group that collects, saves and lends together" description="If your group keeps money on behalf of its members, MandalHisab is made for you." />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {AUDIENCE.map((a) => (
            <FeatureCard key={a.title} icon={a.icon} tone={a.tone} title={a.title}>
              {a.text}
            </FeatureCard>
          ))}
        </div>
      </Section>

      <Section tinted>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-3 rounded-3xl bg-card p-6 shadow-card ring-1 ring-foreground/[0.06]">
            <IconChip tone="amber">
              <MessageSquareText />
            </IconChip>
            <h2 className="text-xl font-bold">We build it with treasurers</h2>
            <p className="text-sm text-pretty text-muted-foreground">
              The features in MandalHisab come from the way real Mandals work: hapta collected in cash at the monthly meeting, part payments, upad at a monthly rate, interest credited to every
              member, and a closing settlement when the Mandal ends. When something doesn&apos;t fit how your group works, tell us — that&apos;s how the app gets better.
            </p>
          </div>
          <div className="flex flex-col gap-3 rounded-3xl bg-card p-6 shadow-card ring-1 ring-foreground/[0.06]">
            <IconChip tone="rose">
              <Users />
            </IconChip>
            <h2 className="text-xl font-bold">Privacy by design</h2>
            <p className="text-sm text-pretty text-muted-foreground">
              Admins, managers and members each see only what their role allows, and members see only their own savings. Every request is checked on the server, sensitive actions need a reason, and
              nothing is ever silently changed. Read our{" "}
              <Link href="/privacy" className="font-medium text-primary underline-offset-4 hover:underline">
                privacy policy
              </Link>{" "}
              for the details.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <div className="bg-hero relative overflow-hidden rounded-3xl p-6 text-white shadow-lg shadow-primary/20 sm:p-10">
          <div aria-hidden className="pointer-events-none absolute -top-16 -right-12 size-56 rounded-full bg-white/10" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Bring your Mandal&apos;s hisab online</h2>
              <p className="mt-2 text-white/85">{site.pricing.headline}. Set up in a few minutes.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/register" className={cn(buttonVariants({ size: "lg" }), "h-12 rounded-2xl bg-white px-5 text-primary hover:bg-white/90")}>
                Create your Mandal <ArrowRight />
              </Link>
              <Link href="/contact" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "h-12 rounded-2xl border-white/40 bg-white/10 px-5 text-white hover:bg-white/20")}>
                Talk to us
              </Link>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
