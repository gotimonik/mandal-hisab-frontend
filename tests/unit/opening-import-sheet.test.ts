import { describe, expect, it } from "vitest";
import { emptyMember, lastDayOfPrevMonth, mergeRows, monthAfter, parseSheet, toIsoDate, toPaise, TEMPLATE_CSV } from "@/features/opening-import/sheet";

describe("closing sheet helpers", () => {
  it("reads Indian-style amounts and dates", () => {
    expect(toPaise("1,20,000.50")).toBe(12_000_050);
    expect(toPaise("₹ 500")).toBe(50_000);
    expect(toPaise("")).toBe(0);
    expect(toPaise("12.345")).toBeNull();
    expect(toPaise("abc")).toBeNull();
    expect(toIsoDate("10-03-2025")).toBe("2025-03-10");
    expect(toIsoDate("5/8/2026")).toBe("2026-08-05");
    expect(toIsoDate("2026-11-01")).toBe("2026-11-01");
    expect(toIsoDate("March 5")).toBe("");
    expect(lastDayOfPrevMonth("2026-11-18")).toBe("2026-10-31");
    expect(lastDayOfPrevMonth("2026-03-02")).toBe("2026-02-28");
    expect(monthAfter("2026-12-31")).toBe("2027-01");
  });

  it("reads the sample sheet: a member with two upads is two rows", () => {
    const { rows, problems } = parseSheet(TEMPLATE_CSV);
    expect(problems).toEqual([]);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({ name: "Ramesh Patel", phone: "9876500001", shares: "3", savings: "54000", upad: { amount: "20000", monthlyRate: "1.5", interestDue: "600", givenOn: "2025-03-10" } });
    const r = mergeRows([emptyMember()], rows);
    expect(r.added).toBe(2);
    expect(r.upads).toBe(2);
    expect(r.members).toHaveLength(2); // the blank card was used
    expect(r.members[0].upads.map((u) => u.amount)).toEqual(["20000", "5000"]);
    expect(r.members[1]).toMatchObject({ name: "Suresh Shah", shares: "2", savings: "36000", upads: [] });
  });

  it("reads tab-separated rows pasted from Excel without a header, and fills in members already listed", () => {
    const pasted = "Org Admin\t\t2\t36,000\nNew Person\t9876500009\t1\t18000\t10000\t2\t\t";
    const { rows, problems } = parseSheet(pasted);
    expect(problems).toEqual([]);
    const admin = { ...emptyMember(), memberId: "abc", name: "Org  Admin" };
    const r = mergeRows([admin], rows);
    expect(r).toMatchObject({ added: 1, updated: 1, upads: 1 });
    expect(r.members[0]).toMatchObject({ memberId: "abc", shares: "2", savings: "36000" });
    expect(r.members[1].upads[0]).toMatchObject({ amount: "10000", monthlyRate: "2", interestDue: "" });
  });

  it("points out rows it can't read", () => {
    const { rows, problems } = parseSheet("Name,Savings,Upad date\nA B,lots,\n,500,\nC D,100,31-31-2024");
    expect(rows).toHaveLength(2);
    expect(problems.join(" | ")).toMatch(/Line 2 \(A B\): savings is not a number/);
    expect(problems.join(" | ")).toMatch(/Line 3: no name/);
    expect(problems.join(" | ")).toMatch(/upad date/);
  });
});
