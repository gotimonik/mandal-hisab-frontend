import { describe, expect, it } from "vitest";
import { addExisting, emptyMember, notInList, type MemberDraft } from "@/features/opening-import/sheet";

const existing = [
  { _id: "a", name: "Ramesh Patel", phone: "9876500001", shares: 3 },
  { _id: "b", name: "Suresh Shah", phone: null, shares: 1 },
  { _id: "c", name: "Mina Desai", phone: "+91 98765 00003", shares: 2 },
];

describe("members already in the Mandal", () => {
  it("fills a fresh list with them, using the blank card", () => {
    const r = addExisting([emptyMember()], existing);
    expect(r.added).toBe(3);
    expect(r.members).toHaveLength(3);
    expect(r.members[0]).toMatchObject({ memberId: "a", name: "Ramesh Patel", shares: "3" });
    expect(notInList(r.members, existing)).toEqual([]);
  });

  it("links typed cards by phone or name and keeps what was typed", () => {
    const typed: MemberDraft[] = [
      { ...emptyMember(), name: "Ramesh bhai", phone: "98765-00001", savings: "54000" },
      { ...emptyMember(), name: "suresh  shah", savings: "36000" },
      { ...emptyMember(), name: "New Person", savings: "1000" },
    ];
    const r = addExisting(typed, existing);
    expect(r.linked).toBe(2);
    expect(r.added).toBe(1);
    expect(r.members).toHaveLength(4);
    expect(r.members[0]).toMatchObject({ memberId: "a", name: "Ramesh Patel", savings: "54000" });
    expect(r.members[1]).toMatchObject({ memberId: "b", name: "Suresh Shah", savings: "36000" });
    expect(r.members[2].memberId).toBeUndefined();
    expect(r.members[3]).toMatchObject({ memberId: "c", phone: "+91 98765 00003", shares: "2" });
  });

  it("only adds members not in the list yet (a draft saved before they joined)", () => {
    const draft = addExisting([emptyMember()], existing.slice(0, 1)).members;
    draft[0].savings = "500";
    expect(notInList(draft, existing).map((m) => m._id)).toEqual(["b", "c"]);
    const r = addExisting(draft, existing);
    expect(r.added).toBe(2);
    expect(r.members[0].savings).toBe("500");
  });
});

describe("running upad given-on date", () => {
  it("defaults to the closing date and moves with it", async () => {
    const { emptyUpad, mergeRows, moveClosingDate, parseSheet } = await import("@/features/opening-import/sheet");
    expect(emptyUpad("2026-10-31").givenOn).toBe("2026-10-31");
    const { rows } = parseSheet("Name,Upad,Upad date\nA,1000,\nB,2000,05-08-2026");
    const r = mergeRows([], rows, "2026-10-31");
    expect(r.members.map((m) => m.upads[0].givenOn)).toEqual(["2026-10-31", "2026-08-05"]);
    const moved = moveClosingDate(r.members, "2026-10-31", "2026-09-30");
    expect(moved.map((m) => m.upads[0].givenOn)).toEqual(["2026-09-30", "2026-08-05"]);
    expect(moveClosingDate(r.members, "", "2026-09-30")).toBe(r.members);
  });
});
