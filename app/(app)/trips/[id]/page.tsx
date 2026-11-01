import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { MembershipPrompt } from "@/components/membership-prompt";
import { ButtonLink, Chip, PlaceTile } from "@/components/ui";
import { VoteButton } from "@/components/vote-button";
import { days, euro, tripDate } from "@/lib/format";
import { getCurrentRetreat, getTrip, getVoteFor, isMember, isTripInRetreat, isVotingOpen } from "@/lib/votes";

export default async function TripDetailPage({ params }: PageProps<"/trips/[id]">) {
  const session = await auth();
  if (!session) redirect("/");
  const userId = Number(session.user.id);
  const { id } = await params;

  const retreat = await getCurrentRetreat();
  if (!retreat || !(await isTripInRetreat(retreat.id, id))) notFound();
  const [trip, myVote, member] = await Promise.all([
    getTrip(id),
    getVoteFor(retreat.id, userId),
    isMember(userId),
  ]);
  if (!trip) notFound();

  const company = process.env.COMPANY_NAME ?? "the company";
  const disabledReason = !isVotingOpen(retreat)
    ? "Voting has closed."
    : !member
      ? `Confirm you're part of ${company} above to vote.`
      : undefined;

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

      {!member && isVotingOpen(retreat) && (
        <div className="mt-6">
          <MembershipPrompt company={company} />
        </div>
      )}

      <div className="mt-auto flex flex-col gap-2 pt-8">
        <VoteButton tripId={trip.id} isMyVote={myVote === trip.id} disabledReason={disabledReason} />
        <ButtonLink href="/trips" variant="secondary">
          Compare trips
        </ButtonLink>
      </div>
    </>
  );
}
