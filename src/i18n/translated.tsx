"use client";

import { useLang } from "./client";
import { gu } from "./dict/gu";
import { hi } from "./dict/hi";
import { en } from "./dict/en";

/** English validation / form messages that aren't dictionary entries. */
const EXTRA_GU: Record<string, string> = {
  "Enter a valid email": "સાચું ઇમેઇલ લખો",
  "At least 8 characters": "ઓછામાં ઓછા 8 અક્ષર",
  "Use letters and numbers": "અક્ષરો અને આંકડા બંને વાપરો",
  "Enter your password": "તમારો પાસવર્ડ લખો",
  "Enter your name": "તમારું નામ લખો",
  "Enter a valid phone number": "સાચો ફોન નંબર લખો",
  "Passwords do not match": "પાસવર્ડ સરખા નથી",
  "Enter an amount": "રકમ લખો",
  "Enter a valid amount (max 2 decimals)": "સાચી રકમ લખો (વધુમાં વધુ 2 દશાંશ)",
  "Amount must be greater than zero": "રકમ શૂન્યથી વધુ હોવી જોઈએ",
  "Request failed": "વિનંતી નિષ્ફળ ગઈ",
  "Invalid email or password": "ઇમેઇલ કે પાસવર્ડ ખોટો છે",
};

/**
 * Validation messages come from Zod schemas in English. Show them in the person's language when
 * we have a translation (matched on the English text).
 */
const EXTRA_HI: Record<string, string> = {
  "Enter a valid email": "सही ईमेल लिखें",
  "At least 8 characters": "कम से कम 8 अक्षर",
  "Use letters and numbers": "अक्षर और अंक दोनों इस्तेमाल करें",
  "Enter your password": "अपना पासवर्ड लिखें",
  "Enter your name": "अपना नाम लिखें",
  "Enter a valid phone number": "सही फ़ोन नंबर लिखें",
  "Passwords do not match": "पासवर्ड मेल नहीं खाते",
  "Enter an amount": "रकम लिखें",
  "Enter a valid amount (max 2 decimals)": "सही रकम लिखें (ज़्यादा से ज़्यादा 2 दशमलव)",
  "Amount must be greater than zero": "रकम शून्य से ज़्यादा होनी चाहिए",
  "Request failed": "अनुरोध विफल रहा",
  "Invalid email or password": "ईमेल या पासवर्ड ग़लत है",
};

function buildMap(target: Record<string, unknown>, extra: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (a: Record<string, unknown>, b: Record<string, unknown>) => {
    for (const k of Object.keys(a)) {
      const av = a[k];
      const bv = b?.[k];
      if (typeof av === "string" && typeof bv === "string") out[av] = bv;
      else if (av && typeof av === "object") walk(av as Record<string, unknown>, (bv ?? {}) as Record<string, unknown>);
    }
  };
  walk(en as unknown as Record<string, unknown>, target);
  return Object.assign(out, extra);
}

const MAPS: Record<string, Record<string, string>> = {
  gu: buildMap(gu as unknown as Record<string, unknown>, EXTRA_GU),
  hi: buildMap(hi as unknown as Record<string, unknown>, EXTRA_HI),
};

export function Translated({ text }: { text: string }) {
  const lang = useLang();
  return <>{MAPS[lang]?.[text] ?? text}</>;
}
