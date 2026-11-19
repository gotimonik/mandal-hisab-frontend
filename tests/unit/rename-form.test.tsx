import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }), useSearchParams: () => new URLSearchParams() }));
vi.mock("@/app/actions/api", () => ({ apiMutate: vi.fn(async () => ({ ok: true, data: { renamed: 2 } })) }));

import { RenameForm } from "@/features/members/rename-form";

const rows = [
  { _id: "a", membershipNumber: "M0001", name: "Monik Goti" },
  { _id: "b", membershipNumber: "M0002", name: "Vipul Goti" },
  { _id: "c", membershipNumber: "M0003", name: "Abhishek Goti" },
];

describe("Edit names", () => {
  it("fills the boxes from a pasted list", async () => {
    render(<RenameForm orgId="o1" rows={rows} />);
    fireEvent.click(screen.getByRole("button", { name: /Paste a list/ }));
    const area = await screen.findByRole("textbox", { name: "" }).catch(() => null);
    const ta = (area ?? document.querySelector("textarea")) as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: "M0001 મોનિક ગોટી\nM0003 અભિષેક ગોટી" } });
    fireEvent.click(await screen.findByRole("button", { name: /Fill in 2 names/ }));
    await waitFor(() => expect((screen.getByLabelText("New name for Monik Goti") as HTMLInputElement).value).toBe("મોનિક ગોટી"));
    expect((screen.getByLabelText("New name for Abhishek Goti") as HTMLInputElement).value).toBe("અભિષેક ગોટી");
    expect((screen.getByLabelText("New name for Vipul Goti") as HTMLInputElement).value).toBe("Vipul Goti");
  });
});

import { readNameList } from "@/features/members/rename-form";

describe("reading a pasted list of names", () => {
  const list = "M0001 મોનિક ગોટી\nM0003 અભિષેક ગોટી";
  it("matches by member number whatever came with the copy", () => {
    for (const t of [list, "```\n" + list + "\n```", list.split("\n").map((l) => "  " + l).join("\r\n"), list.replace(/ /g, " "), "1) x\n" + list]) {
      const r = readNameList(t, rows);
      expect(r.names).toMatchObject({ a: "મોનિક ગોટી", c: "અભિષેક ગોટી" });
      expect(r.names.b).toBeUndefined();
    }
  });
  it("takes names in the order of the list when there are no numbers", () => {
    expect(readNameList("મોનિક ગોટી\nવિપુલ ગોટી", rows).names).toEqual({ a: "મોનિક ગોટી", b: "વિપુલ ગોટી" });
  });
});
