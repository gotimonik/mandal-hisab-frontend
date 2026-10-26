import { expect, test } from "@playwright/test";

test("mobile layout: login page fits and has no horizontal scroll", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
