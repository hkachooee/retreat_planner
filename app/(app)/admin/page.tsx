import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { AddTripForm, RetreatForm } from "@/components/admin-forms";
import { Button, Card, Chip, PageHeader } from "@/components/ui";
import { days, euro, isoToEastern, timeLeft, tripDate } from "@/lib/format";
import { tg } from "@/lib/telegram";
import {
  getAllVotes,
  getCounts,
  getCurrentRetreat,
  getTrips,
  getUserNames,
  isVotingOpen,
  type Trip,
} from "@/lib/votes";
import { removeTripAction, setVotingAction } from "./actions";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {children}
    </Card>
  );
}

export default async function AdminPage() {
  const session = await auth();
  if (!session) redirect("/");
  if (!session.user.isAdmin) notFound();

  const retreat = await getCurrentRetreat();
  const webhook = await tg<{ url: string }>("getWebhookInfo", {});
  const [trips, counts, votes]: [Trip[], Record<string, number>, Record<string, string>] = retreat
    ? await Promise.all([getTrips(retreat.id), getCounts(retreat.id), getAllVotes(retreat.id)])
    : [[], {}, {}];
  const names = await getUserNames(Object.keys(votes));
  const placeById = Object.fromEntries(trips.map((t) => [t.id, t.place]));
  const open = isVotingOpen(retreat);

  return (
    <>
      <PageHeader
        title="Manage retreat"
        sub="Visible to organizers only"
        aside={retreat && <Chip active={open}>{open ? timeLeft(retreat.deadline) || "Open" : "Closed"}</Chip>}
      />

      <div className="flex flex-col gap-3">
        <Section title={retreat ? "Retreat & voting deadline" : "Start a retreat"}>
          <RetreatForm
            title={retreat?.title ?? ""}
            deadline={isoToEastern(retreat?.deadline ?? "")}
            isNew={!retreat}
          />
        </Section>

        {retreat && (
          <Section title="Trip options">
            {trips.length === 0 ? (
              <p className="mb-4 text-sm text-muted">No trips yet. Add the first one below.</p>
            ) : (
              <ul className="mb-4 divide-y divide-line">
                {trips.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{t.place}</p>
                      <p className="text-xs text-muted">
                        {tripDate(t.date)} · {days(t.days)} · {euro(t.price)} pp · {counts[t.id] ?? 0} votes
                      </p>
                    </div>
                    {(counts[t.id] ?? 0) === 0 ? (
                      <form action={removeTripAction.bind(null, t.id)}>
                        <button className="text-xs font-medium text-danger underline underline-offset-2">Remove</button>
                      </form>
                    ) : (
                      <span className="text-xs text-muted" title="Trips with votes can't be removed">
                        Has votes
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <AddTripForm />
          </Section>
        )}

        {retreat && (
          <Section title={`Who voted (${Object.keys(votes).length})`}>
            {Object.keys(votes).length === 0 ? (
              <p className="text-sm text-muted">No votes yet.</p>
            ) : (
              <ul className="flex flex-col gap-1.5 text-sm">
                {Object.entries(votes).map(([userId, tripId]) => (
                  <li key={userId} className="flex justify-between gap-3">
                    <span className="truncate">{names[userId]}</span>
                    <span className="shrink-0 text-muted">{placeById[tripId] ?? "Removed trip"}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        )}

        <Section title="Telegram">
          <p className="text-sm text-muted">
            {webhook?.url
              ? `@${process.env.TELEGRAM_BOT_USERNAME} is connected. Send /vote in the team group to post the poll.`
              : `@${process.env.TELEGRAM_BOT_USERNAME} isn't receiving messages yet. Run npm run telegram:webhook after deploying.`}
          </p>
        </Section>

        <Section title="Friday summary">
          <p className="text-sm text-muted">Posts the current leader on the results page every Friday at 5:00 pm ET. Coming next.</p>
        </Section>
      </div>

      {retreat && (
        <form action={setVotingAction.bind(null, open ? "closed" : "open")} className="mt-6">
          <Button type="submit" variant={open ? "primary" : "secondary"}>
            {open ? "Close voting now" : "Reopen voting"}
          </Button>
        </form>
      )}
    </>
  );
}
