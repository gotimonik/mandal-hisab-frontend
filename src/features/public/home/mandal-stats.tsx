import { CalendarCheck2, HandCoins, IndianRupee, MapPin, PiggyBank, Users } from "lucide-react";
import { site } from "@/config/site";
import { Container } from "@/features/public/blocks";
import { getPublicStats } from "./public-stats";

/** 1234567 → "12,34,567" */
const indian = (n: number) => n.toLocaleString("en-IN");

/** Rounded down so the figure is never more than the real one: 1,23,45,600 paise → "₹1.2 lakh". */
function rupeesWords(paise: number) {
  const r = Math.floor(paise / 100);
  const down = (v: number) => (Math.floor(v * 10) / 10).toString();
  if (r >= 1e7) return `₹${down(r / 1e7)} crore`;
  if (r >= 1e5) return `₹${down(r / 1e5)} lakh`;
  return `₹${indian(r)}`;
}

/** Live totals band under the hero. Renders nothing until there are enough Mandals to show. */
export async function MandalStats() {
  const s = await getPublicStats();
  if (!s || s.mandals < site.publicStats.minMandals) return null;

  const items = [
    { icon: <PiggyBank />, value: indian(s.mandals), label: s.mandals === 1 ? "Mandal running" : "Mandals running", show: true },
    { icon: <Users />, value: indian(s.members), label: "members' savings kept", show: s.members > 0 },
    { icon: <CalendarCheck2 />, value: indian(s.haptaEntries), label: "hapta payments recorded", show: s.haptaEntries > 0 },
    { icon: <IndianRupee />, value: rupeesWords(s.haptaCollectedPaise), label: "hapta in the hisab", show: s.haptaCollectedPaise >= 100_000_00 },
    { icon: <HandCoins />, value: indian(s.upadsGiven), label: "upads tracked with interest", show: s.upadsGiven > 0 },
    { icon: <MapPin />, value: indian(s.cities), label: "cities and villages", show: s.cities >= 2 },
  ].filter((i) => i.show);

  return (
    <section aria-label="MandalHisab in numbers" className="relative z-10 -mt-6 sm:-mt-10">
      <Container>
        <div className="rounded-3xl bg-card p-4 shadow-card ring-1 ring-foreground/[0.06] sm:rounded-[2rem] sm:p-7">
          <p className="mb-3 text-center text-xs font-bold tracking-wider text-primary uppercase sm:mb-5">Mandals already keeping their hisab on MandalHisab</p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 lg:flex lg:justify-around">
            {items.map((i) => (
              <div key={i.label} className="flex min-w-0 items-center gap-3 lg:flex-col lg:gap-1.5 lg:text-center">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-10 [&_svg]:size-4.5 sm:[&_svg]:size-5">{i.icon}</span>
                <div className="min-w-0 lg:flex lg:flex-col lg:items-center">
                  <dd className="text-lg leading-tight font-extrabold tracking-tight tabular-nums sm:text-2xl">{i.value}</dd>
                  <dt className="text-xs text-muted-foreground sm:text-sm">{i.label}</dt>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </section>
  );
}
