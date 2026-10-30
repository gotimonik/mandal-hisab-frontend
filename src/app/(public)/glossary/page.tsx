import Link from "next/link";
import { Container, PageHero, Section } from "@/features/public/blocks";
import { CtaBand } from "@/features/public/cta-band";
import { JsonLd } from "@/features/public/json-ld";
import { NativeRedirect } from "@/features/public/native-redirect";
import { absUrl, breadcrumbLd, pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Mandal glossary: hapta, upad, vyaj and more",
  description: "Plain-language meanings of the words used in Mandal and savings-group accounts — hapta, upad, vyaj, mudal, jama, udhar, rojmel, khatavahi — in English, Gujarati and Hindi.",
  path: "/glossary",
});

type Term = { term: string; local?: string; def: string; link?: { href: string; label: string } };

const TERMS: Term[] = [
  { term: "Admin", def: "The person (or people) who manage a Mandal in MandalHisab: settings, members, money, reports and who has access. Usually the treasurer.", link: { href: "/guides/roles-and-inviting-people", label: "Roles" } },
  { term: "Audit log", def: "A record of who did what and when — every payment recorded, approval given and reversal made. It can't be edited." },
  { term: "Balance sheet", def: "A report of what the Mandal has (cash, upad given out) and what it owes (members' savings, its own funds) on a given date. The two sides are always equal." },
  { term: "Bachat", local: "બચત · बचत", def: "Savings. A bachat mandal is a group that saves together every month." },
  { term: "Carry forward", def: "Unpaid hapta or interest doesn't disappear at the end of the month — it is carried into the next month and stays due until collected." },
  { term: "Cash book (Rojmel)", local: "રોજમેળ · रोकड़ बही", def: "The day book of the Mandal's cash: opening cash, every receipt and payment, and closing cash.", link: { href: "/guides/cash-book-expenses-and-donations", label: "Cash book guide" } },
  { term: "Defer", def: "To move an installment's due date later, for example when the meeting agrees to give a member more time. Recorded with a reason." },
  { term: "Double-entry", def: "The bookkeeping method where every transaction is recorded on two sides — for example cash up and a member's savings up — so the books always balance.", link: { href: "/guides/double-entry-for-mandals", label: "Explained simply" } },
  { term: "EMI loan", def: "A formal loan repaid in fixed monthly installments that cover both principal and interest, on a schedule agreed in advance. Different from upad, which has no fixed schedule." },
  { term: "Financial year", def: "The 12-month period a Mandal uses for its yearly accounts. In India it usually runs April to March, but a Mandal can choose another starting month." },
  { term: "Flat interest", def: "Interest worked out on the original loan amount for the whole term, even as it is repaid. Reducing-balance interest is usually fairer to the borrower." },
  { term: "Hapta", local: "હપ્તો · किस्त", def: "The fixed amount each member pays into the Mandal every month (or week, or quarter). It builds the member's savings.", link: { href: "/guides/set-up-monthly-hapta", label: "Hapta guide" } },
  { term: "Hapta share", def: "One hapta per month counts as one share. A family paying 3 haptas holds 3 shares and gets 3 parts when the Mandal's own money is shared out." },
  { term: "Income & expenditure", def: "A report of the Mandal's income (interest, donations, fees) and expenses over a period, showing the surplus or deficit." },
  { term: "Jama", local: "જમા · जमा", def: "Credit — money added. A hapta payment is jama in the member's savings." },
  { term: "Join code", def: "A short code for each Mandal in MandalHisab. People enter it after signing up to ask to join; the admin approves the request." },
  { term: "Khajanchi", local: "ખજાનચી · कोषाध्यक्ष", def: "The treasurer — the person who collects, keeps and pays out the Mandal's money and keeps the hisab." },
  { term: "Khatavahi", local: "ખાતાવહી · खाता बही", def: "The ledger: an account for each member or head, showing every entry and the running balance." },
  { term: "Mandal", local: "મંડળ · मंडल", def: "A group or association. In savings, a group of families, friends or neighbours who pool money every month and lend to each other.", link: { href: "/guides/what-is-a-mandal", label: "What is a Mandal?" } },
  { term: "Mandal's own money", def: "Money that belongs to the Mandal rather than to any one member's savings — donations, membership fees and other income. Shared by hapta shares at closing." },
  { term: "Mantri", local: "મંત્રી · सचिव", def: "The secretary, who keeps minutes of meetings and records the Mandal's decisions." },
  { term: "Mudal", local: "મુદ્દલ · मूलधन", def: "Principal — the original amount of an upad or loan, on which interest is charged." },
  { term: "Opening balance", def: "A member's savings at the date the Mandal started using MandalHisab, carried over from the old register." },
  { term: "Part payment", def: "Paying less than the full amount due. The rest stays due and is carried forward." },
  { term: "Passbook", def: "A member's savings statement: each hapta, interest credit and withdrawal with a running balance." },
  { term: "Pahonch (receipt)", local: "પહોંચ · रसीद", def: "Proof that money was received. MandalHisab gives every payment a numbered receipt." },
  { term: "Pramukh", local: "પ્રમુખ · अध्यक्ष", def: "The president or head of the Mandal, who chairs meetings." },
  { term: "Reducing-balance interest", def: "Interest charged only on the amount still outstanding, so it falls as the loan is repaid. Monthly upad interest works this way." },
  { term: "Reversal", def: "The way a mistake is corrected: an opposite entry cancels the wrong one, with a reason. The original stays visible, so nothing disappears from the books." },
  { term: "Settlement", def: "Closing a Mandal: every member is paid their savings plus their share of the Mandal's own money, minus any upad they still owe.", link: { href: "/guides/close-and-settle-a-mandal", label: "Closing guide" } },
  { term: "Trial balance", def: "A list of every account's total debits and credits. If the books are correct, the two columns are equal." },
  { term: "Udhar", local: "ઉધાર · नामे", def: "Debit — money taken out. A withdrawal is udhar in the member's savings." },
  { term: "Upad", local: "ઉપાડ · उधार", def: "Money a member takes from the Mandal's pooled cash and pays back later, with interest each month on what's outstanding.", link: { href: "/guides/give-upad-and-collect-interest", label: "Upad guide" } },
  { term: "Voucher", def: "A numbered record of money paid out — a withdrawal or a settlement payout — that can be printed and signed." },
  { term: "Vyaj", local: "વ્યાજ · ब्याज", def: "Interest. In Mandals it is usually quoted per month — 1% a month is 12% a year.", link: { href: "/guides/how-upad-interest-is-calculated", label: "Interest explained" } },
  { term: "Waive", def: "To cancel an amount that's due, for example when the Mandal agrees to excuse a member's hapta. Always recorded with a reason." },
  { term: "Withdrawal", def: "Cash paid to a member out of their own savings. Not the same as upad, which is a loan from the fund.", link: { href: "/guides/record-a-withdrawal", label: "Withdrawals guide" } },
];

