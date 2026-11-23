import { FREQUENCY_LABEL, METHOD_LABEL, label } from "@/lib/format";
import type { Key, T } from "./core";

/** "Cash", "UPI", "Bank transfer" … in the person's language (unknown methods fall back to the English label). */
export const methodLabel = (t: T, m: string | null | undefined) => (m && m in METHOD_LABEL ? t(`pay.method.${m}` as Key) : label(METHOD_LABEL, m));

/** "Monthly", "Every 2 weeks" … in the person's language. */
export const frequencyLabel = (t: T, f: string | null | undefined) => (f && f in FREQUENCY_LABEL ? t(`lbl.freq.${f}` as Key) : label(FREQUENCY_LABEL, f));
