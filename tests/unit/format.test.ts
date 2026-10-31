import { describe, expect, it } from "vitest";
import { formatDate, formatINR, formatINRCompact, isoDate, paiseToRupeeInput } from "@/lib/format";
import { rupees } from "@/lib/schemas";
import { buildNav } from "@/lib/nav";

describe("formatting", () => {
  it("formats paise as INR with Indian grouping", () => {
    expect(formatINR(12500000)).toBe("₹1,25,000.00");
    expect(formatINR(1234567890)).toBe("₹1,23,45,678.90");
    expect(formatINR(-5050)).toBe("-₹50.50");
    expect(formatINRCompact(12500000)).toBe("₹1.25 L");
    expect(formatINRCompact(2500000000)).toBe("₹2.50 Cr");
  });
  it("round-trips amounts for inputs", () => {
    expect(paiseToRupeeInput(100050)).toBe("1000.50");
    expect(paiseToRupeeInput(100000)).toBe("1000");
  });
  it("formats calendar dates without timezone drift", () => {
    expect(formatDate("2026-04-05T00:00:00.000Z")).toBe("05 Apr 2026");
    expect(isoDate("2026-04-05T00:00:00.000Z")).toBe("2026-04-05");
  });
});

describe("amount validation", () => {
  it("accepts up to 2 decimals and rejects bad input", () => {
    expect(rupees.safeParse("1,250.50").success).toBe(true);
    expect(rupees.safeParse("10.005").success).toBe(false);
    expect(rupees.safeParse("0").success).toBe(false);
    expect(rupees.safeParse("-5").success).toBe(false);
  });
});

describe("navigation", () => {
  it("hides items the user cannot access", () => {
    const member = buildNav("a".repeat(24), ["org.view", "self.view", "self.submitPayment"], "member").map((n) => n.label);
    expect(member).toEqual(["Dashboard", "My savings", "Notifications", "Meetings"]);
    const admin = buildNav("a".repeat(24), ["org.view", "members.view", "memberships.manage", "org.settings.manage", "self.view"], "admin").map((n) => n.label);
    expect(admin).toContain("Users & joining");
    expect(admin).toContain("Settings");
    expect(admin).toContain("Withdrawals");
    expect(admin).toContain("Upad");
  });

  it("puts the daily Mandal screens first and less-used tools under More", () => {
    const all = ["org.view", "members.view", "installments.view", "payments.view", "accounts.view", "reports.view", "loans.view", "self.view"];
    const nav = buildNav("a".repeat(24), all, "admin");
    const main = nav.filter((n) => !n.more).map((n) => n.label);
    const more = nav.filter((n) => n.more).map((n) => n.label);
    expect(main.slice(0, 7)).toEqual(["Dashboard", "My account", "Monthly hapta", "Members", "Upad", "Withdrawals", "Cash book"]);
    expect(more).toContain("EMI loans");
    expect(more).toContain("Interest credit");
    expect(more).toContain("All collections");
    // "More" items always come after the main ones
    expect(nav.findIndex((n) => n.more)).toBeGreaterThan(nav.findLastIndex((n) => !n.more));
    expect(nav.filter((n) => n.primary).map((n) => n.label)).toEqual(["Dashboard", "Monthly hapta", "Members", "Upad"]);
  });
});
