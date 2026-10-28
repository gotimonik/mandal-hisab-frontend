import Link from "next/link";
import { site } from "@/config/site";
import { Container, PageHero, Prose } from "@/features/public/blocks";
import { L, LegalUpdated } from "@/features/public/legal-draft-note";
import { pageMeta } from "@/lib/seo";
import { Breadcrumb } from "@/features/public/json-ld";

export const metadata = pageMeta({ title: "Terms of use", description: "The rules for using MandalHisab: who can use it, your responsibilities, what MandalHisab is and isn't, and our limits of liability.", path: "/terms" });

export default function TermsPage() {
  const g = site.legal;
  return (
    <>
      <Breadcrumb name="Terms of use" path="/terms" />
      <PageHero eyebrow="Legal" title="Terms of use" description="The agreement between you and us when you use MandalHisab. Please read it — it's written to be understood." />
      <Container className="py-12 sm:py-16">
        <LegalUpdated />
        <Prose>
          <p>
            These terms are an agreement between you and <L v={g.operator} /> (&quot;we&quot;, &quot;us&quot;) for using {site.name} — the website at {site.url}, the Android and iOS apps and the
            related services (together, the &quot;Service&quot;). By creating an account or using the Service you agree to these terms and to our <Link href="/privacy">Privacy policy</Link>. If you
            don&apos;t agree, please don&apos;t use the Service.
          </p>

          <h2>1. What {site.name} is — and isn&apos;t</h2>
          <p>
            {site.name} is a <b>record-keeping tool</b>. It helps Mandals, savings groups, trusts and similar community organizations (each a &quot;Mandal&quot;) keep accounts of hapta, savings, upad and
            loans, interest, withdrawals, donations and expenses, and share those records with their members.
          </p>
          <ul>
            <li>
              {site.name} is <b>not a bank, NBFC, payment system, chit fund or investment adviser</b>. We do not accept deposits, hold money, lend money or move money between anyone. All money is
              collected, kept and paid out by the Mandal itself.
            </li>
            <li>
              <b>Cash only.</b> The Service does not take, process or route payments of any kind — no cards, UPI, net banking, wallets or payment gateways. Every amount in {site.name} is cash
              handed over in person and recorded by the Mandal.
            </li>
            <li>Interest, balances and schedules are calculated from the rules and entries the Mandal sets up. They are not financial, legal or tax advice.</li>
            <li>Each Mandal is responsible for complying with any laws that apply to how it collects, lends and manages money.</li>
          </ul>

          <h2>2. Who can use the Service</h2>
          <p>
            You must be at least 18 years old and able to enter a binding contract to create an account. If you create a Mandal or use the Service on behalf of a group, you confirm you are authorised
            by that group to do so.
          </p>

          <h2>3. Your account</h2>
          <ul>
            <li>Give accurate information and keep it up to date.</li>
            <li>Keep your password private. You are responsible for activity on your account. Tell us straight away if you think someone else has used it.</li>
            <li>Use &quot;Sign out everywhere&quot; on your Account page if you lose a phone or shared a device.</li>
          </ul>

          <h2>4. Responsibilities of Mandal admins</h2>
          <p>Admins and managers who enter records for a Mandal agree that:</p>
          <ul>
            <li>
              <b>They are responsible for the accuracy of the records</b> they enter, approve or reverse, and for the Mandal&apos;s decisions (rates, hapta amounts, approvals, settlements).
            </li>
            <li>
              They have a proper basis — including members&apos; consent where needed — to record members&apos; personal and financial information, to invite them, and to share records with them.
            </li>
            <li>They will give members access to their own records and correct mistakes when asked.</li>
            <li>They will give admin and manager roles only to people the Mandal trusts with that access.</li>
          </ul>
          <p>
            The Mandal owns the records it enters. We store and process them to provide the Service as described in our <Link href="/privacy">Privacy policy</Link>.
          </p>

          <h2>5. Acceptable use</h2>
          <p>You must not:</p>
          <ul>
            <li>use the Service for anything unlawful, fraudulent or misleading — including running unregistered deposit, chit or lending schemes, money laundering or hiding the true accounts from members;</li>
            <li>enter information about people you have no right to record, or upload content that is illegal, abusive or infringes someone else&apos;s rights;</li>
            <li>try to access another Mandal&apos;s data, another person&apos;s account, or parts of the Service you aren&apos;t permitted to use;</li>
            <li>probe, scan, overload or disrupt the Service, or bypass rate limits or security measures;</li>
            <li>copy, resell or reverse-engineer the Service, except where the law allows it.</li>
          </ul>

          <h2>6. Early access and price</h2>
          <p>
            {site.pricing.detail} The Service is provided during early access <b>&quot;as is&quot; and &quot;as available&quot;</b>. Features may change, be added or be removed as we improve it.
          </p>

          <h2>7. Availability and backups</h2>
          <p>
            We work to keep the Service available and your data safe, but we can&apos;t promise it will always be uninterrupted or error-free. Planned maintenance and outages can happen. We recommend
            Mandals regularly download their reports and cash book as CSV and keep printed or saved copies of receipts and statements they need.
          </p>

          <h2>8. Suspension and ending</h2>
          <ul>
            <li>You can stop using the Service at any time. A Mandal&apos;s admin can close the Mandal using Close &amp; settle, and can ask us to delete its data (see the Privacy policy).</li>
            <li>
              We may suspend or close an account or Mandal that breaks these terms, puts others at risk, or where the law requires it. Where reasonable we will warn you first and give you a chance to
              export your records.
            </li>
          </ul>

          <h2>9. Limits of our liability</h2>
          <p>To the extent the law allows:</p>
          <ul>
            <li>
              We are not responsible for the accuracy of records entered by Mandals, for decisions a Mandal makes, or for any disagreement or loss between a Mandal and its members — including money
              collected, lent, paid out or not repaid.
            </li>
            <li>We are not liable for indirect or consequential losses, such as lost profits, lost data that could have been exported, or loss of goodwill.</li>
            <li>
              Because the Service is free during early access, our total liability for any claim relating to the Service is limited to ₹1,000 or the amount you paid us in the 12 months before the
              claim, whichever is greater.
            </li>
          </ul>
          <p>Nothing in these terms limits liability that cannot be limited under Indian law.</p>

          <h2>10. Indemnity</h2>
          <p>
            If you or your Mandal misuse the Service or break these terms or the law, and a third party makes a claim against us because of it, you agree to cover our reasonable losses and costs
            arising from that claim.
          </p>

          <h2>11. Changes to these terms</h2>
          <p>
            We may update these terms as the Service changes. If a change is significant, we will tell signed-in users in the app or by email before it takes effect. Continuing to use the Service after
            that means you accept the updated terms.
          </p>

          <h2>12. Governing law and disputes</h2>
          <p>
            These terms are governed by the laws of India. Before going to court, please contact us so we can try to resolve the issue. Any dispute will be subject to the exclusive jurisdiction of the
            courts at <L v={g.jurisdiction} />.
          </p>

          <h2>13. Contact</h2>
          <p>
            <L v={g.operator} />
            <br />
            <L v={g.address} />
            <br />
            Email: <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
            <br />
            Grievance officer: <L v={g.grievanceOfficer} /> — <a href={`mailto:${g.grievanceEmail}`}>{g.grievanceEmail}</a>
          </p>
        </Prose>
      </Container>
    </>
  );
}
