import type { CostItem } from "@/data/itinerary";

/**
 * What the trip_costs table was first filled with (see trip-costs-db.ts).
 * Seeded once per database; editing this now has no effect. Edit overall
 * costs as an admin on the Costs page instead.
 */
export const TRIP_COSTS_SEED: CostItem[] = [
  { item: "Flights", cost: 0 },
  { item: "Yacht charter", cost: 0 },
];
