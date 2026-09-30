import type { CostItem } from "@/data/itinerary";

// Overall trip costs (flights, charter…): the type and the starting data.
// The costs themselves are in the trip_costs table (see
// src/lib/trip-costs-db.ts); the per person / shared maths is in
// src/data/itinerary.ts (costPerPerson, costForGroup), shared with the
// itinerary stops' costs.

/** An overall trip cost, with its database id. */
export type TripCost = CostItem & { id: number };

/**
 * What the trip_costs table was first filled with (see trip-costs-db.ts).
 * Seeded once per database; editing this now has no effect. Edit overall
 * costs as an admin on the Costs page instead.
 */
export const TRIP_COSTS_SEED: CostItem[] = [
  { item: "Flights", cost: 0, perPerson: true },
  { item: "Yacht charter", cost: 0, perPerson: false },
];
