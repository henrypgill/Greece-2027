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

// Times marked "placeholder" (and all end times) are guesses to be firmed up.
export const ITINERARY: ItineraryItem[] = [
  {
    title: "Paros: pick up the boat",
    start: "2027-07-16T15:00:00+03:00",
    end: "2027-07-16T17:00:00+03:00", // placeholder
    description: "Collect the charter boat.",
    location: { lat: 37.0853, lng: 25.1489 },
    costs: [],
  },
  {
    title: "Antiparos: at anchor",
    start: "2027-07-16T20:00:00+03:00",
    end: "2027-07-17T08:00:00+03:00", // placeholder
    description: "Overnight at anchor off Antiparos.",
    location: { lat: 37.0405, lng: 25.084 },
    costs: [],
  },
  {
    title: "Ios: Liems cove swim stop",
    start: "2027-07-17T11:00:00+03:00",
    end: "2027-07-17T14:00:00+03:00", // placeholder
    description: "Swim stop.",
    // TODO: exact location of Liems cove unknown; pin is Ios island centre.
    location: { lat: 36.7167, lng: 25.3364 },
    costs: [],
  },
  {
    title: "Ios: marina",
    start: "2027-07-17T16:00:00+03:00",
    end: "2027-07-18T09:00:00+03:00", // placeholder
    description: "Docked in Ios marina for the night.",
    location: { lat: 36.7225, lng: 25.276 },
    costs: [],
  },
  {
    title: "Santorini: Oia",
    start: "2027-07-18T12:00:00+03:00", // placeholder
    end: "2027-07-19T09:00:00+03:00", // placeholder
    description: "",
    location: { lat: 36.4618, lng: 25.3753 },
    costs: [],
  },
  {
    title: "Santorini: Fira",
    start: "2027-07-19T11:00:00+03:00", // placeholder
    end: "2027-07-20T09:00:00+03:00", // placeholder
    description: "",
    location: { lat: 36.4166, lng: 25.4319 },
    costs: [],
  },
  {
    title: "Naxos",
    start: "2027-07-20T16:00:00+03:00", // placeholder
    end: "2027-07-21T09:00:00+03:00", // placeholder
    description: "",
    location: { lat: 37.1036, lng: 25.3763 },
    costs: [],
  },
  {
    title: "Mykonos",
    start: "2027-07-21T13:00:00+03:00", // placeholder
    end: "2027-07-22T09:00:00+03:00", // placeholder
    description: "",
    location: { lat: 37.4467, lng: 25.3289 },
    costs: [],
  },
  {
    title: "Paros: drop off the boat",
    start: "2027-07-22T13:00:00+03:00", // placeholder
    end: "2027-07-22T15:00:00+03:00", // placeholder
    description: "Return the charter boat.",
    location: { lat: 37.0853, lng: 25.1489 },
    costs: [],
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

export function sumCosts(costs: CostItem[]): number {
  return costs.reduce((sum, c) => sum + c.cost, 0);
}

export function itemTotalCost(item: ItineraryItem): number {
  return sumCosts(item.costs);
}

export type ItineraryDay = {
  /** YYYY-MM-DD in Greek time. */
  date: string;
  /** The items starting on this day, with their itinerary numbers. */
  items: { number: number; item: ItineraryItem }[];
};

const dayKeyFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: TRIP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Groups items by the (Greek) day they start on, in itinerary order. */
export function groupByDay(items: ItineraryItem[] = ITINERARY): ItineraryDay[] {
  const days: ItineraryDay[] = [];
  items.forEach((item, index) => {
    const date = dayKeyFormat.format(new Date(item.start));
    let day = days.find((d) => d.date === date);
    if (!day) {
      day = { date, items: [] };
      days.push(day);
    }
    day.items.push({ number: index + 1, item });
  });
  return days;
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

const dayFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: TRIP_TIME_ZONE,
  weekday: "short",
  day: "numeric",
  month: "short",
});

/** e.g. "Fri 16 Jul", for a YYYY-MM-DD day key. */
export function formatDay(date: string): string {
  // Noon UTC is the same calendar day in Greece.
  return dayFormat.format(new Date(`${date}T12:00:00Z`));
}

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
