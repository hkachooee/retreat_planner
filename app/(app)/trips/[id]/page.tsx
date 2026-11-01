import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { ButtonLink, Chip, PlaceTile, buttonStyles } from "@/components/ui";
import { days, euro, tripDate } from "@/lib/format";
import { voteLink } from "@/lib/telegram";
import { getCurrentRetreat, getTrip, getVoteFor, isTripInRetreat, isVotingOpen } from "@/lib/votes";

export default async function TripDetailPage({ params }: PageProps<"/trips/[id]">) {
  const session = await auth();
  const { id } = await params;

  const retreat = await getCurrentRetreat();
  if (!retreat || !(await isTripInRetreat(retreat.id, id))) notFound();
  const [trip, myVote] = await Promise.all([
    getTrip(id),
    session ? getVoteFor(retreat.id, Number(session.user.id)) : null,
  ]);
  if (!trip) notFound();
  const open = isVotingOpen(retreat);

  return (
    <>
      <div className="pt-5 pb-3">
        <Link href="/trips" className="text-sm text-muted hover:text-ink">
          ← Back
        </Link>
      </div>

      <PlaceTile place={trip.place} className="h-48 text-7xl" />

      <h1 className="mt-5 text-2xl font-semibold tracking-tight">{trip.place}</h1>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Chip>{euro(trip.price)} pp</Chip>
        <Chip>{tripDate(trip.date)}</Chip>
        <Chip>{days(trip.days)}</Chip>
      </div>

      <section className="mt-6">
        <h2 className="text-sm font-semibold">Includes</h2>
        <p className="mt-2 text-sm whitespace-pre-line text-muted">
          {trip.details || "The organizer hasn't added details for this trip yet."}
        </p>
      </section>

      <div className="mt-auto flex flex-col gap-2 pt-8">
        {open ? (
          <>
            {/* Votes are cast by the bot, so the button opens Telegram. */}
            <a href={voteLink(trip.id)} className={buttonStyles.accent}>
              {myVote === trip.id ? "✓ Your vote · change in Telegram" : "Vote in Telegram"}
            </a>
            <p className="text-center text-sm text-muted">Opens a chat with our bot. One vote per person.</p>
          </>
        ) : (
          <p className="text-center text-sm text-muted">Voting has closed.</p>
        )}
        <ButtonLink href="/trips" variant="secondary">
          Compare trips
        </ButtonLink>
      </div>
    </>
  );
}
