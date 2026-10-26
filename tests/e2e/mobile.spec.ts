import { expect, test } from "@playwright/test";

test("mobile layout: login page fits and has no horizontal scroll", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("phone: quick actions, deep-linked forms and instant search on monthly hapta", async ({ page, browser, isMobile }) => {
  test.skip(!isMobile, "phone layout only");
  const stamp = Date.now().toString(36);
  const orgName = `Phone Mandal ${stamp}`;
  const month = new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 7);

  await page.goto("/register");
  await page.getByLabel("Full name").fill("Pinal Admin");
  await page.getByLabel("Email").fill(`phone-${stamp}@example.com`);
  await page.getByLabel("Password", { exact: true }).fill("secret123");
  await page.getByLabel("Confirm password").fill("secret123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/onboarding/);
  await page.getByLabel("Mandal / trust name").fill(orgName);
  await page.getByLabel("Monthly hapta per member (₹)").fill("500");
  await page.getByLabel("From month").fill(month);
  await page.getByRole("button", { name: "Register Mandal" }).click();
  await expect(page).toHaveURL(/\/org\/[a-f0-9]{24}$/);
  const orgUrl = page.url();

  const adminCtx = await browser.newContext();
  const admin = await adminCtx.newPage();
  await admin.goto("/login");
  await admin.getByLabel("Email").fill(process.env.E2E_ADMIN_EMAIL ?? "admin@mandalhisab.test");
  await admin.getByLabel("Password").fill(process.env.E2E_ADMIN_PASSWORD ?? "Admin12345");
  await admin.getByRole("button", { name: "Sign in" }).click();
  await admin.waitForURL((u) => !u.pathname.startsWith("/login"));
  await admin.goto(`/platform?q=${encodeURIComponent(orgName)}`);
  const row = admin.getByRole("row", { name: new RegExp(orgName) });
  await row.getByRole("button", { name: "Approve" }).click();
  await expect(row.getByText("active")).toBeVisible();
  await adminCtx.close();

  // "+" → Add member opens the form straight away (bottom sheet)
  await page.goto(orgUrl);
  await page.getByRole("button", { name: "Quick actions" }).click();
  await page.getByRole("link", { name: "Add member" }).click();
  await expect(page).toHaveURL(/\/members\?new=1/);
  await page.getByRole("dialog").getByLabel("Full name").fill("Hiral Shah");
  await page.getByRole("dialog").getByRole("button", { name: "Add member" }).click();
  await expect(page.getByRole("heading", { name: "Hiral Shah" })).toBeVisible();

  // monthly hapta: search filters instantly, the button shows the amount, one tap records it
  await page.goto(`${orgUrl}/monthly`);
  await page.getByLabel("Search members").fill("hiral");
  await expect(page.getByRole("button", { name: /^Collect from / })).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Collect from Hiral Shah" })).toContainText("₹500");
  await page.getByRole("button", { name: "Collect from Hiral Shah" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Record cash received" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Collect from Hiral Shah" })).toHaveCount(0);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
