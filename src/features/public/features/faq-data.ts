import { site } from "@/config/site";

export type Faq = { q: string; a: string };
export type FaqGroup = { id: string; title: string; items: Faq[] };

/** Plain-text answers (also used for the FAQPage structured data). */
export const FAQ_GROUPS: FaqGroup[] = [
  {
    id: "getting-started",
    title: "Getting started",
    items: [
      { q: "What is MandalHisab?", a: "MandalHisab keeps the accounts of a Mandal, trust or community savings group: monthly hapta, members' savings, upad (loans from the fund) and interest, withdrawals, expenses, donations, a cash book and reports — in one place everyone can trust." },
      { q: "How do I start a new Mandal?", a: "Create a free account, then choose \"Create a Mandal\". Enter its name, the monthly hapta amount and when it starts, and you're ready to add members. Depending on how registration is set up, a new Mandal may be marked pending until it's approved; you can set it up in the meantime." },
      { q: "How do I join a Mandal that already uses MandalHisab?", a: "Ask the admin for the Mandal's join code, or search for the Mandal by name after signing up, and send a request to join. You can also be invited by email or in the app — the invitation works even if you don't have an account yet." },
      { q: "Can I bring in our existing members and balances?", a: "Yes. Add members one by one or import them from a CSV file, and enter each member's opening balance so their savings passbook starts from the right amount." },
    ],
  },
  {
    id: "money",
    title: "Money & accuracy",
    items: [
      { q: "Can members pay online through MandalHisab?", a: "No. MandalHisab doesn't take or process payments of any kind — no cards, UPI, net banking or wallets. Members hand over cash as usual and the treasurer records it, so the app is only the hisab, never the money." },
      { q: "How does MandalHisab keep the numbers right?", a: "Every amount is stored to the paisa and posted to a double-entry ledger, so money in and money out always balance. Reports, the cash book and member balances all come from the same entries." },
      { q: "What happens if someone records a wrong entry?", a: "It is reversed, not edited or deleted. The reversal is recorded with a reason and the original stays in the history, so anyone checking the books can see exactly what happened." },
      { q: "Can a member pay only part of the hapta?", a: "Yes. Part payments are allowed and the rest stays due. If the same amount is recorded twice on the same day for the same member, MandalHisab asks before saving it again." },
      { q: "How is interest worked out?", a: "Interest on upad is charged at a monthly rate you choose, and interest collected can be credited to members' savings once a month — either by a rate on last month's balance or as amounts you enter — with a preview before anything is posted. Formal loans support reducing-balance (EMI), flat, simple and compound interest." },
      { q: "Which currency does it use?", a: "Indian rupees by default, shown in Indian format like ₹1,25,000.00. Each Mandal can choose its currency in Settings." },
    ],
  },
  {
    id: "members",
    title: "Members",
    items: [
      { q: "Do all members need to sign in?", a: "No. The treasurer can run everything. Members who want to see their own savings can be invited to sign in; they only ever see their own data." },
      { q: "What can a member see?", a: "Their savings balance and passbook, hapta paid and due, interest earned, withdrawals, receipts, statements and their upad or loans. They can also tell the treasurer \"I have paid\" and request upad." },
      { q: "What's the difference between admin, manager and member?", a: "Admins manage everything, including settings and who has access. Managers do day-to-day work such as recording collections, with permissions the admin can adjust. Members see only their own money." },
    ],
  },
  {
    id: "privacy",
    title: "Privacy & security",
    items: [
      { q: "Who can see our Mandal's data?", a: "Only people who are members of your Mandal in MandalHisab, and only what their role allows. Each Mandal's data is kept separate, and platform administrators get no automatic access to it." },
      { q: "How is my account protected?", a: "Passwords are stored only as salted hashes, repeated failed sign-in attempts are limited, and your session is kept in a secure cookie that page scripts can't read. You can sign out of every device at once from your account page." },
      { q: "Can I get our data out?", a: "Yes. Reports, statements, the cash book and more can be downloaded as CSV files or printed and saved as PDF at any time." },
      { q: "Is there a record of who changed what?", a: "Yes. The audit log shows who did what and when, and sensitive actions like reversals, waivers and rejections require a reason." },
    ],
  },
  {
    id: "pricing",
    title: "Pricing",
    items: [{ q: "How much does MandalHisab cost?", a: `${site.pricing.headline}. ${site.pricing.detail}` }],
  },
  {
    id: "app",
    title: "App & languages",
    items: [
      { q: "Is there a mobile app?", a: "The Android and iPhone apps are coming soon. Until then MandalHisab works fully in any phone browser, and you can add it to your home screen so it opens from an icon." },
      { q: "Does it work without internet?", a: "No. The books are kept online so everyone sees the same numbers, so you need a connection to record or view entries." },
      { q: "Which languages are available?", a: `MandalHisab is available in ${site.languages.join(", ")}. You can switch language any time.` },
      { q: "Can I use it on a computer too?", a: "Yes. The same account works on phone, tablet and computer. On a bigger screen you get a sidebar and wider tables, which is handy for reports and printing." },
    ],
  },
];