const sorted = [...TERMS].sort((a, b) => a.term.localeCompare(b.term));
const letters = [...new Set(sorted.map((t) => t.term[0].toUpperCase()))];
const anchor = (t: string) => `term-${t.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

export default function GlossaryPage() {
  return (
    <>
      <NativeRedirect />
      <JsonLd
        nodes={[
          breadcrumbLd([{ name: "Glossary", path: "/glossary" }]),
          {
            "@type": "DefinedTermSet",
            name: "Mandal and savings-group glossary",
            url: absUrl("/glossary"),
            hasDefinedTerm: sorted.map((t) => ({ "@type": "DefinedTerm", name: t.term, description: t.def, url: absUrl(`/glossary#${anchor(t.term)}`) })),
          },
        ]}
      />
      <PageHero tone="warm" eyebrow="Glossary" title="The words of Mandal hisab, explained" description="Hapta, upad, vyaj, jama, udhar, rojmel — the everyday terms of Mandal accounts, with their Gujarati and Hindi names and what they mean in MandalHisab." />

      <nav aria-label="Letters" className="no-print sticky top-[calc(4rem+env(safe-area-inset-top))] z-30 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <Container className="scrollbar-none flex gap-1.5 overflow-x-auto py-2.5">
          {letters.map((l) => (
            <a key={l} href={`#letter-${l}`} className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-card text-sm font-bold text-muted-foreground ring-1 ring-foreground/10 hover:text-foreground">
              {l}
            </a>
          ))}
        </Container>
      </nav>

      <Container className="flex flex-col gap-10 py-10 sm:py-14">
        {letters.map((l) => (
          <section key={l} id={`letter-${l}`} className="scroll-mt-32">
            <h2 className="mb-3 text-2xl font-extrabold text-primary">{l}</h2>
            <dl className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {sorted
                .filter((t) => t.term[0].toUpperCase() === l)
                .map((t) => (
                  <div key={t.term} id={anchor(t.term)} className="scroll-mt-32 rounded-2xl bg-card p-4 shadow-card ring-1 ring-foreground/[0.06]">
                    <dt className="flex flex-wrap items-baseline gap-x-2 font-bold">
                      {t.term}
                      {t.local && <span className="text-sm font-medium text-muted-foreground">{t.local}</span>}
                    </dt>
                    <dd className="mt-1.5 text-sm leading-6 text-pretty text-muted-foreground">
                      {t.def}
                      {t.link && (
                        <>
                          {" "}
                          <Link href={t.link.href} className="font-medium whitespace-nowrap text-primary hover:underline">
                            {t.link.label} →
                          </Link>
                        </>
                      )}
                    </dd>
                  </div>
                ))}
            </dl>
          </section>
        ))}
      </Container>

      <Section tinted>
        <CtaBand />
      </Section>
    </>
  );
}
