# MandalHisab — Web app (mandal-hisab-frontend)

The mobile-first web interface for MandalHisab: financial management for Mandals, trusts and community organizations. It talks to the API in [`mandal-hisab-backend`](../mandal-hisab-backend) — see that README for the data model, financial rules, roles and the full feature list.

## Stack

Next.js 16 (App Router, Cache Components, Server Actions) · TypeScript · Tailwind CSS 4 · shadcn/ui (Base UI) · React Hook Form + Zod · Recharts · date-fns · Vitest + Testing Library · Playwright.

## How it works

- **Backend-for-frontend.** On login the API session token is stored in an **HttpOnly, SameSite=Lax, Secure (in production) cookie**. Server Components read data with `api()` (`src/lib/server/api.ts`), and every mutation goes through a Server Action (`src/app/actions/*`) that attaches the token on the server. Browser JavaScript never sees the token, the API URL or any secret, and there is no direct browser→database path.
- **Authorization is enforced by the API on every call.** The UI only *hides* navigation and buttons the user's permissions don't allow (`src/lib/nav.ts`, `org.myPermissions`).
- `src/proxy.ts` (Next 16's middleware) does an optimistic redirect to `/login` when the session cookie is missing.
- CSV exports go through `/api/export`, which forwards to the API with the user's session, so exports follow the same permissions.
- Receipts, statements and reports have print-optimized layouts — use **Print / Save as PDF**.

## Screens

Login · register · forgot/reset password · email verification · invitations · onboarding (create a Mandal or join with a code) · platform admin (approve/suspend/archive orgs) · account (profile, password, sign out everywhere).

**Everyday Mandal screens** (the main menu; everything else is under *More*):

| Screen | What you do there |
|---|---|
| Dashboard | Members, this month's expected / collected / pending hapta, total member balances, Mandal fund (cash + upad given out), upad interest due, interest credited, recent withdrawals |
| Monthly hapta (`/monthly`) | Pick a month; see every member's expected, collected, due, status, payment date and who recorded it; tap **Collect** to record cash (part payments allowed, double entries flagged); add members who aren't in the hapta yet; **Month summary** report |
| Members | List with savings balance; add or invite; profile with savings passbook, opening balance, audited adjustments, withdrawal, dues statement |
| Interest (`/interest`) | Preview rate-based (% per month on last month's balance) or manual amounts, then credit once per month; history of credits |
| Upad (`/fund-loans`) | Give a member upad (a loan) from the Mandal's cash at a monthly rate (default in Settings); see what's lent out and interest due; each loan's month-by-month interest, payments and receipts; **Receive** records interest (oldest month first) and/or part of the upad returned. Members' **upad requests** wait at the top to approve (choose the rate) or reject with a reason; the dashboard links to them. Interest is shared among all members' balances. The Monthly hapta screen also lists the month's upad interest with unpaid earlier months carried forward |
| Withdrawals (`/withdrawals`) | Record cash paid to a member with their available balance shown; printable voucher; reverse a mistake |
| Cash book (`/cashbook`) | Opening, hapta collected, other receipts, withdrawals, other expenses, closing — line by line; cash in/out entries; CSV |
| Users & joining | Join requests (approve as a new member with a hapta start month), open invitations (revoke), roles |
| Settings | Monthly hapta amount (future months only), interest defaults, withdrawal exceptions, joining options, manager permissions |
| My savings (members) | Balance, hapta, interest, withdrawals and passbook — their own data only; **My upad** shows the cash available in the Mandal, **Request upad** (up to that amount), their requests with status, and their upad. **I have paid** asks what the payment is for — monthly hapta (shows what's due), upad (interest due pre-filled, and/or amount returned) or other — and the admin verifies it |

Onboarding lets a user create a Mandal with its monthly hapta, **find a Mandal by name or join code** and request to join, and accept or decline **in-app invitations**. Invitation links work for people without an account (register → back to the invitation).

Inside an organization (`/org/:orgId`), also: role-based dashboard (admin / manager / member) · members (search, CSV import, statements) · hapta schemes (create, enroll, per-period due date/amount/skip, future amount changes, pause/resume/close) · installments (filters, change due date/amount, defer, waive, cancel) · collections (record with live allocation preview, verify, reject, reverse) · receipts · donations · expenses (attachments, approval, reimbursement) · accounts (opening balances, transfers, adjustments) · transactions (double-entry journal) · loans (application with schedule preview, approve, disburse, repay with allocation preview, early closure quote, rate change, reversal) · 12 reports with CSV export · notifications · users & roles · settings · audit log · member self-service ("My savings": balance, passbook, monthly hapta, withdrawals, payments, receipts, statement, loans, "I have paid").

Design: sidebar on desktop, bottom navigation + slide-out menu on phones, native selects/date pickers for mobile, INR formatting with Indian grouping (₹1,25,000.00), dd MMM yyyy dates, loading skeletons, empty and error states, confirmation dialogs with reasons for sensitive actions, light/dark themes.

## Local setup

```bash
npm install
cp .env.example .env.local     # API_URL=http://localhost:4000/api/v1
npm run dev                    # http://localhost:3000
```

Run the API first (see the backend README) and seed a platform admin to approve new organizations.

| Variable | Description |
|---|---|
| `API_URL` | Server-side URL of the API including `/api/v1` |

## Scripts

| Command | |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run typecheck` | Generate route types and run `tsc` |
| `npm run lint` | ESLint |
| `npm test` | Unit/component tests (Vitest + Testing Library) |
| `npm run test:e2e` | Playwright end-to-end tests (needs running frontend + API, `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD` for a seeded platform admin, and a disposable database) |

The E2E suite registers a user, creates a Mandal, approves it as platform admin, adds a member, creates a monthly scheme, enrolls the member, records a ₹1,000 collection (checks it is allocated to Apr + May), opens the receipt and verifies the dashboard and yearly report. A second flow creates *Parivar Mandal* with a ₹500 monthly hapta, adds a member, collects her ₹500 in cash from the Monthly hapta screen, credits ₹10 interest, pays a ₹200 withdrawal (voucher shows ₹310 left) and checks the cash book (₹500 in, ₹200 out, ₹300 closing). A third flow is the upad example: 5 members pay ₹1,000 each, one takes ₹3,000 upad at 10% a month, the ₹300 interest is received from the Monthly hapta screen, and the dashboard shows a ₹5,300 fund with each member at ₹1,060. It also checks unauthenticated redirects and that the login page has no horizontal scroll on a phone.

## Deploying to Vercel

1. Deploy the API first, then import this repo as a separate Vercel project.
2. Set `API_URL=https://<api-project>.vercel.app/api/v1` (Production and Preview).
3. Deploy. Cookies are `Secure` automatically in production; Server Actions are protected by Next.js's same-origin check.

## Capacitor (Android / iOS) roadmap

Two supported paths, neither embeds secrets in the binary:

1. **Hosted web app in a native shell (recommended first step).** Create a Capacitor project whose `server.url` points to the deployed frontend (e.g. `https://app.mandalhisab.in`). Sessions keep working through the HttpOnly cookie; add the domain to `server.allowNavigation`.
2. **Native client calling the API directly.** Build a client that stores the bearer token in secure storage (Keychain/Keystore) and calls the API; add `capacitor://localhost` and `https://localhost` to the API's `CORS_ALLOWED_ORIGINS`.

Later phases: deep links (`/verify-email`, `/reset-password`, `/invite`) via App Links / Universal Links, app icons and splash screens (`@capacitor/assets`), push notifications (`@capacitor/push-notifications` → register device tokens with the API and fan out from its `notify()`), and safe-area handling (already uses `env(safe-area-inset-bottom)`).

## Project structure

```
src/
  app/                 routes: (auth), (app) onboarding/account/platform, org/[orgId]/…, api/export
  app/actions/         Server Actions (auth, generic API mutate/read, uploads)
  components/ui/       shadcn/ui components
  components/app/      app shell, tables, filters, dialogs, money, status badges
  features/            feature forms & views (members, schemes, collections, loans, reports, …)
  lib/                 formatting, types, nav, schemas; lib/server = session, API client, loaders
tests/unit, tests/e2e
```
