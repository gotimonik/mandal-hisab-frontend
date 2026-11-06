import { describe, expect, it } from "vitest";
import QRCode from "qrcode";
import { upiLink } from "@/features/my/upi-pay";

describe("UPI pay link", () => {
  it("fills the Mandal's UPI ID, name, amount and note, %-encoded", () => {
    expect(upiLink({ upiId: "gotimandal@okaxis", payeeName: "Goti Parivar Mandal", amountPaise: 50050, note: "Monthly hapta" })).toBe(
      "upi://pay?pa=gotimandal%40okaxis&pn=Goti%20Parivar%20Mandal&am=500.50&cu=INR&tn=Monthly%20hapta",
    );
  });

  it("leaves the amount for the member to type when there is none, and keeps names short", () => {
    const link = upiLink({ upiId: "m@ybl", payeeName: "ગોટી પરિવાર મંડળ ".repeat(5), amountPaise: 0 });
    expect(link).not.toContain("am=");
    expect(link).not.toContain("tn=");
    expect(decodeURIComponent(new URL(link.replace("upi://", "https://x/")).searchParams.get("pn")!).length).toBeLessThanOrEqual(50);
  });

  it("makes a QR code of it", async () => {
    const svg = await QRCode.toString(upiLink({ upiId: "m@ybl", payeeName: "Mandal", amountPaise: 100 }), { type: "svg" });
    expect(svg).toMatch(/^<svg/);
  });
});
