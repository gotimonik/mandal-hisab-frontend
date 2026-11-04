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

/** One page of a multi-page PDF: a JPEG drawn across the page's width, from the top. */
export interface PdfPage {
  jpeg: Uint8Array;
  widthPx: number;
  heightPx: number;
}

/**
 * A PDF with A4 pages (595 × 842 pt), one JPEG per page, each drawn full width from the top of
 * the page (a short last page leaves white space below). For long documents such as a passbook.
 */
export function pdfFromJpegPages(pages: PdfPage[], title = "Document"): Uint8Array {
  const W = 595.28;
  const H = 841.89;
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
  const pdfText = (s: string) => s.replace(/[^\x20-\x7e]/g, "").replace(/([\\()])/g, "\\$1");

  // objects: 1 catalog, 2 pages, then per page: page, image, contents; last: info
  const pageObj = (i: number) => 3 + i * 3;
  const n = pages.length;
  const info = 3 + n * 3;
  push("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  obj(2, `<< /Type /Pages /Kids [${pages.map((_, i) => `${pageObj(i)} 0 R`).join(" ")}] /Count ${n} >>`);
  pages.forEach((p, i) => {
    const po = pageObj(i);
    obj(po, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /XObject << /Im0 ${po + 1} 0 R >> >> /Contents ${po + 2} 0 R >>`);
    offsets[po + 1] = size;
    push(`${po + 1} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${p.widthPx} /Height ${p.heightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpeg.length} >>\nstream\n`);
    push(p.jpeg);
    push("\nendstream\nendobj\n");
    const h = Math.min(H, Math.round(((W * p.heightPx) / p.widthPx) * 100) / 100);
    const draw = `q ${W} 0 0 ${h} 0 ${Math.round((H - h) * 100) / 100} cm /Im0 Do Q`;
    obj(po + 2, `<< /Length ${draw.length} >>\nstream\n${draw}\nendstream`);
  });
  obj(info, `<< /Title (${pdfText(title)}) /Producer (MandalHisab) >>`);
  const xref = size;
  push(`xref\n0 ${info + 1}\n0000000000 65535 f \n${offsets.slice(1).map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`);
  push(`trailer\n<< /Size ${info + 1} /Root 1 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF\n`);

  const out = new Uint8Array(size);
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

/**
 * Where to cut a tall picture into A4 pages: as close to a full page as possible, but only
 * between rows (`rowBottoms`, in the picture's pixels) so no line is cut in half.
 */
export function pageCuts(totalHeight: number, pageHeight: number, rowBottoms: number[]): number[] {
  const cuts: number[] = [];
  let start = 0;
  const bottoms = [...rowBottoms].sort((a, b) => a - b);
  while (totalHeight - start > pageHeight) {
    const limit = start + pageHeight;
    // the lowest row end that still fits (but not a tiny page)
    const fit = bottoms.filter((b) => b > start + pageHeight * 0.3 && b <= limit).pop();
    const cut = Math.round(fit ?? limit);
    cuts.push(cut);
    start = cut;
  }
  return cuts;
}
