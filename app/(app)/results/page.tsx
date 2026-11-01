import Link from "next/link";
import { auth } from "@/auth";
import { LiveResults } from "@/components/live-results";
import { Card, Chip, Notice, PageHeader } from "@/components/ui";
import { timeLeft } from "@/lib/format";
import { getResults } from "@/lib/results";
import { getCurrentRetreat, getTrip, getVoteFor } from "@/lib/votes";

export default async function ResultsPage() {
  const [session, results, retreat] = await Promise.all([auth(), getResults(), getCurrentRetreat()]);

  if (!results || !retreat) {
    return (
      <>
        <PageHeader title="Live results" />
        <Notice title="No vote yet">Results will show here once the organizer opens a vote.</Notice>
      </>
    );
  }

  const myVoteId = session ? await getVoteFor(retreat.id, Number(session.user.id)) : null;
  const myTrip = myVoteId ? await getTrip(myVoteId) : null;
  const left = results.open ? timeLeft(results.deadline) : "Voting closed";
  const pageUrl = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "retreatplanner.vercel.app"}/results`;
  const shareUrl = `https://t.me/share/url?${new URLSearchParams({
    url: pageUrl,
    text: `Live results: ${results.title}`,
  })}`;

  return (
    <>
      <PageHeader title="Live results" aside={left && <Chip active={results.open}>{left}</Chip>} sub={results.title} />

      {myTrip ? (
        <Card highlight className="mb-6 p-4">
          <p className="text-xs font-medium text-accent">Your vote</p>
          <p className="mt-1 font-semibold">{myTrip.place}</p>
          {results.open && (
            <Link href="/trips" className="mt-1 inline-block text-xs text-muted underline underline-offset-2">
              Change vote
            </Link>
          )}
        </Card>
      ) : session && results.open ? (
        <Card className="mb-6 p-4 text-sm">
          You haven&apos;t voted yet.{" "}
          <Link href="/trips" className="font-semibold text-accent underline underline-offset-2">
            Pick a trip
          </Link>
        </Card>
      ) : null}

      <LiveResults initial={results} />

      <div className="mt-8 flex flex-col gap-2">
        <a href={shareUrl} target="_blank" rel="noreferrer" className="flex h-12 w-full items-center justify-center rounded-xl border border-ink bg-white text-sm font-semibold hover:bg-paper">
          Share to Telegram
        </a>
        {!session && (
          <Link href="/" className="py-2 text-center text-sm text-muted underline underline-offset-2">
            Sign in to vote
          </Link>
        )}
      </div>
    </>
  );
}
