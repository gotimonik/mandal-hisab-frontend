import { describe, expect, it } from "vitest";
import { findUpiApp, parseBillText, type BillCategory } from "@/features/personal/bill-text";

const today = "2026-11-03";
const cats: BillCategory[] = [
  { _id: "c-food", kind: "expense", key: "food", name: "Food & dining" },
  { _id: "c-groc", kind: "expense", key: "groceries", name: "Groceries" },
  { _id: "c-fuel", kind: "expense", key: "transport", name: "Travel & fuel" },
  { _id: "c-bills", kind: "expense", key: "bills", name: "Bills & recharge" },
  { _id: "c-health", kind: "expense", key: "health", name: "Health & medicine" },
  { _id: "c-other", kind: "expense", key: "other", name: "Other expense" },
  { _id: "c-milk", kind: "expense", key: null, name: "Milk" },
  { _id: "c-gift", kind: "income", key: "gift", name: "Gifts received" },
];
const read = (text: string) => parseBillText(text, { today, categories: cats });

describe("reading a bill's text", () => {
  it("supermarket receipt: grand total, not subtotal / GST / savings", () => {
    const r = read(`AVENUE SUPERMARTS LTD
D-MART ADAJAN SURAT
GSTIN: 24AACCA8432H1ZQ
TAX INVOICE
Bill No: 1234 Date: 02/11/2026 18:45
Toor Dal 1kg      1   165.00
Amul Milk 500ml   2    56.00
Sub Total               1,221.00
CGST 2.5%                 15.26
SGST 2.5%                 15.26
Round Off                  -0.52
Grand Total           ₹ 1,251.00
You Saved Rs. 120.00
Paid by UPI`);
    expect(r).toMatchObject({ isBill: true, amount: "1251.00", date: "2026-11-02", merchant: "Avenue Supermarts Ltd", categoryId: "c-groc", walletKind: "upi", type: "expense" });
  });

  it("restaurant: net payable beats total; value on the next line", () => {
    const r = read(`Shree Krishna Dining Hall
Ring Road, Surat
Date: 01-Nov-2026
Total  840.00
Discount 40.00
Net Payable
800.00
Thank you`);
    expect(r).toMatchObject({ amount: "800.00", date: "2026-11-01", merchant: "Shree Krishna Dining Hall", categoryId: "c-food" });
  });

  it("petrol pump with a card payment", () => {
    const r = read(`HP PETROL PUMP
NAYARA FILLING STATION
Dt: 03.11.26
Product: PETROL
Rate: 102.56
Volume: 9.75 L
Amount: Rs 1000.00
VISA XXXX1234`);
    expect(r).toMatchObject({ amount: "1000.00", date: "2026-11-03", categoryId: "c-fuel", walletKind: "card" });
  });

  it("UPI payment screenshot: amount, who it went to", () => {
    const r = read(`₹450
Paid to
Rameshbhai Dudhwala
ramesh.milk@okaxis
3 Nov 2026, 7:42 am
UPI transaction ID 630712345678
Google Pay`);
    expect(r).toMatchObject({ amount: "450.00", type: "expense", merchant: "Rameshbhai Dudhwala", walletKind: "upi", date: "2026-11-03" });
  });

  it("UPI money received is income", () => {
    const r = read(`Received from Kiran Patel
₹ 2,000
Nov 2, 2026
PhonePe UPI Ref 123456789012`);
    expect(r).toMatchObject({ type: "income", amount: "2000.00", merchant: "Kiran Patel", date: "2026-11-02" });
  });

  it("the person's own category names come first", () => {
    expect(read(`Gokul Dairy\nMilk 2 L\nTotal 120`).categoryId).toBe("c-milk");
  });

  it("Gujarati and Hindi digits and words", () => {
    expect(read(`જલારામ કરિયાણા સ્ટોર\nતારીખ: ૦૨/૧૧/૨૦૨૬\nકુલ રકમ ૩૫૦`)).toMatchObject({ amount: "350.00", date: "2026-11-02", merchant: "જલારામ કરિયાણા સ્ટોર" });
    expect(read(`शर्मा मेडिकल स्टोर\nदिनांक 01/11/2026\nकुल राशि 1,240.50`)).toMatchObject({ amount: "1240.50", date: "2026-11-01" });
  });

  it("ignores phone numbers, GST numbers and future or very old dates", () => {
    const r = read(`Mobile 9876543210\nBill date 05/12/2029\nInvoice 2019-01-01\nTotal 75`);
    expect(r.amount).toBe("75.00");
    expect(r.date).toBeNull();
  });

  it("text with nothing bill-like", () => {
    expect(read(`Happy Diwali to all my friends`)).toMatchObject({ isBill: false, amount: null });
  });

  it("says which UPI app a screenshot is from, by the app's name (not the payee's UPI handle)", () => {
    expect(read(`₹450\nPaid to Rameshbhai\nrameshbhai@okaxis\nPowered by PhonePe\nUPI Ref No. 630712345678`)).toMatchObject({ walletKind: "upi", upiApp: "phonepe" });
    expect(findUpiApp(`Google Pay\nPayment successful\nUPI transaction ID 630712345678`)).toBe("gpay");
    expect(findUpiApp(`Paytm\nPaid Successfully\nUPI Ref No: 630712345678`)).toBe("paytm");
    // a UPI payment that doesn't name the app, and a bill that only mentions an app
    expect(findUpiApp(`Paid to Ramesh\nramesh@ybl\nUPI Ref 630712345678`)).toBeNull();
    expect(read(`DMART\nTotal 250\nPaid by card`).upiApp).toBeNull();
  });
});
