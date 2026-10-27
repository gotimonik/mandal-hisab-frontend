import Link from "next/link";
import { ChevronDown, MessageCircleQuestion } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { IconChip } from "@/components/app/bits";
import { Container, PageHero } from "@/features/public/blocks";
import { FAQ_GROUPS } from "@/features/public/features/faq-data";

export const metadata = {
  title: "Frequently asked questions",
  description: "Answers about starting a Mandal, members, hapta, upad and interest, accuracy, privacy, pricing, the phone app and languages.",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_GROUPS.flatMap((g) => g.items).map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

export default function FaqPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PageHero eyebrow="FAQ" title="Questions, answered" description="Everything people usually ask before moving their Mandal's hisab to MandalHisab." />

      <Container className="grid grid-cols-1 gap-8 py-10 sm:py-14 lg:grid-cols-[14rem_1fr]">
        <nav aria-label="Topics" className="no-print scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 lg:sticky lg:top-24 lg:mx-0 lg:flex-col lg:self-start lg:overflow-visible lg:px-0">
          {FAQ_GROUPS.map((g) => (
            <a key={g.id} href={`#${g.id}`} className="shrink-0 rounded-full bg-card px-3.5 py-1.5 text-sm font-semibold text-muted-foreground ring-1 ring-foreground/10 hover:text-foreground lg:rounded-xl lg:bg-transparent lg:ring-0">
              {g.title}
            </a>
          ))}
        </nav>

        <div className="flex min-w-0 flex-col gap-10">
          {FAQ_GROUPS.map((g) => (
            <section key={g.id} id={g.id} className="scroll-mt-24">
              <h2 className="mb-3 text-xl font-extrabold tracking-tight">{g.title}</h2>
              <div className="flex flex-col gap-2">
                {g.items.map((f) => (
                  <details key={f.q} className="group rounded-2xl bg-card shadow-card ring-1 ring-foreground/[0.06] [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex cursor-pointer list-none items-center gap-3 p-4 text-base font-semibold">
                      <span className="min-w-0 flex-1">{f.q}</span>
                      <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="px-4 pb-4 text-sm leading-6 text-pretty text-muted-foreground">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}

          <div className="flex flex-col gap-4 rounded-3xl bg-card p-5 shadow-card ring-1 ring-foreground/[0.06] sm:flex-row sm:items-center sm:p-6">
            <IconChip tone="indigo" size="lg">
              <MessageCircleQuestion />
            </IconChip>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold">Still have questions?</h2>
              <p className="text-sm text-muted-foreground">We&apos;re happy to help you set up your Mandal or answer anything not covered here.</p>
            </div>
            <Link href="/contact" className={buttonVariants({ size: "lg" })}>
              Contact us
            </Link>
          </div>
        </div>
      </Container>
    </>
  );
}
