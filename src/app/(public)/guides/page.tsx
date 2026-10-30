import Link from "next/link";
import { BookOpen, Library, ListChecks } from "lucide-react";
import { IconChip } from "@/components/app/bits";
import { Container, PageHero, Section, SectionHeading } from "@/features/public/blocks";
import { CtaBand } from "@/features/public/cta-band";
import { GUIDES, GUIDE_CATEGORIES, guidesIn } from "@/features/public/guides";
import { GuideCard } from "@/features/public/guides/render";
import { JsonLd } from "@/features/public/json-ld";
import { NativeRedirect } from "@/features/public/native-redirect";
import { absUrl, breadcrumbLd, pageMeta } from "@/lib/seo";
import { site } from "@/config/site";

export const metadata = pageMeta({
  title: "Guides — how to run your Mandal's hisab",
  description: "Step-by-step guides to MandalHisab — starting a Mandal, collecting hapta, giving upad, crediting interest, withdrawals, reports and closing — plus articles on how savings Mandals work.",
  path: "/guides",
});

const POPULAR = ["start-a-new-mandal", "collect-hapta-at-the-monthly-meeting", "how-upad-interest-is-calculated"];

export default function GuidesPage() {
  const howtos = GUIDES.filter((g) => g.kind === "howto").length;
  const articles = GUIDES.length - howtos;
  return (
    <>
      <NativeRedirect />
      <JsonLd
        nodes={[
          breadcrumbLd([{ name: "Guides", path: "/guides" }]),
          {
            "@type": "CollectionPage",
            name: `${site.name} guides`,
            url: absUrl("/guides"),
            hasPart: GUIDES.map((g) => ({ "@type": g.kind === "howto" ? "HowTo" : "Article", name: g.title, url: absUrl(`/guides/${g.slug}`) })),
          },
        ]}
      />
      <PageHero eyebrow="Guides & help" title="Learn to run your Mandal's hisab, step by step" description="Practical guides for treasurers and members — from registering your Mandal to the final settlement — and plain-language articles on how savings Mandals work.">
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 font-semibold">
            <ListChecks className="size-4" /> {howtos} how-to guides
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 font-semibold">
            <BookOpen className="size-4" /> {articles} articles
          </span>
        </div>
      </PageHero>

      <nav aria-label="Topics" className="no-print sticky top-[calc(4rem+env(safe-area-inset-top))] z-30 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <Container className="scrollbar-none flex gap-2 overflow-x-auto py-2.5">
          {GUIDE_CATEGORIES.map((c) => (
            <a key={c.id} href={`#${c.id}`} className="shrink-0 rounded-full bg-card px-3.5 py-1.5 text-sm font-semibold text-muted-foreground ring-1 ring-foreground/10 hover:text-foreground">
              {c.title}
            </a>
          ))}
        </Container>
      </nav>

      <Section>
        <SectionHeading eyebrow="Start here" title="Most-read guides" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {POPULAR.map((s) => {
            const g = GUIDES.find((x) => x.slug === s)!;
            return <GuideCard key={s} guide={g} />;
          })}
        </div>
      </Section>

      {GUIDE_CATEGORIES.map((c, i) => {
        const list = guidesIn(c.id);
        if (!list.length) return null;
        return (
          <Section key={c.id} id={c.id} tinted={i % 2 === 0} className="scroll-mt-32">
            <div className="mb-5 flex items-start gap-3 sm:mb-8">
              <IconChip tone={c.tone} size="lg">
                <Library />
              </IconChip>
              <div className="min-w-0">
                <h2 className="text-[1.4rem] leading-tight font-extrabold tracking-tight sm:text-3xl">{c.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground sm:text-base">{c.description}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((g) => (
                <GuideCard key={g.slug} guide={g} />
              ))}
            </div>
          </Section>
        );
      })}

      <Section>
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { href: "/how-it-works", title: "How it works", text: "The whole journey, from the first hapta to closing." },
            { href: "/glossary", title: "Glossary", text: "Hapta, upad, vyaj, rojmel and other terms explained." },
            { href: "/faq", title: "FAQ", text: "Short answers to the questions people ask most." },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="rounded-3xl bg-card p-5 shadow-card ring-1 ring-foreground/[0.06] hover:ring-primary/30">
              <p className="font-bold">{l.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{l.text}</p>
            </Link>
          ))}
        </div>
        <CtaBand />
      </Section>
    </>
  );
}
