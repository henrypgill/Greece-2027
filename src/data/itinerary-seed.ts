import type { ItineraryItem } from "@/data/itinerary";

/**
 * The itinerary the database was first filled with. It's inserted exactly once
 * (tracked in the `seeds` table, see `src/lib/itinerary-db.ts`), after which
 * the database is the source of truth: editing this file changes nothing.
 */
// Times marked "placeholder" (and all end times) were guesses to be firmed up.
export const ITINERARY_SEED: Omit<
  ItineraryItem,
  "id" | "images" | "stopType" | "adminNotes"
>[] = [
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
