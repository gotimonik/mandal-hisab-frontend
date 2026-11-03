import type { ComponentProps } from "react";
import {
  Apple, Baby, Banknote, Beer, Bike, BookOpen, Briefcase, Building2, Bus, Cake, Car, Carrot, CircleEllipsis, Coffee, Coins, CreditCard, Droplet, Dumbbell, Film, Flame, Flower2, Fuel, Gamepad2, Gift,
  GraduationCap, HandCoins, HeartPulse, Hospital, House, Landmark, Laptop, Milk, Music, Package, PawPrint, Percent, PiggyBank, Pill, Pizza, Plane, Receipt, Scissors, Shield, Shirt, ShoppingBag,
  ShoppingCart, Smartphone, Sofa, Sparkles, Sprout, Store, Ticket, TrainFront, TrendingUp, Truck, Tv, Umbrella, Undo2, Users, Utensils, Wallet, Wifi, Wrench, Zap, type LucideIcon,
} from "lucide-react";
import type { PCategory, WalletKind } from "./types";

/**
 * The icons a category can have, with the words (English, ગુજરાતી, हिन्दी, and how people type them in
 * Latin letters) that suggest each one while the person types a category name.
 */
export const CATEGORY_ICONS: { key: string; Icon: LucideIcon; words: string[] }[] = [
  { key: "utensils", Icon: Utensils, words: ["food", "dining", "lunch", "dinner", "meal", "restaurant", "hotel", "khana", "khavanu", "jaman", "bhojan", "જમવા", "ખાવા", "ભોજન", "હોટલ", "खाना", "भोजन", "होटल"] },
  { key: "coffee", Icon: Coffee, words: ["tea", "chai", "coffee", "nasto", "nashta", "snack", "breakfast", "ચા", "નાસ્તો", "कॉफ़ी", "चाय", "नाश्ता"] },
  { key: "pizza", Icon: Pizza, words: ["pizza", "fast food", "junk", "outside food", "swiggy", "zomato", "order", "પિઝા", "पिज़्ज़ा"] },
  { key: "shopping-cart", Icon: ShoppingCart, words: ["grocer", "kirana", "kariyana", "ration", "supermarket", "mart", "dmart", "કરિયાણ", "રાશન", "किराना", "राशन"] },
  { key: "carrot", Icon: Carrot, words: ["vegetable", "sabji", "shak", "bhaji", "fruit", "શાક", "ફળ", "सब्ज़ी", "सब्जी", "फल"] },
  { key: "milk", Icon: Milk, words: ["milk", "dairy", "doodh", "dudh", "દૂધ", "डेयरी", "दूध"] },
  { key: "apple", Icon: Apple, words: ["fruit", "healthy", "diet"] },
  { key: "fuel", Icon: Fuel, words: ["fuel", "petrol", "diesel", "cng", "gas station", "પેટ્રોલ", "ડીઝલ", "पेट्रोल", "डीज़ल"] },
  { key: "car", Icon: Car, words: ["car", "taxi", "cab", "uber", "ola", "auto", "rickshaw", "parking", "toll", "travel", "ગાડી", "રિક્ષા", "ટેક્સી", "मुसाफ", "गाड़ी", "रिक्शा", "टैक्सी"] },
  { key: "bike", Icon: Bike, words: ["bike", "scooter", "activa", "cycle", "two wheeler", "બાઇક", "સ્કૂટર", "बाइक", "स्कूटर"] },
  { key: "bus", Icon: Bus, words: ["bus", "transport", "commute", "બસ", "मुसाफिरी", "मुसाफरी", "मुसाफ़िर", "बस", "સફર", "મુસાફરી"] },
  { key: "train-front", Icon: TrainFront, words: ["train", "metro", "railway", "ટ્રેન", "ट्रेन", "रेल"] },
  { key: "plane", Icon: Plane, words: ["flight", "plane", "trip", "holiday", "vacation", "tour", "pravas", "પ્રવાસ", "ફરવા", "यात्रा", "सफ़र", "सफर", "घूमना"] },
  { key: "house", Icon: House, words: ["rent", "home", "house", "ghar", "bhadu", "maintenance", "society", "ઘર", "ભાડ", "घर", "किराया"] },
  { key: "sofa", Icon: Sofa, words: ["furniture", "decor", "household", "ફર્નિચર", "फर्नीचर"] },
  { key: "zap", Icon: Zap, words: ["electric", "light bill", "power", "bijli", "lite", "વીજળી", "લાઇટ", "बिजली"] },
  { key: "droplet", Icon: Droplet, words: ["water", "pani", "પાણી", "पानी"] },
  { key: "flame", Icon: Flame, words: ["gas", "cylinder", "lpg", "ગેસ", "गैस", "सिलेंडर"] },
  { key: "smartphone", Icon: Smartphone, words: ["mobile", "recharge", "phone", "sim", "jio", "airtel", "મોબાઇલ", "રિચાર્જ", "ફોન", "मोबाइल", "रिचार्ज", "फ़ोन"] },
  { key: "wifi", Icon: Wifi, words: ["internet", "wifi", "broadband", "data", "ઇન્ટરનેટ", "इंटरनेट"] },
  { key: "tv", Icon: Tv, words: ["tv", "dth", "cable", "netflix", "hotstar", "ott", "subscription", "ટીવી", "टीवी"] },
  { key: "receipt", Icon: Receipt, words: ["bill", "bills", "tax", "fees", "charges", "બિલ", "ટેક્સ", "बिल", "टैक्स"] },
  { key: "shopping-bag", Icon: ShoppingBag, words: ["shopping", "kharidi", "amazon", "flipkart", "meesho", "ખરીદી", "ख़रीदारी", "खरीदारी"] },
  { key: "shirt", Icon: Shirt, words: ["cloth", "dress", "kapda", "saree", "shoes", "fashion", "કપડા", "કપડાં", "કાપડ", "कपड़", "कपडे"] },
  { key: "heart-pulse", Icon: HeartPulse, words: ["health", "medical", "fitness", "tabiyat", "સ્વાસ્થ્ય", "તબિયત", "સારવાર", "सेहत", "इलाज", "स्वास्थ्य"] },
  { key: "pill", Icon: Pill, words: ["medicine", "pharmacy", "chemist", "dava", "tablet", "દવા", "दवा", "दवाई"] },
  { key: "hospital", Icon: Hospital, words: ["hospital", "doctor", "clinic", "dawakhana", "દવાખાન", "હોસ્પિટલ", "ડૉક્ટર", "डॉक्टर", "अस्पताल"] },
  { key: "dumbbell", Icon: Dumbbell, words: ["gym", "yoga", "sport", "exercise", "જીમ", "जिम", "योग"] },
  { key: "scissors", Icon: Scissors, words: ["salon", "haircut", "parlour", "parlor", "beauty", "barber", "વાળ", "પાર્લર", "सैलून", "पार्लर"] },
  { key: "graduation-cap", Icon: GraduationCap, words: ["school", "education", "college", "tuition", "class", "fees", "study", "bhantar", "ભણતર", "શાળા", "સ્કૂલ", "ટ્યુશન", "पढ़ाई", "स्कूल", "ट्यूशन", "कॉलेज"] },
  { key: "book-open", Icon: BookOpen, words: ["book", "stationery", "pustak", "ચોપડ", "પુસ્તક", "किताब", "पुस्तक"] },
  { key: "baby", Icon: Baby, words: ["baby", "kids", "child", "children", "toys", "બાળક", "છોકરા", "बच्चे", "बच्चा"] },
  { key: "users", Icon: Users, words: ["family", "parivar", "parents", "relatives", "પરિવાર", "કુટુંબ", "परिवार"] },
  { key: "gift", Icon: Gift, words: ["gift", "bhet", "present", "shagun", "chandlo", "vyavhar", "ભેટ", "ચાંદલો", "વ્યવહાર", "तोहफ़", "तोहफा", "उपहार", "शगुन"] },
  { key: "cake", Icon: Cake, words: ["birthday", "party", "celebration", "anniversary", "જન્મદિવસ", "પાર્ટી", "जन्मदिन", "पार्टी"] },
  { key: "sparkles", Icon: Sparkles, words: ["festival", "tahevar", "diwali", "navratri", "holi", "utsav", "તહેવાર", "દિવાળી", "નવરાત્રી", "ઉત્સવ", "त्योहार", "दिवाली", "उत्सव"] },
  { key: "flower-2", Icon: Flower2, words: ["temple", "mandir", "puja", "pooja", "religious", "dharmik", "daan", "donation", "મંદિર", "પૂજા", "ધાર્મિક", "દાન", "मंदिर", "पूजा", "धार्मिक", "दान"] },
  { key: "film", Icon: Film, words: ["movie", "cinema", "picture", "entertainment", "મૂવી", "ફિલ્મ", "फ़िल्म", "फिल्म", "मनोरंजन"] },
  { key: "ticket", Icon: Ticket, words: ["ticket", "event", "show", "ટિકિટ", "टिकट"] },
  { key: "music", Icon: Music, words: ["music", "spotify", "garba", "ગરબા", "संगीत"] },
  { key: "gamepad-2", Icon: Gamepad2, words: ["game", "gaming", "playstation", "ગેમ", "गेम"] },
  { key: "beer", Icon: Beer, words: ["drinks", "bar", "pub"] },
  { key: "paw-print", Icon: PawPrint, words: ["pet", "dog", "cat", "animal", "vet", "પાલતુ", "કૂતરો", "पालतू", "कुत्ता"] },
  { key: "wrench", Icon: Wrench, words: ["repair", "service", "mechanic", "plumber", "maintenance", "રિપેર", "मरम्मत", "रिपेयर"] },
  { key: "laptop", Icon: Laptop, words: ["laptop", "computer", "electronics", "gadget", "software", "લેપટોપ", "लैपटॉप"] },
  { key: "package", Icon: Package, words: ["courier", "parcel", "delivery", "કુરિયર", "कूरियर"] },
  { key: "truck", Icon: Truck, words: ["shifting", "moving", "transport goods", "tempo"] },
  { key: "sprout", Icon: Sprout, words: ["farm", "kheti", "agri", "garden", "seeds", "ખેતી", "ખેતર", "खेती"] },
  { key: "umbrella", Icon: Umbrella, words: ["insurance", "lic", "policy", "vimo", "bima", "વીમો", "बीमा"] },
  { key: "shield", Icon: Shield, words: ["security", "guard", "protection"] },
  { key: "landmark", Icon: Landmark, words: ["loan", "bank", "emi", "installment", "lon", "લોન", "બેંક", "હપ્તો", "लोन", "बैंक", "क़िस्त", "किस्त"] },
  { key: "credit-card", Icon: CreditCard, words: ["card", "credit", "kharcho card", "ક્રેડિટ", "कार्ड"] },
  { key: "hand-coins", Icon: HandCoins, words: ["mandal", "hapta", "bhishi", "chit", "kitty", "મંડળ", "હપ્તા", "ભીસી", "मंडल", "हफ़्ता", "हफ्ता", "कमेटी"] },
  { key: "piggy-bank", Icon: PiggyBank, words: ["saving", "bachat", "deposit", "rd", "fd", "બચત", "बचत"] },
  { key: "trending-up", Icon: TrendingUp, words: ["invest", "sip", "mutual fund", "share", "stock", "gold", "રોકાણ", "શેર", "निवेश", "शेयर"] },
  { key: "briefcase", Icon: Briefcase, words: ["salary", "job", "pagar", "office", "work", "naukri", "પગાર", "નોકરી", "तनख़्वाह", "तनख्वाह", "वेतन", "सैलरी", "नौकरी"] },
  { key: "store", Icon: Store, words: ["business", "shop", "dukan", "dhandho", "sales", "vepar", "ધંધો", "દુકાન", "વેપાર", "धंधा", "दुकान", "व्यापार", "बिज़नेस"] },
  { key: "building-2", Icon: Building2, words: ["rent received", "property", "flat", "office rent", "મિલકત", "संपत्ति"] },
  { key: "percent", Icon: Percent, words: ["interest", "vyaj", "byaj", "dividend", "cashback", "વ્યાજ", "ब्याज"] },
  { key: "undo", Icon: Undo2, words: ["refund", "return", "pachha", "પાછા", "રિફંડ", "वापसी", "रिफ़ंड"] },
  { key: "coins", Icon: Coins, words: ["income", "aavak", "earning", "bonus", "commission", "આવક", "कमाई", "आमदनी"] },
  { key: "banknote", Icon: Banknote, words: ["cash", "rokad", "રોકડ", "नकद", "कैश"] },
  { key: "wallet", Icon: Wallet, words: ["wallet", "pocket", "kharchi", "વૉલેટ", "वॉलेट"] },
  { key: "circle-ellipsis", Icon: CircleEllipsis, words: ["other", "misc", "extra", "bijo", "બીજ", "અન્ય", "दूसर", "अन्य"] },
];

