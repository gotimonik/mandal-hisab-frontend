/**
 * Everything the public website says about who runs MandalHisab and how to reach you.
 *
 * ⚠️ Values marked PLACEHOLDER must be replaced before going live. In development the
 * site shows a small "placeholder" tag next to each one so they're easy to spot.
 */
export interface Testimonial {
  quote: string;
  /** e.g. "Rameshbhai P." */
  name: string;
  /** e.g. "Treasurer" or "Member" */
  role?: string;
  /** e.g. "Shree Umiya Mandal" — leave out if they'd rather not name the Mandal */
  mandal?: string;
  city?: string;
  translatedFrom?: "Gujarati" | "Hindi";
}

export const site = {
  name: "MandalHisab",
  tagline: "Transparent hisab for your Mandal.",
  description:
    "Hapta, savings, upad, interest, cash book and reports for Mandals and community groups — plus Personal Hisab, private books for your home and office income, spending and budgets. In English, ગુજરાતી and हिन्दी.",
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
    lastUpdated: "6 November 2026",
  },

  /** App store links. null = "Coming soon". */
  stores: {
    android: null as string | null,
    ios: "https://apps.apple.com/app/mandalhisab-bachat-khata/id6827958501" as
      | string
      | null,
  },

  pricing: {
    headline: "Free during early access",
    detail:
      "Every feature is free while we're in early access. If paid plans ever come, existing Mandals will be told well in advance — and your data is always yours to export.",
  },

  /** Google Analytics (gtag.js). Loaded only in production builds; set to null to turn it off. */
  analytics: {
    googleTagId: "G-H94RE38JJF" as string | null,
  },

  /**
   * Google AdSense. Set to your publisher ID ("ca-pub-1234567890123456") once AdSense gives you one:
   * the Auto ads script then loads on the public website pages (never on sign-in pages, inside a
   * Mandal, or in the iOS / Android apps) and /ads.txt is served. null = no ads.
   */
  ads: {
    adsenseClientId: "ca-pub-6031242056409187" as string | null,
  },

  /**
   * "How to use MandalHisab" demo video (Gujarati voice and captions), on Vercel Blob → assets/.
   * Shown on the home page, to signed-in people with no Mandal yet, and in a new Mandal's setup checklist.
   * Set to null to hide it everywhere.
   */
  demoVideo: {
    src: "https://bhglodtr4klrikxc.public.blob.vercel-storage.com/assets/mandalhisab-demo-gu.mp4",
    poster:
      "https://bhglodtr4klrikxc.public.blob.vercel-storage.com/assets/mandalhisab-demo-gu-poster.jpg",
    minutes: 3,
  } as { src: string; poster: string | null; minutes: number } | null,

  /**
   * Live totals on the home page (from the API's /public/stats, refreshed about every 10 minutes).
   * The band stays hidden until at least `minMandals` Mandals are active, so it never shows tiny numbers.
   */
  publicStats: { minMandals: 3 },

  /**
   * What real Mandal admins and members have told you — shown on the home page under "What Mandals say".
   * Only add feedback a real person gave and agreed to have shown (by name, or first name + city).
   * Write the quote in English (the website is English-only); set translatedFrom when they said it in Gujarati.
   * Empty list = the section is hidden.
   */
  testimonials: [
    {
      quote:
        "The app is in Gujarati, so keeping our Mandal's hisab is very easy for us. We're very happy with MandalHisab.",
      name: "Chetan Dave",
    },
    {
      quote:
        "Managing our Mandal's monthly hapta, interest, and withdrawals is now so simple. Everything is organized in one place, and we no longer have to worry about maintaining manual records.",
      name: "Kunal Patel",
    },
    {
      quote:
        "Very useful and easy-to-use platform for our Mandal. It makes tracking contributions and keeping accounts transparent for everyone. Really appreciate this initiative!",
      name: "Jignesh Shah",
    },
    {
      quote:
        "Finally, a simple way to manage Mandal accounts digitally! The monthly records are easy to maintain, and everyone can stay updated. Great work!",
      name: "Hardik Desai",
    },
    {
      quote:
        "A very helpful platform for managing our family Mandal. The interface is simple, the records are clear, and keeping track of everyone's contributions has become much easier.",
      name: "Nirav Goti",
    },
    {
      quote:
        "MandalHisab has made managing our Mandal's finances much easier. We can quickly check monthly contributions, balances, and transactions without any confusion. Very convenient!",
      name: "Pratik Goti",
    },
    {
      quote:
        "Simple, user-friendly, and very useful for our Mandal. Keeping track of monthly hapta and all financial records is now hassle-free. A great tool for everyone!",
      name: "Rakesh Patel",
    },
  ] as Testimonial[],

  /**
   * People using MandalHisab who agreed to be named on the website (no quote — just their name).
   * Shown under "What Mandals say". When one of them sends real feedback, move them into testimonials.
   */
  namedUsers: [
    "Sagar Patel",
    "Jayesh Desai",
    "Vijay Makwana",
    "Ajay Vegad",
    "Hardik Goswami Patel",
    "Miral Goyani",
  ] as string[],

  languages: ["English", "ગુજરાતી", "हिन्दी"],
  copyrightYear: 2026,
} as const;

/** The App Store id ("6827958501"), for the iPhone Safari banner. */
export const iosAppId = site.stores.ios?.match(/\/id(\d+)/)?.[1] ?? null;

/** One line about the phone apps that stays right as each store link is added. */
export function appsLine() {
  const { android, ios } = site.stores;
  if (android && ios)
    return "Get the app for Android and iPhone, or use it in any browser.";
  if (ios)
    return "The iPhone app is on the App Store. The Android app is on the way. Until then it works fully in Chrome.";
  if (android)
    return "The Android app is on Google Play. The iPhone app is on the way. Until then it works fully in Safari.";
  return "The Android and iPhone apps are on the way. Until then MandalHisab works fully in any phone browser.";
}

const PLACEHOLDER = /example\.com|00000|^\[|City, State/;
/** True for values that still need filling in (used to show a dev-only tag). */
export const isPlaceholder = (v: string | null | undefined) =>
  !!v && PLACEHOLDER.test(v);
