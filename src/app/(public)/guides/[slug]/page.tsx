import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, Users } from "lucide-react";
import { Container, PageHero, Prose, Section } from "@/features/public/blocks";
import { CtaBand } from "@/features/public/cta-band";
import { GUIDES, categoryOf, getGuide, plain, readMinutes, slugify, wordCount } from "@/features/public/guides";
import { GuideBody, GuideCard } from "@/features/public/guides/render";
import { JsonLd } from "@/features/public/json-ld";
import { NativeRedirect } from "@/features/public/native-redirect";
import { OG_IMAGE, absUrl, breadcrumbLd, pageMeta } from "@/lib/seo";
import { site } from "@/config/site";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: PageProps<"/guides/[slug]">) {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) return {};
  const meta = pageMeta({ title: g.title, description: g.description, path: `/guides/${g.slug}` });
  return { ...meta, openGraph: { ...meta.openGraph, type: "article", publishedTime: g.updated, modifiedTime: g.updated } };
}

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

export default async function GuidePage({ params }: PageProps<"/guides/[slug]">) {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) notFound();
  const cat = categoryOf(g);
  const toc = g.body.filter((b) => b.type === "h2").map((b) => b.text);
  const related = (g.related ?? []).map(getGuide).filter((x) => !!x);
  const steps = g.body.flatMap((b) => (b.type === "steps" ? b.items : []));

  const author = { "@type": "Organization", name: site.name, url: site.url };
  const ld =
    g.kind === "howto" && steps.length
      ? {
          "@type": "HowTo",
          name: g.title,
          description: g.description,
          url: absUrl(`/guides/${g.slug}`),
          image: absUrl(OG_IMAGE.url),
          dateModified: g.updated,
          step: steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: plain(s.title), text: plain(s.text || s.title) })),
        }
      : {
          "@type": "Article",
          headline: g.title,
          description: g.description,
          url: absUrl(`/guides/${g.slug}`),
          image: absUrl(OG_IMAGE.url),
          datePublished: g.updated,
          dateModified: g.updated,
          wordCount: wordCount(g),
          author,
          publisher: author,
          inLanguage: "en-IN",
        };

  return (
    <>
      <NativeRedirect />
      <JsonLd
        nodes={[
          breadcrumbLd([
            { name: "Guides", path: "/guides" },
            { name: g.title, path: `/guides/${g.slug}` },
          ]),
          ld,
        ]}
      />
      <PageHero eyebrow={<Link href={`/guides#${cat.id}`} className="hover:underline">{cat.title}</Link>} title={g.title} description={g.description}>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/85">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-4" /> {readMinutes(g)} min read
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-4" /> {g.audience}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-4" /> Updated {fmtDate(g.updated)}
          </span>
        </div>
      </PageHero>

      <Container className="grid grid-cols-1 gap-8 py-10 sm:py-14 lg:grid-cols-[1fr_16rem] lg:gap-12">
        <article className="min-w-0">
          <Link href="/guides" className="no-print mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            <ArrowLeft className="size-4" /> All guides
          </Link>
          <Prose className="[&>p:first-child]:mt-0">
            <GuideBody guide={g} />
          </Prose>
          <p className="mt-10 max-w-3xl rounded-2xl bg-secondary/50 p-4 text-sm text-muted-foreground">
            Something in this guide doesn&apos;t match what you see, or your Mandal works differently?{" "}
            <Link href="/contact" className="font-medium text-primary hover:underline">
              Tell us
            </Link>{" "}
            — we update the guides as the app changes.
          </p>
        </article>

        {toc.length > 1 && (
          <aside className="no-print hidden lg:block">
            <nav aria-label="On this page" className="sticky top-24 rounded-2xl bg-card p-4 shadow-card ring-1 ring-foreground/[0.06]">
              <p className="mb-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">On this page</p>
              <ul className="flex flex-col gap-2 text-sm">
                {toc.map((t) => (
                  <li key={t}>
                    <a href={`#${slugify(t)}`} className="text-muted-foreground hover:text-foreground">
                      {t}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        )}
      </Container>

      {related.length > 0 && (
        <Section tinted>
          <h2 className="mb-5 text-xl font-extrabold tracking-tight sm:text-2xl">Related guides</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {related.map((r) => (
              <GuideCard key={r.slug} guide={r} />
            ))}
          </div>
        </Section>
      )}

      <Section>
        <CtaBand />
      </Section>
    </>
  );
}
