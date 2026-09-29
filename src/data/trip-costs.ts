import type { CostItem } from "@/data/itinerary";

// Overall trip costs: types and helpers. The costs themselves are in the
// trip_costs table (see src/lib/trip-costs-db.ts). No server-only imports,
// so client components can use this file.

/**
 * An overall trip cost, with its database id. `perPerson`: the amount is
 * what each person pays (e.g. flights); otherwise it's the amount for the
 * whole group, split between everyone (e.g. the charter).
 */
export type TripCost = CostItem & { id: number; perPerson: boolean };

/**
 * What each person pays: per-person costs as they are, plus an equal share of
 * everything shared (shared overall costs and all itinerary costs).
 */
export function costPerPerson(
  tripCosts: TripCost[],
  itineraryTotal: number,
  peopleCount: number,
): number {
  let perPerson = 0;
  let shared = itineraryTotal;
  for (const c of tripCosts) {
    if (c.perPerson) perPerson += c.cost;
    else shared += c.cost;
  }
  return perPerson + shared / peopleCount;
}

/** The overall costs for the whole group: per-person ones times people. */
export function tripCostsForGroup(
  tripCosts: TripCost[],
  peopleCount: number,
): number {
  return tripCosts.reduce(
    (sum, c) => sum + (c.perPerson ? c.cost * peopleCount : c.cost),
    0,
  );
}

/**
 * What the trip_costs table was first filled with (see trip-costs-db.ts).
 * Seeded once per database; editing this now has no effect. Edit overall
 * costs as an admin on the Costs page instead.
 */
export const TRIP_COSTS_SEED: (CostItem & { perPerson: boolean })[] = [
  { item: "Flights", cost: 0, perPerson: true },
  { item: "Yacht charter", cost: 0, perPerson: false },
];
