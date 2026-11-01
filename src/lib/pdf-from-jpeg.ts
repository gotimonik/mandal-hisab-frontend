/**
 * A one-page PDF holding one JPEG — enough to share a receipt as a PDF without a PDF library.
 * The page is A4 wide (595 pt) and as tall as the picture needs.
 */
export function pdfFromJpeg(jpeg: Uint8Array, widthPx: number, heightPx: number, title = "Receipt"): Uint8Array {
  const W = 595.28;
  const H = Math.round((W * heightPx) / widthPx * 100) / 100;
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];
  const offsets: number[] = [];
  let size = 0;
  const push = (b: Uint8Array | string) => {
    const u = typeof b === "string" ? enc.encode(b) : b;
    parts.push(u);
    size += u.length;
  };
  const obj = (n: number, body: string) => {
    offsets[n] = size;
    push(`${n} 0 obj\n${body}\nendobj\n`);
  };
  // PDF strings: escape \ ( ) and keep to plain characters
  const pdfText = (s: string) => s.replace(/[^\x20-\x7e]/g, "").replace(/([\\()])/g, "\\$1");

  push("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  obj(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  obj(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
  offsets[4] = size;
  push(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${widthPx} /Height ${heightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
  push(jpeg);
  push("\nendstream\nendobj\n");
  const draw = `q ${W} 0 0 ${H} 0 0 cm /Im0 Do Q`;
  obj(5, `<< /Length ${draw.length} >>\nstream\n${draw}\nendstream`);
  obj(6, `<< /Title (${pdfText(title)}) /Producer (MandalHisab) >>`);
  const xref = size;
  push(`xref\n0 7\n0000000000 65535 f \n${offsets.slice(1).map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`);
  push(`trailer\n<< /Size 7 /Root 1 0 R /Info 6 0 R >>\nstartxref\n${xref}\n%%EOF\n`);

  const out = new Uint8Array(size);
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}