const BY_KEY = new Map(CATEGORY_ICONS.map((i) => [i.key, i]));

/** Shown first when nothing in the name matches yet. */
const DEFAULTS = {
  expense: ["utensils", "shopping-cart", "fuel", "receipt", "house", "shopping-bag", "heart-pulse", "graduation-cap", "gift", "sparkles"],
  income: ["briefcase", "store", "percent", "gift", "undo", "coins", "building-2", "trending-up", "piggy-bank", "hand-coins"],
};

/**
 * Icons that fit a category name, best first. Longer matching words count more, so
 * "Petrol pump" → fuel before "pump"-less guesses; always returns `limit` icons.
 */
export function suggestIcons(name: string, kind: "expense" | "income", limit = 6): string[] {
  const text = name.trim().toLowerCase();
  const scored: { key: string; score: number }[] = [];
  if (text.length >= 2) {
    for (const icon of CATEGORY_ICONS) {
      let best = 0;
      for (const w of icon.words) {
        const word = w.toLowerCase();
        // a whole word scores higher than the start of one ("bus" in "business" shouldn't win)
        if (new RegExp(`(^|[^\\p{L}])${escape(word)}($|[^\\p{L}])`, "u").test(text)) best = Math.max(best, word.length + 10);
        else if (text.includes(word) && word.length >= 4) best = Math.max(best, word.length);
        else if (word.startsWith(text) && text.length >= 3) best = Math.max(best, text.length / 2);
      }
      if (best > 0) scored.push({ key: icon.key, score: best });
    }
  }
  const out = scored.sort((a, b) => b.score - a.score).map((s) => s.key);
  for (const k of DEFAULTS[kind]) if (!out.includes(k)) out.push(k);
  return out.slice(0, limit);
}
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The starter categories' icons (same as the API gives new accounts). */
const STARTER_ICON: Record<string, string> = {
  food: "utensils", groceries: "shopping-cart", transport: "fuel", bills: "receipt", home: "house", shopping: "shopping-bag", health: "heart-pulse", education: "graduation-cap", family: "gift", festival: "sparkles",
  savings: "hand-coins", loan: "landmark", other: "circle-ellipsis", salary: "briefcase", business: "store", interest: "percent", gift: "gift", refund: "undo", other_income: "coins",
};

