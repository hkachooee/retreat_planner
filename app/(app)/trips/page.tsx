import Link from "next/link";
import { signOutAction } from "@/app/actions";
import { auth } from "@/auth";
import { Card, Chip, Notice, PageHeader, PlaceTile } from "@/components/ui";
import { days, euro, timeLeft, tripDate } from "@/lib/format";
import { getCurrentRetreat, getTrips, getVoteFor, isVotingOpen } from "@/lib/votes";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "budget", label: "Under €500" },
  { key: "short", label: "Short trip" },
] as const;

export default async function TripsPage({ searchParams }: PageProps<"/trips">) {
  const session = await auth();

  const { filter = "all" } = await searchParams;
  const retreat = await getCurrentRetreat();

  if (!retreat) {
    return (
      <>
        <PageHeader title="Pick a getaway" />
        <Notice title="No retreat yet">Your organizer hasn&apos;t opened a vote. Check back soon.</Notice>
      </>
    );
  }

  const [allTrips, myVote] = await Promise.all([
    getTrips(retreat.id),
    session ? getVoteFor(retreat.id, Number(session.user.id)) : null,
  ]);
  const trips = allTrips.filter((t) =>
    filter === "budget" ? t.price < 500 : filter === "short" ? t.days <= 3 : true,
  );
  const open = isVotingOpen(retreat);
  const left = open ? timeLeft(retreat.deadline) : "Voting closed";

  return (
    <>
      <PageHeader
        title="Pick a getaway"
        aside={left && <Chip active={open}>{left}</Chip>}
        sub={retreat.title}
      />

      <nav aria-label="Filter trips" className="mb-4 flex gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/trips" : `/trips?filter=${f.key}`}
            aria-current={filter === f.key ? "page" : undefined}
            className={`h-8 rounded-full border px-3 text-xs leading-8 ${
              filter === f.key ? "border-ink bg-ink text-paper" : "border-line bg-white text-muted"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {allTrips.length === 0 ? (
        <Notice title="No trips yet">The organizer is still adding options.</Notice>
      ) : trips.length === 0 ? (
        <Notice title="Nothing matches this filter" action={<Link href="/trips" className="text-sm font-semibold text-accent">Show all trips</Link>} />
      ) : (
        <ul className="flex flex-col gap-3">
          {trips.map((trip) => (
            <li key={trip.id}>
              <Link href={`/trips/${trip.id}`} className="block">
                <Card
                  highlight={myVote === trip.id}
                  className={`p-3 transition ${myVote === trip.id ? "ring-1 ring-accent" : "hover:border-ink/40"}`}
                >
                  <PlaceTile place={trip.place} className="h-28" />
                  <div className="mt-3 flex items-start justify-between gap-2">
                    <h2 className="font-semibold">{trip.place}</h2>
                    {myVote === trip.id && <Chip active>Your vote</Chip>}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Chip>{euro(trip.price)} pp</Chip>
                    <Chip>{tripDate(trip.date)}</Chip>
                    <Chip>{days(trip.days)}</Chip>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {session && (
        <form action={signOutAction} className="mt-8 text-center text-xs text-muted">
          Signed in as {session.user.name} ·{" "}
          <button type="submit" className="underline underline-offset-2 hover:text-ink">
            Sign out
          </button>
        </form>
      )}
    </>
  );
}
