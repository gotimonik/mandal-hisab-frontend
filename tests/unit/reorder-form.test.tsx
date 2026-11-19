import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const apiMutate = vi.fn(async (_input: unknown) => ({ ok: true, data: { ordered: 3 } }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/app/actions/api", () => ({ apiMutate: (input: unknown) => apiMutate(input) }));

import { moveItem, ReorderForm } from "@/features/members/reorder-form";

const rows = [
  { _id: "a", membershipNumber: "M0003", name: "Abhishek" },
  { _id: "b", membershipNumber: "M0001", name: "Monik" },
  { _id: "c", membershipNumber: "M0002", name: "Vipul" },
];
const shown = () => screen.getAllByText(/^(Abhishek|Monik|Vipul)$/).map((e) => e.textContent);

describe("ordering members", () => {
  it("moves an item", () => {
    expect(moveItem([1, 2, 3, 4], 0, 2)).toEqual([2, 3, 1, 4]);
    expect(moveItem([1, 2, 3, 4], 3, 1)).toEqual([1, 4, 2, 3]);
    expect(moveItem([1, 2], 0, 5)).toEqual([1, 2]);
  });
  it("reorders with the arrows and quick sorts, then saves the order", async () => {
    render(<ReorderForm orgId="o1" rows={rows} />);
    const save = screen.getByRole("button", { name: /Save order/ });
    expect(save).toBeDisabled(); // nothing changed yet
    fireEvent.click(screen.getByRole("button", { name: "Move Vipul up" }));
    expect(shown()).toEqual(["Abhishek", "Vipul", "Monik"]);
    fireEvent.click(screen.getByRole("button", { name: /By member no/ }));
    expect(shown()).toEqual(["Monik", "Vipul", "Abhishek"]);
    fireEvent.click(save);
    await vi.waitFor(() => expect(apiMutate).toHaveBeenCalledWith({ path: "/orgs/o1/members/order", body: { memberIds: ["b", "c", "a"] } }));
  });
});
