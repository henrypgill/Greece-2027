/**
 * The trip itinerary. This is the single source of truth for both the
 * Itinerary page and the Route map: items are shown in array order, and the
 * map draws numbered pins (1, 2, 3…) with arrows between consecutive items.
 *
 * Travel time between two items is not stored. It's derived as the gap
 * between one item's `end` and the next item's `start` (see `getLegs`).
 */

export type GeoLocation = {
  lat: number;
  lng: number;
};

export type CostItem = {
  /** What the money is for, e.g. "Ferry tickets" or "Hotel, 3 nights". */
  item: string;
  /** Amount in euros (see `CURRENCY`). */
  cost: number;
};

export type ItineraryItem = {
  title: string;
  /** ISO 8601 date-time with offset, e.g. "2027-06-05T14:00:00+03:00". */
  start: string;
  /** ISO 8601 date-time with offset. Must not be before `start`. */
  end: string;
  /** Markdown. */
  description: string;
  /** Where the map pin goes. */
  location: GeoLocation;
  /** Optional link to the place on Google Maps. */
  googleMapsUrl?: string;
  costs: CostItem[];
};

export const CURRENCY = "EUR";

/** Dates/times are shown in Greek local time, whatever the viewer's device says. */
export const TRIP_TIME_ZONE = "Europe/Athens";

// PLACEHOLDER DATA: the islands from the original route, with made-up dates,
// times and costs. Replace with the real plan.
export const ITINERARY: ItineraryItem[] = [
  {
    title: "Paros",
    start: "2027-06-05T14:00:00+03:00",
    end: "2027-06-08T10:00:00+03:00",
    description: "Stay in **Parikia**, the main port town.",
    location: { lat: 37.0853, lng: 25.1489 },
    costs: [{ item: "Accommodation, 3 nights", cost: 300 }],
  },
  {
    title: "Sifnos",
    start: "2027-06-08T13:00:00+03:00",
    end: "2027-06-11T10:00:00+03:00",
    description: "Based in **Apollonia**.",
    location: { lat: 36.9736, lng: 24.7194 },
    costs: [
      { item: "Ferry Paros → Sifnos", cost: 40 },
      { item: "Accommodation, 3 nights", cost: 280 },
    ],
  },
  {
    title: "Mykonos",
    start: "2027-06-11T14:30:00+03:00",
    end: "2027-06-14T10:00:00+03:00",
    description: "Mykonos town (Chora).",
    location: { lat: 37.4467, lng: 25.3289 },
    costs: [
      { item: "Ferry Sifnos → Mykonos", cost: 60 },
      { item: "Accommodation, 3 nights", cost: 450 },
    ],
  },
  {
    title: "Santorini",
    start: "2027-06-14T13:00:00+03:00",
    end: "2027-06-17T10:00:00+03:00",
    description: "Stay in **Fira**.",
    location: { lat: 36.4166, lng: 25.4319 },
    costs: [
      { item: "Ferry Mykonos → Santorini", cost: 70 },
      { item: "Accommodation, 3 nights", cost: 500 },
    ],
  },
  {
    title: "Naxos",
    start: "2027-06-17T12:00:00+03:00",
    end: "2027-06-20T10:00:00+03:00",
    description: "Naxos town (Chora).",
    location: { lat: 37.1036, lng: 25.3763 },
    costs: [
      { item: "Ferry Santorini → Naxos", cost: 45 },
      { item: "Accommodation, 3 nights", cost: 280 },
    ],
  },
];

/** The journey between two consecutive itinerary items. */
export type Leg = {
  /** Index into the itinerary of the item the leg starts from. */
  fromIndex: number;
  toIndex: number;
  from: ItineraryItem;
  to: ItineraryItem;
  /** `to.start` minus `from.end`. */
  durationMs: number;
};

export function getLegs(items: ItineraryItem[] = ITINERARY): Leg[] {
  return items.slice(1).map((to, i) => {
    const from = items[i];
    return {
      fromIndex: i,
      toIndex: i + 1,
      from,
      to,
      durationMs: Date.parse(to.start) - Date.parse(from.end),
    };
  });
}

export function itemTotalCost(item: ItineraryItem): number {
  return item.costs.reduce((sum, c) => sum + c.cost, 0);
}

/** e.g. "3h 30m", "1d 2h", "45m". */
export function formatDuration(ms: number): string {
  if (ms < 0) return "overlaps previous item";
  const totalMinutes = Math.round(ms / 60_000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes || parts.length === 0) parts.push(`${minutes}m`);
  return parts.join(" ");
}

const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: TRIP_TIME_ZONE,
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/** e.g. "Sat 5 Jun, 14:00", in Greek time. */
export function formatDateTime(iso: string): string {
  return dateTimeFormat.format(new Date(iso));
}

const currencyFormat = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: CURRENCY,
});

export function formatCost(amount: number): string {
  return currencyFormat.format(amount);
}
