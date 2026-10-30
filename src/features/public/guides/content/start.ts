import type { Guide } from "../types";

export const START_GUIDES: Guide[] = [
  {
    slug: "start-a-new-mandal",
    title: "How to start a new Mandal on MandalHisab",
    description: "Create your account, register your Mandal with its monthly hapta, and get it ready for the first collection — step by step.",
    category: "start",
    kind: "howto",
    audience: "Admins & treasurers",
    updated: "2026-10-30",
    related: ["set-up-monthly-hapta", "add-and-import-members", "roles-and-inviting-people"],
    body: [
      {
        type: "p",
        text: "Starting a Mandal on MandalHisab takes a few minutes. You create your own account first, then register the Mandal. Whoever registers it becomes its first **admin** — the person who can change settings, add members and decide who else gets access. Most Mandals choose the treasurer or the person who already keeps the register.",
      },
      {
        type: "p",
        text: "Before you begin, keep three things handy: the name you want for the Mandal, the monthly hapta amount each member pays, and the month the hapta started (or will start). Everything else can be added later.",
      },
      { type: "h2", text: "Step-by-step" },
      {
        type: "steps",
        items: [
          { title: "Create your account", text: "Open MandalHisab and tap **Create an account**. Enter your full name, email and a password with at least 8 characters including letters and numbers. A mobile number is optional." },
          { title: "Verify your email", text: "We send a link to your email. Open it and tap the link to activate your account, then come back and sign in. If you can't find the email, look in Spam or Promotions, or tap **Send the email again**." },
          { title: "Choose “New Mandal”", text: "After signing in you'll see two tabs: **Join a Mandal** and **New Mandal**. Choose **New Mandal** — you'll be its first admin." },
          { title: "Fill in “About the Mandal”", text: "Enter the Mandal or trust name and an optional short description, such as “Patel family savings Mandal”. Pick the currency; all amounts use it and it can't be changed once money is recorded." },
          { title: "Set the monthly hapta", text: "Enter the hapta each member pays per month (for example ₹500), the month it starts from, and the day of the month it's due by. Then choose how long the Mandal will run: no end date, 1, 2, 3 or 5 years, or until a month you choose." },
          { title: "Add more details if you like", text: "Under **More details (optional)** you can add the city, state, a contact phone, a registration number and the month your financial year starts. You can skip this and add it later in Settings." },
          { title: "Tap “Register Mandal”", text: "Your Mandal is created and you land on its dashboard. Depending on how registration is set up, a new Mandal may show as awaiting approval. You can finish settings and add members meanwhile; recording money is turned on once it's approved." },
        ],
      },
      { type: "h2", text: "What to do right after" },
      {
        type: "list",
        items: [
          "**Add your members** — one by one or from a CSV file. See [adding and importing members](/guides/add-and-import-members).",
          "**Enter opening balances** if the Mandal has been running on paper, so each member's savings passbook starts from the right amount.",
          "**Check Settings** — the default interest rate for upad, the financial year and your Mandal's logo.",
          "**Share the join code** or invite people by email if members should see their own savings. See [roles and inviting people](/guides/roles-and-inviting-people).",
        ],
      },
      {
        type: "tip",
        title: "Moving from a paper register?",
        text: "Pick a clean starting point — usually the first day of next month. Total up each member's savings in the register up to that date and enter it as their opening balance. From then on, record everything in MandalHisab only, so there's one source of truth.",
      },
      { type: "h2", text: "Choosing the hapta details" },
      {
        type: "p",
        text: "The **due-by day** is the day of the month by which hapta should be paid, from 1 to 28 (28 so it works in February too). Many Mandals pick the day of their monthly meeting. Members who haven't paid by then show as due on the monthly screen, and the amount carries forward until it's collected.",
      },
      {
        type: "p",
        text: "If you're not sure how long the Mandal will run, choose **No end date**. You can set an end month later in Settings, and when the time comes MandalHisab walks you through closing and paying everyone out — see [closing and settling a Mandal](/guides/close-and-settle-a-mandal).",
      },
      {
        type: "tip",
        tone: "note",
        title: "Changing the hapta later",
        text: "A change to the hapta amount applies to future months only. Months already collected — and any month that's already paid or part paid — keep their original amount, so old records never shift.",
      },
    ],
  },
  {
    slug: "set-up-monthly-hapta",
    title: "Setting up and changing the monthly hapta",
    description: "How the monthly hapta works in MandalHisab: setting the amount and due day, enrolling members, members who pay more than one hapta, and changing the amount for future months.",
    category: "start",
    kind: "howto",
    audience: "Admins & treasurers",
    updated: "2026-10-30",
    related: ["collect-hapta-at-the-monthly-meeting", "add-and-import-members", "start-a-new-mandal"],
    body: [
      {
        type: "p",
        text: "**Hapta** is the fixed amount each member puts into the Mandal every month. It's the heart of most Mandals: it builds each member's savings, and the pooled money is what the Mandal lends out as upad. In MandalHisab, every active member who is enrolled gets a hapta due for each month, and the **Monthly hapta** screen shows who has paid and who hasn't.",
      },
      { type: "h2", text: "Set up the hapta" },
      {
        type: "p",
        text: "If you entered a hapta amount when you registered the Mandal, it's already set up. If not, open **Monthly hapta** and tap **Set up monthly hapta**.",
      },
      {
        type: "steps",
        items: [
          { title: "Enter the amount", text: "The hapta per member per month — for example ₹500 for a family Mandal or ₹1,000 for a friends' Mandal." },
          { title: "Choose the starting month", text: "The first month hapta is due. If you're moving from paper, this is usually the first month you'll record in the app." },
          { title: "Choose the due-by day", text: "A day from 1 to 28. After this day, unpaid hapta shows as due." },
          { title: "Enrol current members", text: "Leave **Add all current active members** ticked to enrol everyone from their joining month or the starting month, whichever is later." },
          { title: "Tap “Start monthly hapta”", text: "Each enrolled member now has a hapta due for every month from the start." },
        ],
      },
      { type: "h2", text: "Members who pay more than one hapta" },
      {
        type: "p",
        text: "In many Mandals a family pays two or three haptas a month under one name. Instead of adding the same person three times, open the member and set **Haptas per month** (1 to 50). A member paying 3 haptas owes three times the hapta each month, and — importantly — gets three shares when the Mandal shares out money at the end.",
      },
      {
        type: "p",
        text: "When you change this number you choose when it applies: from **this month** (if this month is already paid, the rest shows as due), from **next month**, or **don't change existing months**. Earlier months never change.",
      },
      { type: "h2", text: "Changing the hapta amount" },
      {
        type: "p",
        text: "Mandals often raise the hapta after a meeting decision — say from ₹500 to ₹700 from Diwali. On the Monthly hapta screen tap **Change amount**, enter the new amount, choose the month it applies from, and add a reason such as “Decided in the Diwali meeting”.",
      },
      {
        type: "tip",
        tone: "note",
        title: "Old months are protected",
        text: "The new amount applies only from the month you pick. Earlier months, and any month that is already paid or part paid, keep their amount. That way a member's history always matches what they actually paid.",
      },
      { type: "h2", text: "Members who joined later or were added without hapta" },
      {
        type: "p",
        text: "If someone is active but has no hapta for the month you're looking at, they appear under **Not in the monthly hapta for this month**. Tap **Add all from…** to enrol them from that month. This is handy after you import members or approve several join requests at once.",
      },
      { type: "h2", text: "More than one scheme" },
      {
        type: "p",
        text: "Most Mandals only need the monthly hapta. If yours also runs separate collections — a weekly scheme, a quarterly fund or a festival collection — use **Hapta schemes** under More tools. Each scheme has its own amount, frequency (weekly, monthly or quarterly) and enrolled members, and you can pause, resume or close it.",
      },
    ],
  },
  {
    slug: "add-and-import-members",
    title: "Adding members and importing them from a CSV file",
    description: "Add members one by one or in bulk from a spreadsheet, set membership numbers, opening balances and haptas per month, and invite members to see their own savings.",
    category: "start",
    kind: "howto",
    audience: "Admins & treasurers",
    updated: "2026-10-30",
    related: ["set-up-monthly-hapta", "roles-and-inviting-people", "for-members-check-your-savings"],
    body: [
      {
        type: "p",
        text: "In MandalHisab a **member** is a person who saves with the Mandal. A member does not need a login — the treasurer can run everything. Members who want to check their own savings on their phone can be invited later, and they only ever see their own records.",
      },
      { type: "h2", text: "Add one member" },
      {
        type: "steps",
        items: [
          { title: "Open Members and tap “Add member”", text: "Or use the **+** button in the bottom bar and choose **Add member**." },
          { title: "Enter the full name", text: "This is the only required field." },
          { title: "Membership number", text: "Leave it blank and MandalHisab numbers members automatically (M0001, M0002…), or type your own numbers to match the old register. Letters, digits and / - _ are allowed." },
          { title: "Joining date, mobile, email and address", text: "All optional. The mobile number lets the treasurer call a member straight from the dues list." },
          { title: "Haptas per month", text: "1 for most members. Use 2 or 3 if they pay that many haptas every month under one name." },
          { title: "Invite to the app (optional)", text: "Tick **Invite to the app by email** if they should see their own savings. They set their own password." },
          { title: "Save", text: "The member appears in the list and, if the monthly hapta is set up, is enrolled from their joining month." },
        ],
      },
      { type: "h2", text: "Import many members at once" },
      {
        type: "p",
        text: "If your members are already in a spreadsheet, tap **Import CSV** on the Members screen. Export your sheet as a CSV file (in Excel or Google Sheets: File → Download → CSV, maximum 2 MB), then choose it. MandalHisab first checks the file and tells you how many members are ready to import, how many will be skipped and any errors — nothing is saved until you tap **Import**.",
      },
      {
        type: "table",
        head: ["Column", "Required?", "Notes"],
        rows: [
          ["name", "Yes", "The member's full name"],
          ["membership number", "No", "Leave blank to auto-number"],
          ["phone", "No", "Mobile number"],
          ["email", "No", "Needed only to invite them to the app"],
          ["address", "No", ""],
          ["joining date", "No", "YYYY-MM-DD or DD-MM-YYYY"],
          ["notes", "No", "Anything else worth keeping"],
        ],
        caption: "Rows with a membership number or phone that already exists are skipped, so running the same file twice won't create duplicates.",
      },
      {
        type: "tip",
        title: "Clean the sheet first",
        text: "One member per row, a header row at the top, and no merged cells or totals rows. Check for duplicates — the same person entered twice is the most common problem when moving from a register.",
      },
      { type: "h2", text: "Opening balances" },
      {
        type: "p",
        text: "If the Mandal has been running before MandalHisab, each member already has savings. Open the member and add their **opening balance** — the total they had saved up to your starting date. Their savings passbook then starts from that amount, and every later hapta, interest credit and withdrawal adds to or takes from it.",
      },
      {
        type: "p",
        text: "Opening balances and later corrections are recorded as audited adjustments with a reason, so anyone checking the books can see where a number came from.",
      },
      { type: "h2", text: "Member status" },
      {
        type: "list",
        items: [
          "**Active** — pays hapta and appears on the monthly screen.",
          "**Inactive** — paused; no new hapta is created, but their history and savings stay.",
          "**Left** — has left the Mandal, usually after their savings are paid out.",
        ],
      },
      {
        type: "p",
        text: "Members are never deleted, because their payments are part of the Mandal's history. Changing the status keeps the books complete.",
      },
    ],
  },
  {
    slug: "roles-and-inviting-people",
    title: "Roles, join codes and inviting people",
    description: "The difference between admin, manager and member in MandalHisab, how to share your join code, approve join requests and invite people by email.",
    category: "members",
    kind: "howto",
    audience: "Admins & treasurers",
    updated: "2026-10-30",
    related: ["add-and-import-members", "for-members-check-your-savings", "running-a-transparent-mandal"],
    body: [
      {
        type: "p",
        text: "A Mandal usually has one or two people who handle the money and many members who simply want to know their balance. MandalHisab gives each of them the right view with three roles.",
      },
      {
        type: "table",
        head: ["Role", "Typically", "Can"],
        rows: [
          ["Admin", "Pramukh or treasurer", "Everything: settings, members, money, reports, and who has access"],
          ["Manager", "Helper at the meeting", "Day-to-day work such as collecting hapta — the admin decides exactly what"],
          ["Member", "Every saver", "See only their own savings, hapta, upad, receipts and statements"],
        ],
      },
      {
        type: "p",
        text: "Every request is checked on the server against the person's role in that Mandal, so a member can never open someone else's passbook even with a direct link. One login can belong to several Mandals with a different role in each.",
      },
      { type: "h2", text: "Three ways for people to join" },
      { type: "h3", text: "1. Share the join code" },
      {
        type: "p",
        text: "Each Mandal has a join code, shown under **Users & joining**. Share it on your WhatsApp group. People sign up, choose **Join a Mandal**, and either type the code or search for your Mandal by name. They can add a message such as “I'm Ramesh bhai's son” so you know who they are.",
      },
      { type: "h3", text: "2. Approve the join request" },
      {
        type: "p",
        text: "Join requests appear on your dashboard under **Needs your attention**. Approving one adds the person as a member and links their login to their member record. You also choose the month their hapta starts. If the person is already on your member list (for example, you imported them), link them to that record instead of creating a duplicate.",
      },
      { type: "h3", text: "3. Invite by email" },
      {
        type: "p",
        text: "Open a member and tap **Invite to app**, or tick the invite box when adding them. They get an email with a link. If they already use MandalHisab they just tap **Join**; if not, they create an account with their own password and join straight away. You can also copy the invite link and share it on WhatsApp.",
      },
      { type: "h2", text: "When a login isn't linked" },
      {
        type: "p",
        text: "If a member signs in and sees “Your login isn't linked to a member record yet”, the admin needs to link it: open **Users & joining**, find the person and use **Link member** to connect them to the right member. Their savings appear immediately.",
      },
      {
        type: "tip",
        title: "Keep admins few",
        text: "Two admins is usually right — the treasurer and one trusted backup. Give helpers the manager role with only the permissions they need. Fewer people who can change things means fewer surprises, and the audit log shows who did what either way.",
      },
    ],
  },
];