/** The category's own icon, or the best guess from its name (categories made before icons existed). */
export function categoryIconKey(c: Pick<PCategory, "icon" | "name" | "kind" | "key"> | null | undefined): string {
  if (!c) return "circle-ellipsis";
  if (c.icon && BY_KEY.has(c.icon)) return c.icon;
  if (c.key && STARTER_ICON[c.key]) return STARTER_ICON[c.key];
  return suggestIcons(c.name, c.kind, 1)[0] ?? "circle-ellipsis";
}

export function IconByKey({ name, ...props }: { name: string } & ComponentProps<LucideIcon>) {
  const Icon = BY_KEY.get(name)?.Icon ?? CircleEllipsis;
  return <Icon {...props} />;
}

/** A category's icon (its own, or one guessed from its name). */
export function CategoryIcon({ category, ...props }: { category: Pick<PCategory, "icon" | "name" | "kind" | "key"> | null | undefined } & ComponentProps<LucideIcon>) {
  return <IconByKey name={categoryIconKey(category)} {...props} />;
}

const WALLET_ICONS: Record<WalletKind, LucideIcon> = { cash: Banknote, bank: Landmark, upi: Smartphone, card: CreditCard, other: Wallet };
export function WalletIcon({ kind, ...props }: { kind: WalletKind } & ComponentProps<LucideIcon>) {
  const Icon = WALLET_ICONS[kind] ?? Wallet;
  return <Icon {...props} />;
}
export const WALLET_TONE: Record<WalletKind, "emerald" | "indigo" | "sky" | "violet" | "slate"> = { cash: "emerald", bank: "indigo", upi: "sky", card: "violet", other: "slate" };
