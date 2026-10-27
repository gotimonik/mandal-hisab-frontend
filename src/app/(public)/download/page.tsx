import Link from "next/link";
import { ArrowRight, Globe, MonitorSmartphone, MoreVertical, Plus, RefreshCw, Share, Smartphone, Wifi } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { IconChip } from "@/components/app/bits";
import { cn } from "@/lib/utils";
import { FeatureCard, PageHero, Section, SectionHeading } from "@/features/public/blocks";
import { StoreBadges } from "@/features/public/store-badges";
import { site } from "@/config/site";

export const metadata = {
  title: "Download the app",
  description: "MandalHisab for Android and iPhone is coming soon. Use it today in any phone browser and add it to your home screen.",
};

const comingSoon = !site.stores.android || !site.stores.ios;

function Steps({ tone, icon, title, steps }: { tone: "emerald" | "sky"; icon: React.ReactNode; title: string; steps: React.ReactNode[] }) {
  return (
    <div className="flex h-full flex-col gap-4 rounded-3xl bg-card p-5 shadow-card ring-1 ring-foreground/[0.06] sm:p-6">
      <div className="flex items-center gap-3">
        <IconChip tone={tone}>{icon}</IconChip>
        <h3 className="text-lg font-bold">{title}</h3>
      </div>
      <ol className="flex flex-col gap-3">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-3 text-sm">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
            <span className="min-w-0 pt-0.5">{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function DownloadPage() {
  return (
    <>
      <PageHero
        eyebrow="Download"
        title={comingSoon ? "MandalHisab on your phone" : "Get the MandalHisab app"}
        description={comingSoon ? "The Android and iPhone apps are on the way. You don't have to wait — everything already works in your phone's browser, and you can add it to your home screen with its own icon." : "Get the app for Android or iPhone, or use it in any browser."}
      >
        <StoreBadges />
      </PageHero>

      <Section>
        <SectionHeading eyebrow="Use it today" title="Add MandalHisab to your home screen" description="Open MandalHisab from an icon on your phone, just like an app. Takes less than a minute." />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Steps
            tone="emerald"
            icon={<Smartphone />}
            title="Android (Chrome)"
            steps={[
              <>
                Open <b>{site.url.replace(/^https?:\/\//, "")}</b> in Chrome and sign in.
              </>,
              <>
                Tap the <MoreVertical className="inline size-4 align-text-bottom" /> menu at the top right.
              </>,
              <>
                Tap <b>Add to Home screen</b>.
              </>,
              <>Tap <b>Add</b>. MandalHisab now has its own icon.</>,
            ]}
          />
          <Steps
            tone="sky"
            icon={<Smartphone />}
            title="iPhone (Safari)"
            steps={[
              <>
                Open <b>{site.url.replace(/^https?:\/\//, "")}</b> in Safari and sign in.
              </>,
              <>
                Tap the <Share className="inline size-4 align-text-bottom" /> Share button at the bottom.
              </>,
              <>
                Scroll down and tap <b>Add to Home Screen</b> <Plus className="inline size-4 align-text-bottom" />.
              </>,
              <>Tap <b>Add</b>. MandalHisab now has its own icon.</>,
            ]}
          />
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/register" className={buttonVariants({ size: "lg" })}>
            Create your Mandal <ArrowRight />
          </Link>
          <Link href="/login" className={buttonVariants({ size: "lg", variant: "outline" })}>
            Sign in
          </Link>
        </div>
      </Section>

      <Section tinted>
        <SectionHeading eyebrow="Good to know" title="What you need" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard icon={<MonitorSmartphone />} tone="indigo" title="Any smartphone or computer">
            A recent Android phone, iPhone, tablet, laptop or desktop with an up-to-date browser.
          </FeatureCard>
          <FeatureCard icon={<Wifi />} tone="sky" title="An internet connection">
            Your Mandal&apos;s books are kept online, so you need to be connected to record or see entries.
          </FeatureCard>
          <FeatureCard icon={<RefreshCw />} tone="emerald" title="One account everywhere">
            Sign in with the same email on the phone app, the browser and the computer — you see the same Mandal and the same numbers.
          </FeatureCard>
          <FeatureCard icon={<Globe />} tone="violet" title="Nothing to install today">
            The browser version has every feature. When the store apps arrive, just sign in — nothing to move over.
          </FeatureCard>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          {site.pricing.headline}. Questions? <Link href="/faq" className="font-medium text-primary hover:underline">Read the FAQ</Link> or <Link href="/contact" className={cn("font-medium text-primary hover:underline")}>contact us</Link>.
        </p>
      </Section>
    </>
  );
}
