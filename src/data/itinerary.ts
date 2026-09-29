/**
 * Itinerary types and helpers. The itinerary itself lives in the database
 * (see `src/lib/itinerary-db.ts`) and is loaded with `getItinerary()`. Items
 * are shown in order, and the map draws numbered pins (1, 2, 3…) with arrows
 * between consecutive items.
 *
 * Travel time between items is not stored. It's derived as the gap
 * between one item's `end` and the next item's `start` (see `getLegs`).
 *
 * This file has no server-only imports, so client components can use it.
 */

export type GeoLocation = {
  lat: number;
  lng: number;
};

export type CostItem = {
  /** What the money is for, e.g. "Ferry tickets" or "Hotel, 3 nights". */
  item: string;
  /** Amount in pounds (see `CURRENCY`). */
  cost: number;
};

export type ItineraryItem = {
  /** Database id. */
  id: number;
  title: string;
  /** ISO 8601 date-time, e.g. "2027-07-16T15:00:00+03:00" or "…T12:00:00.000Z". */
  start: string;
  /** ISO 8601 date-time. Must not be before `start`. */
  end: string;
  /** Markdown. */
  description: string;
  /** Where the map pin goes. */
  location: GeoLocation;
  /** Optional link to the place on Google Maps. */
  googleMapsUrl?: string;
  costs: CostItem[];
};

export const CURRENCY = "GBP";
/** Shown in front of amount inputs; keep in step with CURRENCY. */
export const CURRENCY_SYMBOL = "£";

/** Dates/times are shown in Greek local time, whatever the viewer's device says. */
export const TRIP_TIME_ZONE = "Europe/Athens";

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

export function getLegs(items: ItineraryItem[]): Leg[] {
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

/** The Greek-time calendar day of an ISO date-time, as "YYYY-MM-DD". */
export function greekDayKey(iso: string): string {
  return dayKeyFormat.format(new Date(iso));
}

/** Groups items by the (Greek) day they start on, in itinerary order. */
export function groupByDay(items: ItineraryItem[]): ItineraryDay[] {
  const days: ItineraryDay[] = [];
  items.forEach((item, index) => {
    const date = greekDayKey(item.start);
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

/** A stop as the edit form needs it: times as Greek local "YYYY-MM-DDTHH:mm". */
export type StopFormValues = {
  title: string;
  start: string;
  end: string;
  description: string;
  lat: string;
  lng: string;
  googleMapsUrl: string;
  costs: { item: string; cost: string }[];
};

export const EMPTY_STOP: StopFormValues = {
  title: "",
  start: "",
  end: "",
  description: "",
  lat: "",
  lng: "",
  googleMapsUrl: "",
  costs: [],
};

const localInputFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: TRIP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** An ISO date-time as a Greek-time `datetime-local` value, "YYYY-MM-DDTHH:mm". */
export function toGreekLocalInput(iso: string): string {
  const parts = Object.fromEntries(
    localInputFormat
      .formatToParts(new Date(iso))
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function toStopFormValues(item: ItineraryItem): StopFormValues {
  return {
    title: item.title,
    start: toGreekLocalInput(item.start),
    end: toGreekLocalInput(item.end),
    description: item.description,
    lat: String(item.location.lat),
    lng: String(item.location.lng),
    googleMapsUrl: item.googleMapsUrl ?? "",
    costs: item.costs.map((c) => ({ item: c.item, cost: String(c.cost) })),
  };
}
