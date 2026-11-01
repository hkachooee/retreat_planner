import { Card, PlaceTile } from "./ui";

// Shown on the results page once voting has closed.
export function WinnerCard({ place, votes, voters }: { place: string; votes: number; voters: number }) {
  const pct = voters ? Math.round((votes / voters) * 100) : 0;
  return (
    <Card highlight className="mb-6 p-3">
      <PlaceTile place={place} className="h-40" />
      <p className="mt-3 text-xs font-semibold tracking-wide text-accent uppercase">Final result</p>
      <h2 className="mt-1 text-xl font-semibold tracking-tight">We&apos;re going to {place}!</h2>
      <p className="mt-1 text-sm text-muted">
        {votes} of {voters} votes · {pct}%
      </p>
    </Card>
  );
}
