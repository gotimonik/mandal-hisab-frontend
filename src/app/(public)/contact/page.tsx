import Link from "next/link";
import { Clock, HelpCircle, Mail, MapPin, MessageCircle, Phone, LogIn } from "lucide-react";
import { site } from "@/config/site";
import { Container, PageHero, PlaceholderTag } from "@/features/public/blocks";
import { IconChip } from "@/components/app/bits";
import type { Tone } from "@/lib/tones";
import { ContactForm } from "@/features/public/contact/contact-form";

export const metadata = {
  title: "Contact us",
  description: "Questions about setting up your Mandal, support, feedback or partnerships — email, call or WhatsApp the MandalHisab team.",
};

function ContactCard({ icon, tone, title, value, href, note, external }: { icon: React.ReactNode; tone: Tone; title: string; value: string; href?: string; note?: string; external?: boolean }) {
  const inner = (
    <>
      <IconChip tone={tone}>{icon}</IconChip>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium text-muted-foreground">{title}</span>
        <span className="block font-semibold break-words">
          {value}
          <PlaceholderTag value={value} />
        </span>
        {note && <span className="block text-xs text-muted-foreground">{note}</span>}
      </span>
    </>
  );
  const cls = "flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card ring-1 ring-foreground/[0.06]";
  return href ? (
    <a href={href} className={`${cls} transition-colors hover:bg-muted/50`} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {inner}
    </a>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

export default function ContactPage() {
  const c = site.contact;
  return (
    <>
      <PageHero tone="green" eyebrow="Contact us" title="We'd love to hear from you" description={`Setting up your Mandal, a question about a feature, or an idea to make MandalHisab better — get in touch. ${c.responseTime}`} />
      <Container className="py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.4fr]">
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-bold">Reach us directly</h2>
            <ContactCard icon={<Mail />} tone="indigo" title="Email" value={c.email} href={`mailto:${c.email}`} note={c.responseTime} />
            {c.phone && <ContactCard icon={<Phone />} tone="emerald" title="Call us" value={c.phone} href={`tel:${c.phone.replace(/\s/g, "")}`} note={c.hours} />}
            {c.whatsapp && <ContactCard icon={<MessageCircle />} tone="emerald" title="WhatsApp" value={`+${c.whatsapp}`} href={`https://wa.me/${c.whatsapp}`} note="Message us any time" external />}
            <ContactCard icon={<MapPin />} tone="rose" title="Based in" value={c.city} />
            <ContactCard icon={<Clock />} tone="amber" title="Support hours" value={c.hours} />

            <div className="mt-2 flex flex-col gap-3 rounded-2xl bg-secondary/50 p-4 text-sm">
              <p className="flex items-start gap-2">
                <LogIn className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>
                  <b>Already using MandalHisab?</b> For questions about your own balance, hapta or upad, please{" "}
                  <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
                    sign in
                  </Link>{" "}
                  and check your notifications, or ask your Mandal&apos;s admin — they can see and correct your records. We can&apos;t change a Mandal&apos;s entries for them.
                </span>
              </p>
              <p className="flex items-start gap-2">
                <HelpCircle className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>
                  Many questions are answered in our{" "}
                  <Link href="/faq" className="font-medium text-primary underline-offset-4 hover:underline">
                    FAQ
                  </Link>
                  .
                </span>
              </p>
            </div>
          </div>

          <section aria-labelledby="contact-form" className="rounded-3xl bg-card p-5 shadow-card ring-1 ring-foreground/[0.06] sm:p-7">
            <h2 id="contact-form" className="text-lg font-bold">
              Send us a message
            </h2>
            <p className="mt-1 mb-5 text-sm text-muted-foreground">Fill this in and we&apos;ll get back to you by email or phone.</p>
            <ContactForm />
          </section>
        </div>
      </Container>
    </>
  );
}
