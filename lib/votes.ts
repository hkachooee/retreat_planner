import { randomUUID } from "node:crypto";
import { redis } from "./redis";

export type Trip = {
  id: string;
  place: string;
  date: string; // YYYY-MM-DD
  days: number;
  price: number; // EUR per person
  details: string;
};

export type Retreat = {
  id: string;
  title: string;
  deadline: string; // ISO timestamp, "" when none
  status: "open" | "closed";
};

// Keys
//   retreat:current        string, id of the retreat being voted on
//   retreat:{id}           hash { title, deadline, status }
//   trips:{retreatId}      set of trip ids
//   trip:{id}              hash { place, date, days, price, details }
//   votes:{retreatId}      hash userId -> tripId
//   count:{retreatId}      hash tripId -> number
//   member:{userId}        "yes" once the user confirms company membership
//   user:{userId}:name     display name, shown to admins only

const newId = () => randomUUID().slice(0, 8);

export async function getCurrentRetreat(): Promise<Retreat | null> {
  const r = await redis();
  const id = await r.get("retreat:current");
  if (!id) return null;
  const h = await r.hGetAll(`retreat:${id}`);
  return {
    id,
    title: h.title || "Team retreat",
    deadline: h.deadline ?? "",
    status: h.status === "open" ? "open" : "closed",
  };
}

export function isVotingOpen(retreat: Retreat | null): retreat is Retreat {
  if (!retreat || retreat.status !== "open") return false;
  return !retreat.deadline || Date.now() < Date.parse(retreat.deadline);
}

export async function startRetreat(title: string, deadline: string) {
  const r = await redis();
  const id = newId();
  await r.hSet(`retreat:${id}`, { title, deadline, status: "open" });
  await r.set("retreat:current", id);
  return id;
}

export async function updateRetreat(id: string, fields: Partial<Omit<Retreat, "id">>) {
  await (await redis()).hSet(`retreat:${id}`, fields);
}

function toTrip(id: string, h: Record<string, string>): Trip | null {
  if (!h.place) return null;
  return {
    id,
    place: h.place,
    date: h.date ?? "",
    days: Number(h.days) || 0,
    price: Number(h.price) || 0,
    details: h.details ?? "",
  };
}

export async function getTrips(retreatId: string): Promise<Trip[]> {
  const r = await redis();
  const ids = await r.sMembers(`trips:${retreatId}`);
  const trips = await Promise.all(ids.map(async (id) => toTrip(id, await r.hGetAll(`trip:${id}`))));
  return trips.filter((t): t is Trip => t !== null).sort((a, b) => a.date.localeCompare(b.date));
}

export async function getTrip(id: string): Promise<Trip | null> {
  return toTrip(id, await (await redis()).hGetAll(`trip:${id}`));
}

export async function addTrip(retreatId: string, trip: Omit<Trip, "id">) {
  const r = await redis();
  const id = newId();
  await r.hSet(`trip:${id}`, {
    place: trip.place,
    date: trip.date,
    days: String(trip.days),
    price: String(trip.price),
    details: trip.details,
  });
  await r.sAdd(`trips:${retreatId}`, id);
  return id;
}

// Only trips nobody has voted for can be removed, so no vote is ever lost.
export async function removeTrip(retreatId: string, tripId: string) {
  const r = await redis();
  if (Number(await r.hGet(`count:${retreatId}`, tripId)) > 0) return false;
  await r.sRem(`trips:${retreatId}`, tripId);
  await r.hDel(`count:${retreatId}`, tripId);
  await r.del(`trip:${tripId}`);
  return true;
}

// Swaps the user's vote and both counts atomically. Returns "same" when the
// user picks the trip they already voted for.
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

export async function getVoteFor(retreatId: string, userId: number) {
  return (await (await redis()).hGet(`votes:${retreatId}`, String(userId))) ?? null;
}

export async function getCounts(retreatId: string) {
  const counts = await (await redis()).hGetAll(`count:${retreatId}`);
  return Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, Number(v)]));
}

export async function getVoterCount(retreatId: string) {
  return (await redis()).hLen(`votes:${retreatId}`);
}

// Admin only: userId -> tripId for every vote.
export async function getAllVotes(retreatId: string) {
  return (await redis()).hGetAll(`votes:${retreatId}`);
}

// Display names so admins can see who voted. Saved on web sign-in and Telegram votes.
export async function saveUserName(userId: number, name: string) {
  await (await redis()).set(`user:${userId}:name`, name);
}

export async function getUserNames(userIds: string[]) {
  if (userIds.length === 0) return {};
  const names = await (await redis()).mGet(userIds.map((id) => `user:${id}:name`));
  return Object.fromEntries(userIds.map((id, i) => [id, names[i] ?? `User ${id}`]));
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
