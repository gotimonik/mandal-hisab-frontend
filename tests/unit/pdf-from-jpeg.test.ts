import { describe, expect, it } from "vitest";
import { pageCuts, pdfFromJpeg, pdfFromJpegPages } from "@/lib/pdf-from-jpeg";

describe("receipt PDF", () => {
  it("is a valid one-page PDF holding the picture", () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 0xff, 0xd9]);
    const pdf = pdfFromJpeg(jpeg, 1200, 1600, "Receipt RCPT/2026-27/0001");
    const text = new TextDecoder("latin1").decode(pdf);
    expect(text.startsWith("%PDF-1.4")).toBe(true);
    expect(text.trimEnd().endsWith("%%EOF")).toBe(true);
    // A4 wide, height in proportion
    expect(text).toContain("/MediaBox [0 0 595.28 793.71]");
    expect(text).toContain(`/Width 1200 /Height 1600 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length}`);
    expect(text).toContain("/Title (Receipt RCPT/2026-27/0001)");
    // every xref entry points at its object, and startxref at the table
    const xrefAt = Number(/startxref\n(\d+)/.exec(text)![1]);
    expect(text.slice(xrefAt, xrefAt + 4)).toBe("xref");
    const offsets = [...text.slice(xrefAt).matchAll(/(\d{10}) 00000 n /g)].map((m) => Number(m[1]));
    expect(offsets).toHaveLength(6);
    offsets.forEach((o, i) => expect(text.slice(o, o + `${i + 1} 0 obj`.length)).toBe(`${i + 1} 0 obj`));
    // the picture's bytes are inside, untouched
    const at = text.indexOf("stream\n", text.indexOf("4 0 obj")) + "stream\n".length;
    expect([...pdf.slice(at, at + jpeg.length)]).toEqual([...jpeg]);
  });
});


describe("multi-page PDF (passbook)", () => {
  it("has one A4 page per picture, every object where the table says", () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 9, 0xff, 0xd9]);
    const pdf = pdfFromJpegPages(
      [
        { jpeg, widthPx: 1200, heightPx: 1697 },
        { jpeg, widthPx: 1200, heightPx: 600 },
      ],
      "Passbook",
    );
    const text = new TextDecoder("latin1").decode(pdf);
    expect(text).toContain("/Count 2");
    expect(text.match(/\/MediaBox \[0 0 595\.28 841\.89\]/g)).toHaveLength(2);
    // the short last page is drawn at the top
    expect(text).toContain("q 595.28 0 0 297.64 0 544.25 cm /Im0 Do Q");
    const xrefAt = Number(/startxref\n(\d+)/.exec(text)![1]);
    const offsets = [...text.slice(xrefAt).matchAll(/(\d{10}) 00000 n /g)].map((m) => Number(m[1]));
    expect(offsets).toHaveLength(9);
    offsets.forEach((o, i) => expect(text.slice(o, o + `${i + 1} 0 obj`.length)).toBe(`${i + 1} 0 obj`));
  });

  it("cuts pages between rows, never through one", () => {
    // rows end every 100 px; a page is 1000 px; a 2550 px picture
    const rows = Array.from({ length: 25 }, (_, i) => 100 + i * 100 + 50);
    expect(pageCuts(2550, 1000, rows)).toEqual([950, 1950]);
    expect(pageCuts(800, 1000, rows)).toEqual([]);
    // no rows at all: plain page heights
    expect(pageCuts(2500, 1000, [])).toEqual([1000, 2000]);
  });
});
