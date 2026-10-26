import { expect, test, type Page } from "@playwright/test";

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@mandalhisab.test";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "Admin12345";
const stamp = Date.now().toString(36);

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
}

test.describe.configure({ mode: "serial" });

test("register, create a Mandal, approve it, and record a hapta collection with receipt", async ({ page, browser }) => {
  const email = `treasurer-${stamp}@example.com`;
  const orgName = `Shree Ganesh Mandal ${stamp}`;

  // 1. Register
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Mahesh Treasurer");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("secret123");
  await page.getByLabel("Confirm password").fill("secret123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/onboarding/);

  // 2. Register a Mandal
  await page.getByLabel("Mandal / trust name").fill(orgName);
  await page.getByLabel("City").fill("Surat");
  await page.getByRole("button", { name: "Register Mandal" }).click();
  await expect(page).toHaveURL(/\/org\/[a-f0-9]{24}$/);
  const orgUrl = page.url();
  await expect(page.getByText("awaiting platform approval")).toBeVisible();

  // 3. Platform admin approves it (separate session)
  const adminCtx = await browser.newContext();
  const admin = await adminCtx.newPage();
  await login(admin, ADMIN_EMAIL, ADMIN_PASSWORD);
  await admin.goto(`/platform?q=${encodeURIComponent(orgName)}`);
  const row = admin.getByRole("row", { name: new RegExp(orgName) });
  await row.getByRole("button", { name: "Approve" }).click();
  await expect(row.getByText("active")).toBeVisible();
  await adminCtx.close();

  // 4. Add a member
  await page.goto(`${orgUrl}/members`);
  await page.getByRole("button", { name: "Add member" }).click();
  await page.getByLabel("Full name").fill("Ramesh Patel");
  await page.getByLabel("Mobile").fill("9876543210");
  await page.getByRole("button", { name: "Add member" }).last().click();
  await expect(page.getByRole("heading", { name: "Ramesh Patel" })).toBeVisible();

  // 5. Create a monthly scheme and enroll the member
  await page.goto(`${orgUrl}/schemes/new`);
  await page.getByLabel("Scheme name").fill("Monthly hapta");
  await page.getByLabel("Amount per installment (₹)").fill("500");
  await page.getByLabel("Start date").fill("2026-04-01");
  await page.getByLabel("Due day of month").fill("10");
  await page.getByLabel("Number of installments").fill("12");
  await page.getByRole("button", { name: "Create scheme" }).click();
  await expect(page.getByRole("heading", { name: "Monthly hapta" })).toBeVisible();
  await page.getByRole("button", { name: "Enroll members" }).click();
  await page.getByRole("dialog").getByText("Ramesh Patel").click();
  await page.getByRole("button", { name: /Enroll 1 member/ }).click();
  await expect(page.getByRole("tab", { name: "Members (1)" })).toBeVisible();

  // 6. Record a collection of ₹1,000 (covers two months)
  await page.goto(`${orgUrl}/collections`);
  await page.getByRole("button", { name: "Record collection" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Amount (₹)").fill("1000");
  const memberSelect = dialog.getByLabel("Member", { exact: true });
  await memberSelect.selectOption((await memberSelect.locator("option", { hasText: "Ramesh Patel" }).getAttribute("value"))!);
  await expect(dialog.getByText("Apr 2026")).toBeVisible();
  await expect(dialog.getByText("May 2026")).toBeVisible();
  await dialog.getByRole("button", { name: "Save collection" }).click();
  await expect(page.getByRole("cell", { name: "₹1,000.00" })).toBeVisible();
  await expect(page.getByText("verified", { exact: true })).toBeVisible();

  // 7. Receipt
  await page.getByRole("link", { name: "Receipt" }).first().click();
  await expect(page.getByText(/RCPT\/\d{4}-\d{2}\/\d{6}/)).toBeVisible();
  await expect(page.getByText("Received with thanks from")).toBeVisible();

  // 8. Dashboard and reports reflect real data
  await page.goto(orgUrl);
  await expect(page.getByText("Total member balances")).toBeVisible();
  await page.goto(`${orgUrl}/reports/collections?from=2026-04-01&to=2027-03-31&groupBy=year`);
  await expect(page.getByRole("cell", { name: "2026-27" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "₹1,000.00" }).first()).toBeVisible();
});

test("Parivar Mandal: monthly hapta in cash, interest, withdrawal and cash book", async ({ page, browser }) => {
  const email = `parivar-${stamp}@example.com`;
  const orgName = `Parivar Mandal ${stamp}`;
  const month = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit" }).format(new Date()).slice(0, 7);

  await page.goto("/register");
  await page.getByLabel("Full name").fill("Kokila Admin");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("secret123");
  await page.getByLabel("Confirm password").fill("secret123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/onboarding/);

  // Create the Mandal with a ₹500 monthly hapta
  await page.getByLabel("Mandal / trust name").fill(orgName);
  await page.getByLabel("Monthly hapta per member (₹)").fill("500");
  await page.getByLabel("From month").fill(month);
  await page.getByRole("button", { name: "Register Mandal" }).click();
  await expect(page).toHaveURL(/\/org\/[a-f0-9]{24}$/);
  const orgUrl = page.url();

  const adminCtx = await browser.newContext();
  const admin = await adminCtx.newPage();
  await login(admin, ADMIN_EMAIL, ADMIN_PASSWORD);
  await admin.goto(`/platform?q=${encodeURIComponent(orgName)}`);
  const row = admin.getByRole("row", { name: new RegExp(orgName) });
  await row.getByRole("button", { name: "Approve" }).click();
  await expect(row.getByText("active")).toBeVisible();
  await adminCtx.close();

  // Add a member — enrolled in the monthly hapta automatically
  await page.goto(`${orgUrl}/members`);
  await page.getByRole("button", { name: "Add member" }).click();
  await page.getByLabel("Full name").fill("Asha Patel");
  await page.getByLabel("Mobile").fill("9800000001");
  await page.getByRole("button", { name: "Add member" }).last().click();
  await expect(page.getByRole("heading", { name: "Asha Patel" })).toBeVisible();

  // Monthly hapta: both the admin (a member too) and Asha owe ₹500
  await page.goto(`${orgUrl}/monthly`);
  await expect(page.getByText("₹500.00 per member")).toBeVisible();
  await expect(page.getByText(/of ₹1,000 expected/)).toBeVisible();
  await page.getByRole("button", { name: "Collect from Asha Patel" }).click();
  const collect = page.getByRole("dialog");
  await expect(collect.getByLabel("Amount (₹)")).toHaveValue("500");
  await collect.getByRole("button", { name: "Record cash received" }).click();
  await expect(page.getByRole("button", { name: "Collect from Asha Patel" })).toHaveCount(0);
  await expect(page.getByText("paid", { exact: true }).first()).toBeVisible();

  // Interest (manual) for this month: ₹10 to Asha
  await page.goto(`${orgUrl}/interest`);
  await page.getByLabel("Method").selectOption("manual");
  await page.getByRole("button", { name: "Preview" }).click();
  await page.getByLabel("Interest for Asha Patel").fill("10");
  await page.getByRole("button", { name: /Credit ₹10 interest/ }).click();
  await expect(page.getByRole("cell", { name: month })).toBeVisible();

  // Withdrawal of ₹200: voucher shows the balance after
  await page.goto(`${orgUrl}/withdrawals`);
  await page.getByRole("button", { name: "Record withdrawal" }).click();
  const wd = page.getByRole("dialog");
  const sel = wd.getByLabel("Member");
  await sel.selectOption((await sel.locator("option", { hasText: "Asha Patel" }).getAttribute("value"))!);
  await expect(wd.getByText("₹510.00")).toBeVisible();
  await wd.getByLabel("Amount (₹)").fill("200");
  await wd.getByRole("button", { name: "Record cash paid to member" }).click();
  await expect(page.getByText(/WDL\/\d{4}-\d{2}\/\d{6}/)).toBeVisible();
  await expect(page.getByText("₹310.00")).toBeVisible();

  // Cash book: ₹500 in, ₹200 out, ₹300 closing
  await page.goto(`${orgUrl}/cashbook`);
  await expect(page.getByText("Hapta collected").locator("..").locator("..")).toContainText("₹500.00");
  await expect(page.getByText("Withdrawals paid").locator("..").locator("..")).toContainText("₹200.00");
  await expect(page.getByRole("row", { name: /Closing balance/ })).toContainText("₹300.00");
});

test("Upad: 5 members save ₹5,000, one takes ₹3,000 upad at 10% — ₹300 interest is collected and the fund becomes ₹5,300", async ({ page, browser }) => {
  const email = `fund-${stamp}@example.com`;
  const orgName = `Fund Mandal ${stamp}`;
  const now = new Date(Date.now() + 5.5 * 3600_000);
  const month = now.toISOString().slice(0, 7);
  const lastMonthDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 20)).toISOString().slice(0, 10);

  await page.goto("/register");
  await page.getByLabel("Full name").fill("Arvind Admin");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("secret123");
  await page.getByLabel("Confirm password").fill("secret123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/onboarding/);
  await page.getByLabel("Mandal / trust name").fill(orgName);
  await page.getByLabel("Monthly hapta per member (₹)").fill("1000");
  await page.getByLabel("From month").fill(month);
  await page.getByRole("button", { name: "Register Mandal" }).click();
  await expect(page).toHaveURL(/\/org\/[a-f0-9]{24}$/);
  const orgUrl = page.url();

  const adminCtx = await browser.newContext();
  const admin = await adminCtx.newPage();
  await login(admin, ADMIN_EMAIL, ADMIN_PASSWORD);
  await admin.goto(`/platform?q=${encodeURIComponent(orgName)}`);
  const row = admin.getByRole("row", { name: new RegExp(orgName) });
  await row.getByRole("button", { name: "Approve" }).click();
  await expect(row.getByText("active")).toBeVisible();
  await adminCtx.close();

  // 4 more members (the admin is the 5th)
  for (const name of ["Bina Shah", "Chirag Shah", "Dipa Shah", "Ekta Shah"]) {
    await page.goto(`${orgUrl}/members`);
    await page.getByRole("button", { name: "Add member" }).click();
    await page.getByLabel("Full name").fill(name);
    await page.getByRole("button", { name: "Add member" }).last().click();
    await expect(page.getByRole("heading", { name })).toBeVisible();
  }

  // everyone pays ₹1,000 → ₹5,000 in the fund
  await page.goto(`${orgUrl}/monthly`);
  for (let i = 0; i < 5; i++) {
    const collectButtons = page.getByRole("button", { name: /^Collect from / });
    await collectButtons.first().waitFor();
    const before = await collectButtons.count();
    await collectButtons.first().click();
    await page.getByRole("dialog").getByRole("button", { name: "Record cash received" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(collectButtons).toHaveCount(before - 1); // wait for the refreshed list
  }
  await expect(page.getByRole("button", { name: /^Collect from / })).toHaveCount(0);

  // Bina borrows ₹3,000 at 10% a month (given last month)
  await page.goto(`${orgUrl}/fund-loans`);
  await page.getByRole("button", { name: "Give upad" }).click();
  const give = page.getByRole("dialog");
  const sel = give.getByLabel("Member taking upad");
  await sel.selectOption((await sel.locator("option", { hasText: "Bina Shah" }).getAttribute("value"))!);
  await give.getByLabel("Amount (₹)").fill("3000");
  await give.getByLabel("Interest (% per month)").fill("10");
  await give.getByLabel("Date given").fill(lastMonthDay);
  await expect(give.getByText("₹300.00")).toBeVisible();
  await give.getByRole("button", { name: "Give upad" }).click();
  await expect(page.getByText(/UPAD\/\d{4}-\d{2}\/\d{6}/).first()).toBeVisible();

  // this month's screen shows ₹300 loan interest due → record it as paid
  await page.goto(`${orgUrl}/monthly`);
  await expect(page.getByRole("heading", { name: /Upad interest/ })).toBeVisible();
  await page.getByRole("button", { name: /Receive — Bina Shah/ }).click();
  const payDlg = page.getByRole("dialog");
  await expect(payDlg.getByLabel("Interest received (₹)")).toHaveValue("300");
  await payDlg.getByRole("button", { name: "Record as paid" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Receive — Bina Shah/ })).toHaveCount(0);

  // fund: ₹2,300 cash + ₹3,000 lent = ₹5,300; each member's share of the interest is ₹60
  await page.goto(orgUrl);
  await expect(page.getByText("Mandal fund").locator("..").locator("..")).toContainText("5,300");
  await expect(page.getByText("Total member balances").locator("..").locator("..")).toContainText("5,300");
  await page.goto(`${orgUrl}/members`);
  await expect(page.getByRole("row", { name: /Ekta Shah/ })).toContainText("₹1,060.00");
});

test("Upad request: a member asks within the available cash and the admin approves it", async ({ page, browser }) => {
  const adminEmail = `reqadmin-${stamp}@example.com`;
  const memberEmail = `reqmember-${stamp}@example.com`;
  const orgName = `Request Mandal ${stamp}`;
  const month = new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 7);
  const register = async (p: Page, name: string, email: string) => {
    await p.goto("/register");
    await p.getByLabel("Full name").fill(name);
    await p.getByLabel("Email").fill(email);
    await p.getByLabel("Password", { exact: true }).fill("secret123");
    await p.getByLabel("Confirm password").fill("secret123");
    await p.getByRole("button", { name: "Create account" }).click();
    await expect(p).toHaveURL(/\/onboarding/);
  };

  // admin creates the Mandal (₹1,000 hapta) and it is approved
  await register(page, "Ravi Admin", adminEmail);
  await page.getByLabel("Mandal / trust name").fill(orgName);
  await page.getByLabel("Monthly hapta per member (₹)").fill("1000");
  await page.getByLabel("From month").fill(month);
  await page.getByRole("button", { name: "Register Mandal" }).click();
  await expect(page).toHaveURL(/\/org\/[a-f0-9]{24}$/);
  const orgUrl = page.url();
  const pa = await (await browser.newContext()).newPage();
  await login(pa, ADMIN_EMAIL, ADMIN_PASSWORD);
  await pa.goto(`/platform?q=${encodeURIComponent(orgName)}`);
  const row = pa.getByRole("row", { name: new RegExp(orgName) });
  await row.getByRole("button", { name: "Approve" }).click();
  await expect(row.getByText("active")).toBeVisible();
  await page.goto(`${orgUrl}/users`);
  const code = (await page.locator("span.font-mono").first().textContent())!.trim();

  // member registers, finds the Mandal by code and requests to join; admin approves
  const memberCtx = await browser.newContext();
  const member = await memberCtx.newPage();
  await register(member, "Sonal Member", memberEmail);
  await member.getByLabel("Mandal name or join code").fill(code);
  await member.getByRole("button", { name: "Find" }).click();
  await member.getByRole("button", { name: "Request to join" }).click();
  await expect(member.getByText("Request sent").first()).toBeVisible();
  await page.reload();
  await page.getByRole("listitem").filter({ hasText: "Sonal Member" }).getByRole("button", { name: "Review" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Approve" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // both pay ₹1,000 → ₹2,000 available
  await page.goto(`${orgUrl}/monthly`);
  for (let i = 0; i < 2; i++) {
    const collectButtons = page.getByRole("button", { name: /^Collect from / });
    await collectButtons.first().waitFor();
    const before = await collectButtons.count();
    await collectButtons.first().click();
    await page.getByRole("dialog").getByRole("button", { name: "Record cash received" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(collectButtons).toHaveCount(before - 1); // wait for the refreshed list
  }

  // member asks for upad: more than available is blocked, ₹1,500 is sent
  await member.goto(`${orgUrl}/my?tab=upad`);
  await expect(member.getByText("Available in the Mandal")).toBeVisible();
  await member.getByRole("button", { name: "Request upad" }).click();
  const dlg = member.getByRole("dialog");
  await expect(dlg.getByText("₹2,000.00")).toBeVisible();
  await dlg.getByLabel("Amount needed (₹)").fill("2500");
  await expect(dlg.getByText("More than what's available")).toBeVisible();
  await expect(dlg.getByRole("button", { name: "Send request" })).toBeDisabled();
  await dlg.getByLabel("Amount needed (₹)").fill("1500");
  await dlg.getByLabel("Purpose (optional)").fill("School fees");
  await dlg.getByRole("button", { name: "Send request" }).click();
  await expect(member.getByText("Your request is waiting for approval")).toBeVisible();

  // admin sees it on the dashboard and approves on the Upad screen at 10%
  await page.goto(orgUrl);
  await page.getByRole("link", { name: /Upad requests/ }).click();
  await expect(page.getByText("Requests waiting (1)")).toBeVisible();
  await page.getByRole("button", { name: "Approve" }).click();
  const ap = page.getByRole("dialog");
  await ap.getByLabel("Interest (% per month)").fill("10");
  await expect(ap.getByText("₹150.00 interest a month")).toBeVisible();
  await ap.getByRole("button", { name: "Approve and give upad" }).click();
  await expect(page.getByText(/UPAD\/\d{4}-\d{2}\/\d{6}/).first()).toBeVisible();
  await expect(page.getByText("Requests waiting")).toHaveCount(0);

  // member sees the request approved and the upad
  await member.goto(`${orgUrl}/my?tab=upad`);
  await expect(member.getByText("approved").first()).toBeVisible();
  await expect(member.getByText(/UPAD\/\d{4}-\d{2}\/\d{6}/).first()).toBeVisible();

  // member uses "I have paid" → Upad → returns ₹500 by UPI
  await member.getByRole("button", { name: "I have paid" }).click();
  const paid = member.getByRole("dialog");
  await expect(paid.getByText("What is this payment for?")).toBeVisible();
  await paid.getByRole("radio", { name: /Upad/ }).click();
  await paid.getByLabel("Upad returned (₹)").fill("500");
  await paid.getByLabel("Paid by").selectOption("upi");
  await paid.getByLabel("UPI / bank reference").fill("UPI-778899");
  await paid.getByRole("button", { name: "Submit for verification" }).click();
  await expect(member.getByRole("dialog")).toHaveCount(0);
  await expect(member.getByLabel("Upad payments you reported")).toContainText("pending");

  // admin verifies it on the Upad screen → outstanding drops to ₹1,000
  await page.goto(`${orgUrl}/fund-loans`);
  await expect(page.getByText("Payments to verify (1)")).toBeVisible();
  await expect(page.getByText(/ref UPI-778899/)).toBeVisible();
  await page.getByRole("button", { name: "Verify" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Verify" }).click();
  await expect(page.getByText("Payments to verify")).toHaveCount(0);
  await expect(page.getByRole("row", { name: /Sonal Member/ })).toContainText("₹1,000.00");
  await member.reload();
  await expect(member.getByLabel("Upad payments you reported")).toContainText("verified");
  await memberCtx.close();
});

test("unauthenticated users are sent to login and cannot open organization pages", async ({ page }) => {
  await page.goto("/org/0123456789abcdef01234567/members");
  await expect(page).toHaveURL(/\/login\?next=/);
});
