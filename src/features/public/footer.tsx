import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { site } from "@/config/site";
import { BrandMark } from "./brand";
import { Container, PlaceholderTag } from "./blocks";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/features", label: "All features" },
      { href: "/#how-it-works", label: "How it works" },
      { href: "/download", label: "Download the app" },
      { href: "/features#security", label: "Security & trust" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "Get started",
    links: [
      { href: "/register", label: "Create your Mandal" },
      { href: "/login", label: "Join with a code" },
      { href: "/login", label: "Sign in" },
      { href: "/forgot-password", label: "Forgot password" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About us" },
      { href: "/contact", label: "Contact us" },
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms of use" },
    ],
  },
] as const;

export function PublicFooter() {
  const c = site.contact;
  return (
    <footer className="no-print border-t bg-card pb-[env(safe-area-inset-bottom)]">
      <Container className="grid grid-cols-1 gap-10 py-12 sm:py-14 lg:grid-cols-[1.3fr_2fr]">
        <div className="flex flex-col gap-4">
          <BrandMark />
          <p className="max-w-sm text-sm text-muted-foreground">{site.description}</p>
          <ul className="flex flex-col gap-2 text-sm">
            <li>
              <a href={`mailto:${c.email}`} className="inline-flex items-center gap-2 hover:text-primary">
                <Mail className="size-4 text-muted-foreground" /> {c.email}
              </a>
              <PlaceholderTag value={c.email} />
            </li>
            {c.phone && (
              <li>
                <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 hover:text-primary">
                  <Phone className="size-4 text-muted-foreground" /> {c.phone}
                </a>
                <PlaceholderTag value={c.phone} />
              </li>
            )}
            {c.whatsapp && (
              <li>
                <a href={`https://wa.me/${c.whatsapp}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-primary">
                  <MessageCircle className="size-4 text-muted-foreground" /> WhatsApp us
                </a>
                <PlaceholderTag value={c.whatsapp} />
              </li>
            )}
            <li className="inline-flex items-center gap-2 text-muted-foreground">
              <MapPin className="size-4" /> {c.city}
              <PlaceholderTag value={c.city} />
            </li>
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 [.native-app_&]:hidden">
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="mb-3 text-sm font-bold">{col.title}</h2>
              <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="hover:text-foreground">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </Container>
      <div className="border-t">
        <Container className="flex flex-col gap-2 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {site.copyrightYear} {site.name}. {site.pricing.headline}.
          </p>
          <p>Available in {site.languages.join(" · ")}</p>
        </Container>
      </div>
    </footer>
  );
}
