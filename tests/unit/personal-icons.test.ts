import { describe, expect, it } from "vitest";
import { categoryIconKey, suggestIcons } from "@/features/personal/icons";

describe("Personal Hisab category icons", () => {
  it("suggests an icon from the name, in English, Gujarati and Hindi", () => {
    expect(suggestIcons("Petrol pump", "expense")[0]).toBe("fuel");
    expect(suggestIcons("Chai nasto", "expense")[0]).toBe("coffee");
    expect(suggestIcons("Light bill", "expense")[0]).toBe("zap");
    expect(suggestIcons("કરિયાણું", "expense")[0]).toBe("shopping-cart");
    expect(suggestIcons("બાળકોની સ્કૂલ ફી", "expense")[0]).toBe("graduation-cap");
    expect(suggestIcons("दवाई", "expense")[0]).toBe("pill");
    expect(suggestIcons("Mandal hapto", "expense")[0]).toBe("hand-coins");
    expect(suggestIcons("Pet care", "expense")[0]).toBe("paw-print");
  });

  it("doesn't match a short word inside a longer one", () => {
    expect(suggestIcons("Business", "income").slice(0, 2)).not.toContain("bus");
    expect(suggestIcons("Petrol", "expense")).not.toContain("paw-print");
  });

  it("always offers a full row, starting from common ones when nothing matches", () => {
    expect(suggestIcons("", "expense")).toHaveLength(6);
    expect(suggestIcons("zzz", "income")[0]).toBe("briefcase");
  });

  it("uses the category's own icon, else guesses from its name", () => {
    expect(categoryIconKey({ icon: "car", name: "Petrol", kind: "expense", key: null })).toBe("car");
    expect(categoryIconKey({ icon: null, name: "Petrol", kind: "expense", key: null })).toBe("fuel");
    expect(categoryIconKey({ icon: "not-an-icon", name: "Doodh", kind: "expense", key: null })).toBe("milk");
  });
});
