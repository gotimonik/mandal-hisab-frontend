import type { Guide } from "../types";

export const PERSONAL_GUIDES: Guide[] = [
  {
    slug: "personal-hisab-track-your-own-money",
    title: "Personal Hisab: track your own income and spending",
    description: "Use Personal Hisab to note what you spend and receive, keep wallets for cash, bank and UPI, set monthly budgets and get reminders for rent and bills — privately, just for you.",
    category: "personal",
    kind: "howto",
    audience: "Everyone",
    updated: "2026-11-03",
    related: ["make-a-monthly-household-budget", "for-members-check-your-savings", "what-is-a-mandal"],
    body: [
      {
        type: "p",
        text: "MandalHisab keeps your Mandal's hisab. **Personal Hisab** keeps yours. It's a private income and expense book inside the same app: what you spend, what comes in, and what's left in each wallet. It's separate from every Mandal and **only you can see it** — and you don't need to be in a Mandal to use it.",
      },
      { type: "h2", text: "Open Personal Hisab" },
      {
        type: "steps",
        items: [
          { title: "Sign in or create a free account", text: "Use the same account you use for your Mandal, or [create one](/register) — no Mandal needed." },
          { title: "Tap “Personal Hisab”", text: "It's on the **Your Mandals** screen after you sign in, and in the menu inside any Mandal." },
          { title: "Start with the ready-made wallets and categories", text: "A Cash and a Bank / UPI wallet and common categories like groceries, rent and fuel are already there, in your language. Wallets are just names, not real bank accounts — rename, add or hide them whenever you like." },
        ],
      },
      { type: "h2", text: "Add an entry" },
      {
        type: "p",
        text: "Tap the green **+** button at the bottom of the screen and choose what happened:",
      },
      {
        type: "list",
        items: [
          "**Spent** — money you paid for something: vegetables, fuel, school fees, a phone recharge.",
          "**Received** — salary, business income, a gift, rent from a tenant: any money that came in.",
          "**Move money** — money moved between your own wallets, like cash taken out of the bank. It doesn't count as spending or income.",
        ],
      },
      {
        type: "p",
        text: "Type the amount, pick a category and the wallet it came from (or went into), add a note if you like, and save. Your balances, the month's totals and the charts update straight away. Made a mistake? Tap the entry to change or delete it.",
      },
      { type: "h2", text: "Scan a bill instead of typing" },
      {
        type: "steps",
        items: [
          { title: "Tap “Scan a bill”", text: "It's in the **+** menu and at the top of the Add spending form. Take a photo of the bill, or pick a photo, a screenshot (a UPI payment, for example) or a PDF — up to 5 MB." },
          { title: "Check what was filled in", text: "MandalHisab reads the **total**, the **date** and the **shop** right on your phone, and suggests a category (and the wallet, when the bill shows UPI or card). Correct anything that's wrong." },
          { title: "Save", text: "The bill stays attached to the entry. Tap the entry any time and choose **View** to see it again — only you can open it." },
        ],
      },
      {
        type: "tip",
        tone: "note",
        title: "10 bills a month, for now",
        text: "You can scan 10 bills each month; the count starts again on the 1st, and removing a bill doesn't give the scan back. The bill is read on your own phone — free, and never sent to an AI service. The first scan takes a little longer while the reader downloads. For best results, take a flat, clear photo in good light; printed bills and payment screenshots read best, handwritten bills often need the amount typed in, and PDFs are kept with the entry but not read yet.",
      },
      {
        type: "tip",
        title: "Make everyday entries quicker",
        text: "Mark a wallet and a category as your **default**, and every new entry starts with them already chosen — so most entries are just the amount.",
      },
      { type: "h2", text: "Wallets: where your money is" },
      {
        type: "p",
        text: "A wallet is a name for any place you keep money — **cash**, a **bank** account, **UPI** or a **card**. Each wallet shows its own balance, and the overview shows the total across all of them. Enter what each one holds today as its starting balance and carry on from there.",
      },
      {
        type: "tip",
        tone: "note",
        title: "Wallets aren't real bank accounts",
        text: "A wallet is just a name that helps you keep your hisab tidy and track every transaction yourself. It isn't linked to any bank and holds no money: Personal Hisab never connects to your bank or UPI app, never reads your SMS, and never asks for account or card numbers. You add entries yourself, so you decide exactly what's recorded.",
      },
      { type: "h2", text: "Categories with icons" },
      {
        type: "p",
        text: "Every spending or income entry goes into a category — groceries, rent, fuel, medicine, salary. Each category has an icon and a colour (MandalHisab suggests one from the name, in English, ગુજરાતી or हिन्दी). Tap a category to see its entries, this month's total and the last six months.",
      },
      { type: "h2", text: "Monthly budgets and alerts" },
      {
        type: "p",
        text: "Open **Budgets** to set a limit for the whole month, for a single category, or both. A bar shows how much is left — green, then amber from 80%, then red when you go over. Budgets start again every month.",
      },
      {
        type: "p",
        text: "Turn on **Budget alerts** and you'll get a notification when you reach 80% of a budget, and again if you go over it.",
      },
      { type: "h2", text: "Reminders: bills to pay, money to collect" },
      {
        type: "steps",
        items: [
          { title: "Open Reminders and add one", text: "Choose **Money to pay** for rent, electricity, school fees or an EMI, or **Money to receive** when someone has promised to give you money." },
          { title: "Set the date and how often", text: "Once, weekly, monthly or yearly. Pick how long before it's due you want to hear about it — at the time, a few hours, or up to a week before." },
          { title: "Get the notification", text: "Reminders arrive as notifications on the MandalHisab app, in your language. Allow notifications on your phone when asked." },
          { title: "Mark it paid or received", text: "One tap adds it to your spending (or income) and, for a repeating reminder, sets up the next one." },
        ],
      },
      {
        type: "p",
        text: "For money to receive, add the person's name and phone number and the reminder shows **Call** and **WhatsApp** buttons with a polite message ready to send.",
      },
      { type: "h2", text: "Reports" },
      {
        type: "p",
        text: "The **Overview** shows this month at a glance: money in, money spent, what you saved, spending day by day and where your money went. **Reports** show any period, month by month. On **Entries** you can search notes, filter by type, wallet or category, and download everything as a CSV file.",
      },
      { type: "h2", text: "Add your Mandal money automatically (optional)" },
      {
        type: "p",
        text: "If you're a member of a Mandal, you can turn on **Add my Mandal money to Personal Hisab**. The hapta you pay, upad you take or repay, and savings you withdraw are then copied in from your Mandals, so your wallet balance stays right without typing them twice.",
      },
      {
        type: "list",
        items: [
          "Hapta into your own savings, upad and withdrawals change your balance but don't count as spending or income — it's still your money, or money you owe.",
          "Upad interest and fees do count as spending.",
          "If the Mandal reverses a payment, it goes away here too.",
          "It works once your Mandal's admin has linked your account to your member record.",
        ],
      },
      {
        type: "tip",
        title: "Your Personal Hisab stays private",
        text: "Only your own transactions are copied in, and nothing goes the other way: your Mandal's admins, managers and members can never see your Personal Hisab.",
      },
    ],
  },
  {
    slug: "make-a-monthly-household-budget",
    title: "How to make a monthly household budget that actually works",
    description: "A simple way to plan a family's monthly money: list what comes in, fix the must-pay bills first, save before you spend, and set limits for everyday spending.",
    category: "personal",
    kind: "article",
    audience: "Everyone",
    updated: "2026-11-03",
    related: ["personal-hisab-track-your-own-money", "what-is-a-mandal"],
    body: [
      {
        type: "p",
        text: "Most families don't overspend on one big thing. The money goes in small amounts — a little extra on groceries, a few deliveries, a recharge, a gift — and at the end of the month nobody is quite sure where it went. A budget is simply a plan for the month made before the money is spent, and a habit of checking it as you go.",
      },
      { type: "h2", text: "1. Write down what comes in" },
      {
        type: "p",
        text: "Start with the money you can count on each month: salary, business income, rent from a tenant, a pension. If your income changes from month to month, plan with a lower, safe figure and treat anything above it as a bonus.",
      },
      { type: "h2", text: "2. Fix the must-pay amounts first" },
      {
        type: "p",
        text: "Next, list everything that has to be paid whatever happens: rent or home loan EMI, electricity and gas, school fees, insurance premiums, phone and internet, and your Mandal hapta. These are the bills that cause trouble when they're missed, so they come before anything else.",
      },
      {
        type: "tip",
        title: "Let reminders do the remembering",
        text: "In Personal Hisab, add a **monthly reminder** for each of these with a notification a day or two before the due date. When you pay, one tap adds it to your spending.",
      },
      { type: "h2", text: "3. Save before you spend" },
      {
        type: "p",
        text: "Decide how much to save this month and put it aside at the start of the month, not with whatever is left at the end — because usually nothing is. Many families already do this through their Mandal's monthly hapta: the saving happens first, on a fixed day, every month.",
      },
      { type: "h2", text: "4. Give everyday spending a limit" },
      {
        type: "p",
        text: "What's left after bills and savings is for everyday spending. Split it into a few categories that matter to your home — groceries, milk and vegetables, fuel and travel, medicines, eating out — and give each one a monthly limit.",
      },
      {
        type: "table",
        head: ["Example", "Amount"],
        rows: [
          ["Money in (salary)", "₹40,000"],
          ["Rent, electricity, school fees, phone", "₹17,000"],
          ["Savings (Mandal hapta + other)", "₹6,000"],
          ["Left for everyday spending", "₹17,000"],
          ["— Groceries and milk", "₹9,000"],
          ["— Fuel and travel", "₹3,000"],
          ["— Medicines", "₹1,500"],
          ["— Eating out and other", "₹3,500"],
        ],
        caption: "An example only — use your own figures.",
      },
      { type: "h2", text: "5. Note every rupee for one month" },
      {
        type: "p",
        text: "A plan only works if you know what really happened. For one month, write down everything you spend and receive, the same day. It takes a few seconds per entry on a phone, and at the end of the month you'll see exactly which categories went over — usually one or two surprises.",
      },
      { type: "h2", text: "6. Check halfway through the month" },
      {
        type: "p",
        text: "Look at your budget around the 15th. If groceries are already at 80%, you still have two weeks to adjust. In Personal Hisab, **Budget alerts** send a notification at 80% and when you go over, so you don't have to remember to check.",
      },
      { type: "h2", text: "7. Adjust and repeat" },
      {
        type: "p",
        text: "Your first budget won't be perfect. At the end of each month, compare the plan with what happened, move a little from one category to another, and start again. After two or three months the numbers settle and the month-end surprise disappears.",
      },
      {
        type: "tip",
        tone: "note",
        title: "Try it in Personal Hisab",
        text: "Personal Hisab has wallets, categories with icons, monthly budgets, bill reminders and month-by-month reports — free, private and in English, ગુજરાતી and हिन्दी. [Read how it works](/guides/personal-hisab-track-your-own-money).",
      },
    ],
  },
];
