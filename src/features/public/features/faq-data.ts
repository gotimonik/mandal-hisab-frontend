import { appsLine, site } from "@/config/site";

export type Faq = { q: string; a: string };
export type FaqGroup = { id: string; title: string; items: Faq[] };

/** Plain-text answers (also used for the FAQPage structured data). */
export const FAQ_GROUPS: FaqGroup[] = [
  {
    id: "getting-started",
    title: "Getting started",
    items: [
      { q: "What is MandalHisab?", a: "MandalHisab keeps the accounts of a Mandal, trust or community savings group: monthly hapta, members' savings, upad (loans from the fund) and interest, withdrawals, expenses, donations, a cash book and reports — in one place everyone can trust. Every account also gets Personal Hisab, a private book for your own income and spending." },
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
    id: "personal",
    title: "Personal Hisab",
    items: [
      { q: "What is Personal Hisab?", a: "Personal Hisab is a private income and expense book for your own money, inside MandalHisab. Note what you spend and receive, keep wallets for cash, bank, UPI and card, see spending by category, set monthly budgets and get reminders for rent and bills. It's separate from every Mandal." },
      { q: "Are Personal Hisab wallets real bank accounts?", a: "No. A wallet is just a name you give to where your money is — Cash, SBI account, Paytm, Credit card — so you can keep your hisab tidy and track every transaction yourself. It isn't linked to any bank, holds no money and needs no bank, UPI or card details. Its balance is simply what you've entered." },
      { q: "Who can see my Personal Hisab?", a: "Only you. Your Mandal's admins, managers and other members can't see it, and it never appears in any Mandal's reports, cash book or backup file." },
      { q: "Do I need to be in a Mandal to use it?", a: "No. Create a free account and open Personal Hisab — no Mandal needed. If you are in a Mandal, it's in the same app under the same login." },
      { q: "Does Personal Hisab connect to my bank or UPI?", a: "No. You add entries yourself. Wallets like Bank or UPI aren't real bank accounts — just names for where you keep money. MandalHisab never asks for account numbers, never reads your bank or SMS, and never moves money." },
      { q: "Can I add spending by scanning a bill?", a: "Yes. Tap Scan a bill and take a photo, pick a screenshot (a UPI payment, for example) or a PDF, up to 5 MB. MandalHisab reads the total, date and shop right on your phone — the bill isn't sent to any AI service — suggests a category and fills in the form; you check it and save, and the bill stays attached to the entry where only you can open it. You can scan 10 bills a month for now. Clear photos of printed bills and payment screenshots read best; handwritten bills often need the amount typed in, and PDFs are kept but not read yet." },
      { q: "How do reminders and budget alerts work?", a: "Add a reminder for rent, a bill or an EMI — once, weekly, monthly or yearly — and choose how long before it's due you want to hear about it. You can also be reminded about money someone promised to give you. Turn on budget alerts to get a notification at 80% of a budget and when you go over. Notifications come on the MandalHisab app, so allow them on your phone." },
      { q: "Can my Mandal hapta and upad show up in Personal Hisab?", a: "Yes, if you want. Turn on \"Add my Mandal money to Personal Hisab\" and the hapta you pay, upad you take or repay, and savings you withdraw are copied in from your Mandals automatically. Money that's really yours — hapta into your own savings, upad, withdrawals — changes your balance without counting as spending; upad interest counts as spending. It works once your Mandal's admin has linked your account to your member record. Only your own transactions are copied, and the Mandal can't see your Personal Hisab." },
    ],
  },
  {
    id: "privacy",
    title: "Privacy & security",
    items: [
      { q: "Who can see our Mandal's data?", a: "Only people who are members of your Mandal in MandalHisab, and only what their role allows. Each Mandal's data is kept separate. Our platform administrators can view a Mandal read-only for support and oversight — they can't change anything, and every visit appears in your Mandal's audit log." },
      { q: "How is my account protected?", a: "Passwords are stored only as salted hashes, repeated failed sign-in attempts are limited, and your session is kept in a secure cookie that page scripts can't read. You can sign out of every device at once from your account page." },
      { q: "Can I get our data out?", a: "Yes. Reports, statements, the cash book and more can be downloaded as CSV files or printed and saved as PDF at any time. Your Personal Hisab entries can be downloaded as CSV too." },
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
      { q: "Is there a mobile app?", a: `${appsLine()} In a browser you can also add it to your home screen so it opens from an icon.` },
      { q: "Does it work without internet?", a: "No. The books are kept online so everyone sees the same numbers, so you need a connection to record or view entries." },
      { q: "Which languages are available?", a: `MandalHisab is available in ${site.languages.join(", ")}. You can switch language any time.` },
      { q: "Can I use it on a computer too?", a: "Yes. The same account works on phone, tablet and computer. On a bigger screen you get a sidebar and wider tables, which is handy for reports and printing." },
    ],
  },
];
