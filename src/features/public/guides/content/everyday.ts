import type { Guide } from "../types";

export const EVERYDAY_GUIDES: Guide[] = [
  {
    slug: "collect-hapta-at-the-monthly-meeting",
    title: "Collecting hapta at the monthly meeting",
    description: "Record cash hapta in seconds, handle part payments and late payers, verify payments members report, and print the month summary for the meeting.",
    category: "everyday",
    kind: "howto",
    audience: "Admins & treasurers",
    updated: "2026-10-30",
    related: ["set-up-monthly-hapta", "monthly-meeting-checklist-for-treasurers", "reports-and-month-summary"],
    body: [
      {
        type: "p",
        text: "The monthly meeting is when most of a Mandal's money changes hands: members hand over hapta in cash, some pay upad interest, and someone asks “how much is in the fund now?”. MandalHisab is built for exactly this moment — one person, one phone, a queue of members.",
      },
      { type: "h2", text: "Record a hapta payment" },
      {
        type: "steps",
        items: [
          { title: "Open Monthly hapta", text: "Tap **Hapta** in the bottom bar, or **Collect hapta** from the **+** button. The current month opens, showing collected vs expected." },
          { title: "Filter to “To collect”", text: "Tap the **To collect** chip so only members who still owe appear. Use the search box to find someone by name, number or mobile." },
          { title: "Tap “Collect” next to the member", text: "A sheet opens with what they owe this month, plus anything unpaid from earlier months." },
          { title: "Confirm the amount", text: "Tap **Full** or **Half**, or type the amount. Anything less than what's due is saved as a part payment and the rest stays due." },
          { title: "Tap “Record cash received”", text: "The payment is posted, the member's savings go up and a numbered receipt is created. The member moves to **Paid**." },
        ],
      },
      {
        type: "tip",
        title: "Protection against double entries",
        text: "If the same amount is recorded for the same member on the same day, MandalHisab stops and asks before saving it again. In a busy meeting this catches the most common mistake — two people recording one payment.",
      },
      { type: "h2", text: "Late payers and earlier months" },
      {
        type: "p",
        text: "Unpaid hapta carries forward. When you collect from someone who missed last month, the sheet shows both months, and the payment is applied to the **oldest unpaid month first**. The dashboard's **Older hapta still due** card lists everyone with dues from earlier months, and the **Pending & overdue installments** report gives a phone list for follow-ups.",
      },
      {
        type: "p",
        text: "Sometimes a Mandal agrees to let a member skip or delay a month — after a death in the family, for example. Under **Installments** you can **defer** a due date, **waive** an installment or change its amount, always with a reason that's kept in the audit log.",
      },
      { type: "h2", text: "When members say “I have paid”" },
      {
        type: "p",
        text: "Members who use the app can report a payment themselves with **I have paid** — useful when they hand cash to someone else, or pay outside the meeting. These wait on your dashboard under **Payments to verify**. Check the money actually reached the Mandal, then tap **Verify**: the payment is posted and the member gets a receipt. If it didn't arrive, **Reject** it with a reason the member can see.",
      },
      {
        type: "tip",
        tone: "note",
        title: "Already recorded it yourself?",
        text: "If you recorded the cash directly and the member also reported it, recording the same amount matches and closes their report automatically — it's never counted twice.",
      },
      { type: "h2", text: "End of the meeting" },
      {
        type: "p",
        text: "Open **Month summary** for a one-page report of the month: hapta expected vs collected, interest, withdrawals, cash and each member's balance. Print it, save it as PDF, or share it on the Mandal's WhatsApp group so everyone sees the same numbers. Then count the cash box and compare it with the cash shown in the **Cash book** — they should match.",
      },
    ],
  },
  {
    slug: "give-upad-and-collect-interest",
    title: "Giving upad and collecting interest",
    description: "Lend money from the Mandal's fund to a member, choose a monthly interest rate, receive interest and repayments, and handle upad requests from members.",
    category: "upad",
    kind: "howto",
    audience: "Admins & treasurers",
    updated: "2026-10-30",
    related: ["how-upad-interest-is-calculated", "credit-interest-to-members", "for-members-check-your-savings"],
    body: [
      {
        type: "p",
        text: "**Upad** is money a member takes from the Mandal's pooled cash and pays back later, with interest every month on whatever is still outstanding. It's how a Mandal helps its own members with school fees, a wedding or a house repair — and the interest it earns is shared back with all the savers.",
      },
      { type: "h2", text: "Give upad" },
      {
        type: "steps",
        items: [
          { title: "Tap “Give upad”", text: "From the **+** button or the **Upad** screen. The sheet shows the fund cash available right now." },
          { title: "Choose the member", text: "Pick the member taking the upad." },
          { title: "Enter the amount and rate", text: "Type the amount and the interest rate **per month** (for example 1 or 2). The default rate comes from Settings, and you can change it for this upad." },
          { title: "Date and where it's paid from", text: "Choose the date given and which cash account it's paid from — usually the cash box." },
          { title: "Add a note and save", text: "A note like “For house repair” helps later. MandalHisab shows the interest that will be due every month, then records the upad with its own number." },
        ],
      },
      {
        type: "p",
        text: "From the next month, interest is due every month on the amount still outstanding. It appears on the Monthly hapta screen under **Upad interest** and on the dashboard as **Upad interest to collect**.",
      },
      { type: "h2", text: "Receive interest or a repayment" },
      {
        type: "steps",
        items: [
          { title: "Open the upad", text: "Tap **Receive** next to it on the Upad screen, or **Receive upad** from the **+** button." },
          { title: "Enter the interest received", text: "Interest is applied to the **oldest month first**, so earlier unpaid months are cleared before the current one." },
          { title: "Enter any upad returned", text: "If the member is paying back part of the upad, enter it here. Returning part of the upad lowers the interest from the next month." },
          { title: "Tap “Record as paid”", text: "A receipt is issued. When the full upad is returned and no interest is left, the upad closes." },
        ],
      },
      {
        type: "tip",
        title: "Where the interest goes",
        text: "Interest received on upad is added to every member's savings in proportion to their savings. The Mandal's earnings go back to the people whose money was lent — automatically, to the paisa.",
      },
      { type: "h2", text: "Upad requests from members" },
      {
        type: "p",
        text: "If you turn on member requests, members can ask for upad from the app. They see how much the Mandal has available and can't ask for more than that. Requests show on your dashboard under **Upad requests**. Tap **Approve and give upad** to set the rate and record it in one step, or **Reject** with a reason they will see.",
      },
      { type: "h2", text: "Unpaid interest" },
      {
        type: "p",
        text: "If a member skips interest for a month, it isn't lost — it carries forward and the Upad screen shows “2 months unpaid” next to their name. Unpaid interest does not itself earn interest; it simply waits to be collected, oldest month first.",
      },
      {
        type: "p",
        text: "Want to understand the numbers in detail? Read [how upad interest is calculated](/guides/how-upad-interest-is-calculated), with worked examples.",
      },
    ],
  },
  {
    slug: "credit-interest-to-members",
    title: "Crediting monthly interest to members' savings",
    description: "Share the Mandal's earnings with members once a month — by a rate on last month's balance or by entering amounts — with a preview before anything is posted.",
    category: "upad",
    kind: "howto",
    audience: "Admins & treasurers",
    updated: "2026-10-30",
    related: ["give-upad-and-collect-interest", "how-upad-interest-is-calculated", "reports-and-month-summary"],
    body: [
      {
        type: "p",
        text: "Some Mandals pay members interest on their savings every month, on top of the interest shared from upad. **Interest credit** (under More tools) is where you do that. It adds an interest entry to each member's savings passbook for a month, and you always see a preview first.",
      },
      { type: "h2", text: "Two ways to calculate it" },
      {
        type: "table",
        head: ["Method", "How it works", "Good for"],
        rows: [
          ["By rate", "A % rate per month on each member's eligible balance", "Mandals with a fixed savings interest rate"],
          ["Enter amounts manually", "You type the interest for each member; blank means none", "Mandals that decide amounts in the meeting"],
        ],
      },
      {
        type: "p",
        text: "With **By rate** you also choose what the rate is calculated on: the member's **balance at the end of the previous month**, or **hapta paid up to the end of the previous month** (hapta contributions only — no compounding on earlier interest).",
      },
      { type: "h2", text: "Credit interest for a month" },
      {
        type: "steps",
        items: [
          { title: "Open Interest credit", text: "Under **More tools** in the menu." },
          { title: "Choose the month", text: "Pick the month you're crediting interest for." },
          { title: "Choose the method", text: "By rate (enter the % per month and the balance it's calculated on) or enter amounts manually." },
          { title: "Preview", text: "MandalHisab lists every member with their eligible balance and the interest they'll get. Check it carefully." },
          { title: "Tap “Credit interest”", text: "Each member's savings passbook gets an interest entry for that month." },
        ],
      },
      {
        type: "tip",
        tone: "warn",
        title: "Once credited, it's final",
        text: "Interest for a month can't be edited or credited a second time. If something was wrong, correct it with a member balance adjustment and a reason — the original entry stays in the history.",
      },
      { type: "h2", text: "Worked example" },
      {
        type: "p",
        text: "Suppose your Mandal pays 0.5% per month on the balance at the end of the previous month. Asha had ₹24,000 at the end of September. Her October interest is ₹24,000 × 0.5% = **₹120**, and it appears in her passbook as interest for October. A member with ₹10,000 gets ₹50. The interest report shows the total credited and how each amount was worked out.",
      },
    ],
  },
  {
    slug: "record-a-withdrawal",
    title: "Paying out savings: recording a withdrawal",
    description: "Pay cash from a member's savings, see their available balance first, print the voucher, and fix a mistake with a reversal.",
    category: "everyday",
    kind: "howto",
    audience: "Admins & treasurers",
    updated: "2026-10-30",
    related: ["close-and-settle-a-mandal", "cash-book-expenses-and-donations", "for-members-check-your-savings"],
    body: [
      {
        type: "p",
        text: "A **withdrawal** is cash paid to a member out of their own savings balance — different from upad, which is a loan from the fund. Withdrawals reduce the member's savings and the Mandal's cash.",
      },
      {
        type: "steps",
        items: [
          { title: "Tap “Withdrawal”", text: "From the **+** button, or open **Withdrawals** and tap **Record a withdrawal**." },
          { title: "Choose the member", text: "Their **available balance** appears straight away, so you know how much they can take." },
          { title: "Enter the amount and date", text: "MandalHisab warns you if it's more than the available balance." },
          { title: "Add a purpose", text: "Optional — for example medical or school fees. It helps when the committee reviews withdrawals." },
          { title: "Record it", text: "A voucher number is generated. Print the voucher or save it as PDF, and have the member sign the paper copy if your Mandal does that." },
        ],
      },
      {
        type: "tip",
        tone: "note",
        title: "More than their balance?",
        text: "By default a withdrawal can't exceed the member's savings. An admin can allow it in Settings for special cases; each such withdrawal then needs a recorded reason.",
      },
      { type: "h2", text: "Fixing a mistake" },
      {
        type: "p",
        text: "Wrong member or wrong amount? Open the withdrawal and **reverse** it with a reason. The original stays visible, marked reversed, and a matching reversal puts the balance back. Then record the correct one. Nothing is ever silently edited or deleted — that's what keeps the books trustworthy.",
      },
      { type: "h2", text: "Member leaving the Mandal" },
      {
        type: "p",
        text: "When a member leaves, use **Leaving the Mandal** on their membership. MandalHisab works out their savings balance and their part of the Mandal's own money, takes off any upad they still owe, pays out the share and stops their hapta.",
      },
    ],
  },
  {
    slug: "cash-book-expenses-and-donations",
    title: "Cash book, expenses and donations",
    description: "Record cash that isn't hapta or withdrawals, track expenses with bills, take donations with receipts, and reconcile the cash box with the cash book.",
    category: "books",
    kind: "howto",
    audience: "Admins & treasurers",
    updated: "2026-10-30",
    related: ["reports-and-month-summary", "monthly-meeting-checklist-for-treasurers", "double-entry-for-mandals"],
    body: [
      {
        type: "p",
        text: "The **Cash book** is the Mandal's day book (rojmel): opening cash, every receipt and payment, and closing cash for any period. Hapta, upad and withdrawals appear there automatically. For everything else — buying a register, printing, tea for the meeting, bank charges, a membership fee — use **Cash in / out**.",
      },
      { type: "h2", text: "Record other cash" },
      {
        type: "steps",
        items: [
          { title: "Tap “Cash in / out”", text: "From the **+** button or the Cash book screen." },
          { title: "Choose Cash in (receipt) or Cash out (expense)", text: "" },
          { title: "Enter the amount, date and account", text: "The account is where the cash is held — the cash box, or with the treasurer." },
          { title: "Describe the entry", text: "For example “Photocopies of annual report”. A clear description makes reports readable." },
        ],
      },
      { type: "h2", text: "Expenses with approval" },
      {
        type: "p",
        text: "For larger spending, use **Expenses** under More tools. You can attach a photo of the bill, send it for approval, and reimburse a member who paid from their own pocket. Expenses waiting for approval show on the admin's dashboard.",
      },
      { type: "h2", text: "Donations" },
      {
        type: "p",
        text: "Trusts and festival committees can record **Donations** with the donor's name, the event they're for, and how they paid. Each donation gets a receipt. Donations belong to the Mandal's own money, not to any member's savings, and at closing they're shared by hapta shares.",
      },
      { type: "h2", text: "Reconciling the cash box" },
      {
        type: "p",
        text: "At the end of every meeting, count the physical cash and compare it with the closing cash in the Cash book. If they don't match, the usual reasons are: a payment collected but not recorded, an expense paid but not entered, or an entry recorded twice. Fix it with the missing entry or a reversal — never by changing old entries.",
      },
      {
        type: "tip",
        title: "Several places to keep cash?",
        text: "Under **Accounts** you can create a cash account for each place money is kept — the cash box, the treasurer, a bank account — with opening balances and transfers between them. The cash book can be viewed for each.",
      },
    ],
  },
  {
    slug: "reports-and-month-summary",
    title: "Reports: month summary, statements and annual accounts",
    description: "Which MandalHisab report to use for meetings, members and audits — and how to print, save as PDF or download as CSV.",
    category: "books",
    kind: "howto",
    audience: "Admins & treasurers",
    updated: "2026-10-30",
    related: ["cash-book-expenses-and-donations", "collect-hapta-at-the-monthly-meeting", "double-entry-for-mandals"],
    body: [
      {
        type: "p",
        text: "Every report in MandalHisab is built from the same ledger entries, so the numbers in one report always agree with the others. Choose a period, then print, save as PDF or download as CSV to open in Excel or Google Sheets.",
      },
      {
        type: "table",
        head: ["Report", "Shows", "Use it for"],
        rows: [
          ["Month summary", "Hapta expected vs collected, interest, withdrawals, cash and each member's balance", "The monthly meeting and WhatsApp group"],
          ["Hapta collection", "Due vs collected per scheme, outstanding and overdue", "Following up dues"],
          ["Pending & overdue installments", "Who owes what, how late, with contact numbers", "Calling late payers"],
          ["Interest", "Interest charged, received and outstanding, with calculations", "Checking upad and interest credit"],
          ["Cash & bank summary", "Opening, receipts, payments and closing per account", "Matching the cash box"],
          ["Income & expenditure", "Income and expenses by category, surplus or deficit", "Annual general meeting"],
          ["Trial balance / Balance sheet", "All ledger balances; assets, liabilities and funds", "Audits and trustees"],
          ["Donations / Events", "Donations by donor, event and method; income and expenses per event", "Trusts and festival committees"],
          ["Loans outstanding", "Principal, interest due and overdue per loan", "EMI loans"],
        ],
      },
      { type: "h2", text: "Member statements" },
      {
        type: "p",
        text: "Each member's page has their savings passbook (a running balance of hapta, interest and withdrawals) and a dues statement. Print one for a member who doesn't use a phone, or let members open their own in the app.",
      },
      { type: "h2", text: "Print or save as PDF" },
      {
        type: "steps",
        items: [
          { title: "Open the report and choose the period", text: "" },
          { title: "Tap Print", text: "In the browser or app, the print view hides menus and buttons." },
          { title: "Choose “Save as PDF” as the printer", text: "Share the PDF on WhatsApp or email it to the committee." },
        ],
      },
      {
        type: "tip",
        title: "For the yearly audit",
        text: "Download the trial balance, income & expenditure, balance sheet and cash book for the financial year as CSV and PDF. With the audit log, that's usually everything an auditor or the trustees need.",
      },
    ],
  },
  {
    slug: "close-and-settle-a-mandal",
    title: "Closing and settling a Mandal at the end of its term",
    description: "The three steps to closing a Mandal: finish what's open, share out the Mandal's own money by hapta shares, pay every member, then close it read-only.",
    category: "closing",
    kind: "howto",
    audience: "Admins & treasurers",
    updated: "2026-10-30",
    related: ["record-a-withdrawal", "set-up-monthly-hapta", "running-a-transparent-mandal"],
    body: [
      {
        type: "p",
        text: "Many Mandals run for a fixed term — three or five years — and then share everything out. This is the most sensitive moment in a Mandal's life: every member wants to know exactly what they'll get and why. MandalHisab turns it into three clear steps, under **Settings → Close & settle**.",
      },
      { type: "h2", text: "Step 1 — Finish what's still open" },
      {
        type: "p",
        text: "Everything must be collected, verified or waived before money is shared out. That means collecting remaining hapta, getting upad and interest back, and verifying any payments members reported. If the members agree, you can **waive all unpaid hapta** up to today — members' savings stay as they are. Starting closing also means no new hapta is created after today.",
      },
      { type: "h2", text: "Step 2 — Share out the Mandal's own money" },
      {
        type: "p",
        text: "Besides members' savings, a Mandal usually has money of its own: donations, other income and anything else that isn't in members' savings. This is shared out by **hapta shares** — a member paying 3 haptas a month gets 3 parts. MandalHisab shows the preview before you confirm.",
      },
      { type: "h2", text: "Step 3 — Pay each member" },
      {
        type: "p",
        text: "Each member gets **their savings balance + their share of the Mandal's own money − any upad they still owe**. A payout voucher is recorded for each one. The screen tracks who has been paid and who is still to pay, so it can be spread over a few meetings.",
      },
      {
        type: "table",
        head: ["Member", "Savings", "Share", "Upad owed", "Payout"],
        rows: [
          ["Asha (1 hapta)", "₹36,000", "₹1,500", "₹0", "₹37,500"],
          ["Bharat (3 haptas)", "₹1,08,000", "₹4,500", "₹20,000", "₹92,500"],
        ],
        caption: "An example only: the Mandal's own money of ₹6,000 shared over 4 hapta shares gives ₹1,500 per share.",
      },
      { type: "h2", text: "Close the Mandal" },
      {
        type: "p",
        text: "When every member is paid and every account is at zero, tap **Close the Mandal**. It becomes read-only for everyone. Nothing is deleted — all history, receipts and reports stay available, which is exactly what you want if a question comes up years later.",
      },
      {
        type: "tip",
        title: "Before you start",
        text: "Announce the closing date in advance, print a month summary and the trial balance, and share them with members. When people can see the numbers before the payout, the closing meeting goes smoothly.",
      },
    ],
  },
];
