import type { CostItem } from "@/data/itinerary";

/**
 * Costs for the trip as a whole rather than any one itinerary item
 * (flights, the yacht charter, etc.). Shown in the "Overall trip costs"
 * section of the Costs page. Per-day costs live on the itinerary items.
 */
// PLACEHOLDER: amounts not known yet.
export const TRIP_COSTS: CostItem[] = [
  { item: "Flights", cost: 0 },
  { item: "Yacht charter", cost: 0 },
];
