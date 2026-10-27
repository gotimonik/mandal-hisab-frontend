/**
 * Everything the public website says about who runs MandalHisab and how to reach you.
 *
 * ⚠️ Values marked PLACEHOLDER must be replaced before going live. In development the
 * site shows a small "placeholder" tag next to each one so they're easy to spot.
 */
export const site = {
  name: "MandalHisab",
  tagline: "Transparent hisab for your Mandal.",
  description:
    "Hapta, savings, upad, interest, withdrawals, cash book and reports for Mandals, trusts and community groups — accurate to the paisa, in English, ગુજરાતી and हिन्दी.",
  url: "https://mandalhisab.com",

  /** Shown in the footer and on Contact us. Set a channel to null to hide it. */
  contact: {
    email: "gotimonik1@gmail.com",
    phone: "+91 81283 13138" as string | null, // shown as a tap-to-call link
    whatsapp: "918128313138" as string | null, // digits only, with country code (wa.me link); null hides it
    city: "Surat, Gujarat, India - 394101",
    hours: "Monday – Saturday, 10 am – 7 pm IST",
    responseTime: "We usually reply within one working day.",
  },

  /** Used on Privacy Policy and Terms of Use. Have both pages reviewed before launch. */
  legal: {
    operator: "Monik Goti, operating as MandalHisab",
    address: "Surat, Gujarat, India - 394101",
    grievanceOfficer: "Monik Goti", // required under India's IT Rules / DPDP Act
    grievanceEmail: "gotimonik1@gmail.com",
    jurisdiction: "Surat, Gujarat, India", // courts for disputes
    lastUpdated: "27 October 2026",
  },

  /** App store links. null = "Coming soon". */
  stores: {
    android: null as string | null,
    ios: null as string | null,
  },

  pricing: {
    headline: "Free during early access",
    detail: "Every feature is free while we're in early access. If paid plans ever come, existing Mandals will be told well in advance — and your data is always yours to export.",
  },

  /** Google Analytics (gtag.js). Loaded only in production builds; set to null to turn it off. */
  analytics: {
    googleTagId: "G-H94RE38JJF" as string | null,
  },

  languages: ["English", "ગુજરાતી", "हिन्दी"],
  copyrightYear: 2026,
} as const;

const PLACEHOLDER = /example\.com|00000|^\[|City, State/;
/** True for values that still need filling in (used to show a dev-only tag). */
export const isPlaceholder = (v: string | null | undefined) => !!v && PLACEHOLDER.test(v);
