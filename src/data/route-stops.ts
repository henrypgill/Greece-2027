export type RouteStop = {
  name: string;
  /** [longitude, latitude] */
  coordinates: [number, number];
};

// Approximate positions of each island's main town/port.
export const ROUTE_STOPS: RouteStop[] = [
  { name: "Paros", coordinates: [25.1489, 37.0853] }, // Parikia
  { name: "Sifnos", coordinates: [24.7194, 36.9736] }, // Apollonia
  { name: "Mykonos", coordinates: [25.3289, 37.4467] }, // Mykonos town
  { name: "Santorini", coordinates: [25.4319, 36.4166] }, // Fira
  { name: "Naxos", coordinates: [25.3763, 37.1036] }, // Naxos town
];
