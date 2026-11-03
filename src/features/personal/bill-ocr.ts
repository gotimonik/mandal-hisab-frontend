"use client";

/**
 * Reads the text off a bill photo right here on the phone (or computer) with Tesseract — free and
 * open source, nothing is sent to any AI service. The first time, the reader and its language
 * files (a few MB) are downloaded from the jsDelivr CDN; after that the browser keeps them.
 *
 * English is always read; Gujarati or Hindi are added when the app is in that language.
 */

export type OcrStage = "loading" | "reading";

const LANGS: Record<string, string[]> = { en: ["eng"], gu: ["eng", "guj"], hi: ["eng", "hin"] };
const READABLE = ["image/jpeg", "image/png", "image/webp"];
const TIME_LIMIT_MS = 90_000;

export const canReadOnDevice = (file: File) => READABLE.includes(file.type) && typeof Worker !== "undefined" && typeof WebAssembly !== "undefined";

export async function readBillOnDevice(file: File, lang: string, onStage?: (stage: OcrStage, progress: number) => void): Promise<string | null> {
  if (!canReadOnDevice(file)) return null;
  const { createWorker, OEM } = await import("tesseract.js");
  onStage?.("loading", 0);
  const work = (async () => {
    const worker = await createWorker(LANGS[lang] ?? LANGS.en, OEM.LSTM_ONLY, {
      logger: (m: { status: string; progress: number }) => onStage?.(m.status === "recognizing text" ? "reading" : "loading", m.progress ?? 0),
    });
    try {
      await worker.setParameters({ preserve_interword_spaces: "1" });
      const { data } = await worker.recognize(file);
      return data.text ?? "";
    } finally {
      // always stop it, even when the time limit already gave up on it
      void worker.terminate().catch(() => {});
    }
  })();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), TIME_LIMIT_MS);
  });
  try {
    return await Promise.race([work, timeout]);
  } catch (e) {
    console.warn("[bill-ocr]", e);
    return null;
  } finally {
    clearTimeout(timer);
    work.catch(() => {}); // a late failure after the time limit isn't an error for anyone
  }
}
