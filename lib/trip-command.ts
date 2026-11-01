import type { Trip } from "./votes";

export const TRIP_USAGE = `Add a trip with one field per line:

/trip
name: Lisbon
date: 2026-12-05
days: 4
price: 650
includes: Flights, hotel, one group dinner

"includes" is optional. You can also put it on one line: /trip name: Lisbon | date: 2026-12-05 | days: 4 | price: 650`;

const KEYS: Record<string, keyof Omit<Trip, "id">> = {
  name: "place",
  place: "place",
  destination: "place",
  date: "date",
  days: "days",
  duration: "days",
  price: "price",
  cost: "price",
  includes: "details",
  details: "details",
};

// Parses "name: Lisbon | date: 2026-12-05 | days: 4 | price: 650" (or the same
// fields on separate lines). Returns the trip, or an error message to send back.
export function parseTripCommand(args: string): { trip: Omit<Trip, "id"> } | { error: string } {
  const fields: Partial<Record<keyof Omit<Trip, "id">, string>> = {};
  for (const part of args.split(/\n|\|/)) {
    const match = part.match(/^\s*([a-z]+)\s*[:=]\s*(.+?)\s*$/i);
    const key = match && KEYS[match[1].toLowerCase()];
    if (key) fields[key] = match[2];
  }

  const place = fields.place ?? "";
  const date = toIsoDate(fields.date ?? "");
  const days = parseInt(fields.days ?? "", 10);
  const price = Number((fields.price ?? "").replace(/[€,\s]|eur/gi, ""));

  const missing = [
    !place && "name",
    !date && "date (YYYY-MM-DD)",
    !(days > 0) && "days",
    !(fields.price && price >= 0) && "price",
  ].filter(Boolean);
  if (missing.length) return { error: `Missing or invalid: ${missing.join(", ")}.\n\n${TRIP_USAGE}` };

  return { trip: { place, date, days, price, details: fields.details ?? "" } };
}

// Accepts "2026-12-05" or anything Date can read ("Dec 5 2026") and returns YYYY-MM-DD.
function toIsoDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value))) return value;
  const d = new Date(`${value} 12:00 UTC`);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}
