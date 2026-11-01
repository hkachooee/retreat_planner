import { redis } from "./redis";

export type Trip = {
  id: string;
  place: string;
  stay: string;
  date: string;
  pricePerPerson: string;
};

export type Retreat = { id: string; status: "open" | "closed" };

// Keys
//   retreat:current        string, id of the retreat being voted on
//   retreat:{id}           hash { status: open | closed }
//   trips:{retreatId}      set of trip ids
//   trip:{id}              hash { place, stay, date, pricePerPerson }
//   votes:{retreatId}      hash userId -> tripId
//   count:{retreatId}      hash tripId -> number
//   member:{userId}        "yes" once the user confirms company membership

export async function getCurrentRetreat(): Promise<Retreat | null> {
  const r = await redis();
  const id = await r.get("retreat:current");
  if (!id) return null;
  const status = await r.hGet(`retreat:${id}`, "status");
  return { id, status: status === "open" ? "open" : "closed" };
}

export async function getTrips(retreatId: string): Promise<Trip[]> {
  const r = await redis();
  const ids = await r.sMembers(`trips:${retreatId}`);
  const trips = await Promise.all(
    ids.map(async (id) => ({ id, ...(await r.hGetAll(`trip:${id}`)) }) as Trip),
  );
  return trips.filter((t) => t.place).sort((a, b) => a.date.localeCompare(b.date));
}

export async function getTrip(id: string): Promise<Trip | null> {
  const trip = await (await redis()).hGetAll(`trip:${id}`);
  return trip.place ? ({ id, ...trip } as Trip) : null;
}

// Swaps the user's vote and both counts atomically. Returns "same" when the
// user taps the trip they already voted for.
const CAST_VOTE = `
local old = redis.call('HGET', KEYS[1], ARGV[1])
if old == ARGV[2] then return 'same' end
if old then redis.call('HINCRBY', KEYS[2], old, -1) end
redis.call('HSET', KEYS[1], ARGV[1], ARGV[2])
redis.call('HINCRBY', KEYS[2], ARGV[2], 1)
return old and 'changed' or 'new'
`;

export async function castVote(retreatId: string, userId: number, tripId: string) {
  const result = await (await redis()).eval(CAST_VOTE, {
    keys: [`votes:${retreatId}`, `count:${retreatId}`],
    arguments: [String(userId), tripId],
  });
  return result as "new" | "changed" | "same";
}

export async function isTripInRetreat(retreatId: string, tripId: string) {
  return (await (await redis()).sIsMember(`trips:${retreatId}`, tripId)) === 1;
}

export async function isMember(userId: number) {
  return (await (await redis()).get(`member:${userId}`)) === "yes";
}

export async function setMember(userId: number) {
  await (await redis()).set(`member:${userId}`, "yes");
}
