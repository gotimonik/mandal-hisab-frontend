import Link from "next/link";
import { site } from "@/config/site";
import { Container, PageHero, Prose } from "@/features/public/blocks";
import { L, LegalUpdated } from "@/features/public/legal-draft-note";

export const metadata = {
  title: "Privacy policy",
  description: "What information MandalHisab collects, why, who can see it, where it is stored and the choices you have.",
};

export default function PrivacyPage() {
  const g = site.legal;
  const c = site.contact;
  return (
    <>
      <PageHero eyebrow="Legal" title="Privacy policy" description="What we collect, why we collect it, who can see it, and the choices you have — in plain English." />
      <Container className="py-12 sm:py-16">
        <LegalUpdated />
        <Prose>
          <p>
            This policy explains how <L v={g.operator} /> (&quot;we&quot;, &quot;us&quot;), which runs {site.name} (the website at {site.url} and the {site.name} Android and iOS apps), handles personal
            data. It is written with India&apos;s Digital Personal Data Protection Act, 2023 (&quot;DPDP Act&quot;) and the Information Technology Act, 2000 and its rules in mind.
          </p>

          <h2>1. Two kinds of information</h2>
          <p>{site.name} is a record-keeping tool for Mandals, savings groups, trusts and similar community organizations (each a &quot;Mandal&quot;). We handle two kinds of information:</p>
          <ul>
            <li>
              <b>Your account information</b>, which you give us when you sign up: your name, email address, and optionally your phone number, plus your password (stored only as a one-way hash —
              we can never see it).
            </li>
            <li>
              <b>Mandal records</b>, which a Mandal&apos;s admins and managers enter: members&apos; names, membership numbers and contact details, and the cash the Mandal collects and pays out —
              hapta, savings balances, upad and loans, interest, withdrawals, donations, expenses (including photos or PDFs of bills), receipts and notes.
            </li>
          </ul>
          <p>
            For Mandal records, the Mandal decides what to record and why. In DPDP Act terms the Mandal is the &quot;data fiduciary&quot; for its members&apos; records and we act on its instructions as
            a &quot;data processor&quot;. Questions about what your Mandal has recorded about you should go to your Mandal&apos;s admin first.
          </p>

          <h3>What we don&apos;t collect</h3>
          <p>
            {site.name} is for keeping a Mandal&apos;s own savings hisab, and it records <b>cash only</b>. It does not take or process payments of any kind. So we never ask for, and never store:
          </p>
          <ul>
            <li>bank account numbers, IFSC codes, debit or credit card details, UPI IDs or wallet details;</li>
            <li>PAN, Aadhaar or any other government ID number;</li>
            <li>any payment-gateway or online-banking information.</li>
          </ul>
          <p>Please don&apos;t type such details into notes or other free-text fields either.</p>

          <h2>2. What we collect automatically</h2>
          <ul>
            <li>
              <b>A sign-in cookie.</b> When you sign in we set a secure, HttpOnly cookie that keeps you signed in. Scripts on the page cannot read it. We also remember the last Mandal you opened.
            </li>
            <li>
              <b>A language cookie</b> that remembers whether you chose English, ગુજરાતી or हिन्दी.
            </li>
            <li>
              <b>Basic security logs</b>: the IP address and device/browser type used to sign in, the time of each session, and an audit log of changes made inside a Mandal (who did what, and when).
              These protect your account and the Mandal&apos;s records.
            </li>
          </ul>
          <ul>
            <li>
              <b>Google Analytics.</b> To understand how people use {site.name} — which pages are visited, roughly from which city or country, on what kind of device — we use Google
              Analytics. It sets its own cookies (named <code>_ga</code>) and sends Google the address of the page you open, your browser and device type, an approximate location, your role in the
              Mandal (admin, manager or member) and the kind of action you take — for example &quot;a payment was recorded&quot; or &quot;a member was added&quot;. It never receives names,
              emails, phone numbers, amounts, balances, notes or any other part of a Mandal&apos;s records; page addresses are sent with internal IDs removed. You can block it with your
              browser&apos;s privacy settings, a content blocker, or Google&apos;s{" "}
              <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">
                opt-out add-on
              </a>
              ; {site.name} works the same either way.
            </li>
          </ul>
          <p>We do not use advertising cookies, and we don&apos;t use analytics to show you ads or build advertising profiles.</p>

          <h2>3. Why we use it</h2>
          <ul>
            <li>To create and run your account and let you sign in.</li>
            <li>To provide the service: keep the Mandal&apos;s accounts, calculate balances and interest, produce receipts, statements and reports.</li>
            <li>To send service emails — email verification, password resets, invitations to join a Mandal and important notices. We don&apos;t send marketing email without your consent.</li>
            <li>To keep the service secure: rate-limiting sign-in attempts, detecting misuse and investigating problems.</li>
            <li>To meet legal obligations.</li>
          </ul>
          <p>
            <b>We never sell personal data, and we never show ads.</b>
          </p>

          <h2>4. Who can see what</h2>
          <ul>
            <li>
              <b>Members</b> see only their own records: their balance, hapta, interest, withdrawals, upad, payments and receipts.
            </li>
            <li>
              <b>Admins and managers</b> of a Mandal see that Mandal&apos;s records, limited by the permissions of their role. They cannot see any other Mandal.
            </li>
            <li>
              <b>Platform administrators</b> (our staff) can approve or suspend Mandals but do not get access to a Mandal&apos;s financial records through the app. We may access data only when needed
              to provide support you ask for, to fix a technical problem, or where the law requires it.
            </li>
          </ul>

          <h2>5. Service providers we use</h2>
          <p>We use a small number of trusted providers to run {site.name}. They process data only to provide their service to us:</p>
          <ul>
            <li>
              <b>Vercel</b> — hosts the website and app pages, and stores files you upload such as expense bills (Vercel Blob).
            </li>
            <li>
              <b>Render</b> — hosts the server (API) that processes requests.
            </li>
            <li>
              <b>MongoDB Atlas</b> — the database, located in the Mumbai (India) region.
            </li>
            <li>
              <b>Resend</b> — sends service emails such as verification, password reset and invitations.
            </li>
            <li>
              <b>Google Analytics</b> (Google) — measures how the website and app are used, as described in section 2.
            </li>
          </ul>
          <p>Some of these providers may process data on servers outside India as part of delivering their service. Where that happens, we rely on their contractual and security commitments.</p>

          <h2>6. How we protect it</h2>
          <ul>
            <li>All traffic is encrypted with HTTPS.</li>
            <li>Passwords are stored as one-way hashes; sign-in tokens are stored only as keyed hashes.</li>
            <li>Every request is checked on the server against the user&apos;s role and Mandal, so one Mandal can never see another&apos;s data.</li>
            <li>Financial entries are never silently edited or deleted — corrections are reversals that keep the original and a reason, recorded in the audit log.</li>
          </ul>
          <p>No system is perfectly secure. If a breach affects your personal data, we will inform you and the authorities as the law requires.</p>

          <h2>7. How long we keep it</h2>
          <p>
            We keep account information while your account is active. Mandal records are kept while the Mandal uses {site.name}, because financial records must stay complete and auditable. When a
            Mandal is closed or asks us to delete its data, we delete or anonymise it within a reasonable time, except where we must keep some records to meet legal, tax or dispute-resolution
            obligations. Security logs and expired sessions are removed automatically after they are no longer needed.
          </p>

          <h2>8. Your choices and rights</h2>
          <p>Under the DPDP Act you have the right to:</p>
          <ul>
            <li>get a summary of the personal data we hold about you and how it is processed;</li>
            <li>have inaccurate or incomplete data corrected and updated (you can edit your profile yourself; your Mandal&apos;s admin can correct Mandal records);</li>
            <li>ask for your data to be erased, where we are not required to keep it;</li>
            <li>withdraw consent you have given, which stops future processing based on that consent;</li>
            <li>nominate another person to exercise these rights if you die or become unable to;</li>
            <li>have your grievance addressed by our grievance officer (below), and if you are not satisfied, complain to the Data Protection Board of India.</li>
          </ul>
          <p>
            <b>Export:</b> admins can download members, statements, reports and the cash book as CSV files at any time, and members can download their own statement. <b>Sign out everywhere:</b> you
            can end all your sessions from your Account page.
          </p>
          <p>
            To make a request, email <a href={`mailto:${c.email}`}>{c.email}</a>. We may need to confirm your identity first. For records about you inside a Mandal, we may pass your request to that
            Mandal&apos;s admin, who is responsible for those records.
          </p>

          <h2>9. Children</h2>
          <p>
            {site.name} accounts are meant for adults. If a Mandal records information about a person under 18 (for example, as a member whose parent manages their savings), the Mandal is
            responsible for obtaining verifiable consent from a parent or lawful guardian. We do not knowingly track or target children or show them advertising.
          </p>

          <h2>10. Changes to this policy</h2>
          <p>If we change this policy in a meaningful way, we will update the date at the top and tell signed-in users in the app or by email before the change takes effect.</p>

          <h2>11. Grievance officer and contact</h2>
          <p>
            Grievance officer: <L v={g.grievanceOfficer} />
            <br />
            Email: <a href={`mailto:${g.grievanceEmail}`}>{g.grievanceEmail}</a>
            <br />
            Address: <L v={g.address} />
          </p>
          <p>
            For anything else, see <Link href="/contact">Contact us</Link>.
          </p>
        </Prose>
      </Container>
    </>
  );
}
