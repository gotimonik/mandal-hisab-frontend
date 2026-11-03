/**
 * Phone photos of bills are often 3–8 MB. Before uploading, shrink a photo to at most 2000 px on
 * its long side as a JPEG: still sharp enough to read every line, usually well under 1 MB, and
 * quick on a slow connection. PDFs (and anything the browser can't draw) are sent as they are.
 */
const MAX_SIDE = 2000;

export async function prepareBill(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || typeof createImageBitmap !== "function") return file;
  try {
    const img = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
    // small enough already and a type the API takes: leave it alone
    if (scale === 1 && file.size <= 1.5 * 1024 * 1024 && ["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      img.close();
      return file;
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#fff"; // transparent PNG screenshots → white, not black
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    img.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob) return file;
    const name = (file.name.replace(/\.[^.]+$/, "") || "bill") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    return file; // e.g. a HEIC photo this browser can't open: the API says if it can't take it
  }
}
