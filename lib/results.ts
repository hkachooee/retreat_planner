import { getCounts, getCurrentRetreat, getTrips, getVoterCount, isVotingOpen } from "./votes";

export type Results = {
  title: string;
  open: boolean;
  deadline: string;
  voters: number;
  trips: { id: string; place: string; votes: number }[];
} | null;

// Public results: counts only, never who voted for what.
export async function getResults(): Promise<Results> {
  const retreat = await getCurrentRetreat();
  if (!retreat) return null;
  const [trips, counts, voters] = await Promise.all([
    getTrips(retreat.id),
    getCounts(retreat.id),
    getVoterCount(retreat.id),
  ]);
  return {
    title: retreat.title,
    open: isVotingOpen(retreat),
    deadline: retreat.deadline,
    voters,
    trips: trips
      .map((t) => ({ id: t.id, place: t.place, votes: counts[t.id] ?? 0 }))
      .sort((a, b) => b.votes - a.votes || a.place.localeCompare(b.place)),
  };
}
