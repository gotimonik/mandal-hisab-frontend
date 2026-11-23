import { site } from "@/config/site";
import { Section, SectionHeading } from "@/features/public/blocks";
import { TestimonialSlider } from "./testimonial-slider";
import { initials } from "./initials";

/** "What Mandals say" — real feedback from site.testimonials, as a slider. Hidden while there's nothing to show. */
export function Testimonials() {
  const list = site.testimonials;
  const named = site.namedUsers.filter((n) => !list.some((t) => t.name === n));
  if (list.length === 0 && named.length === 0) return null;
  return (
    <Section id="what-mandals-say">
      <SectionHeading eyebrow="What Mandals say" title="Treasurers and members on MandalHisab" center />
      {list.length > 0 && <TestimonialSlider items={list} />}
      {named.length > 0 && (
        <div className="mx-auto mt-6 max-w-4xl text-center sm:mt-8">
          <p className="mb-3 text-xs font-bold tracking-wider text-muted-foreground uppercase">Also keeping their Mandal&apos;s hisab on MandalHisab</p>
          <ul className="flex flex-wrap justify-center gap-2">
            {named.map((n) => (
              <li key={n} className="inline-flex items-center gap-2 rounded-full bg-card py-1.5 pr-3.5 pl-1.5 text-sm font-semibold shadow-card ring-1 ring-foreground/[0.06]">
                <span aria-hidden className="bg-hero flex size-7 items-center justify-center rounded-full text-[11px] font-bold text-white">
                  {initials(n)}
                </span>
                {n}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Section>
  );
}
