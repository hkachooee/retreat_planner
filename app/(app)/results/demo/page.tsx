import Link from "next/link";
import { Confetti } from "@/components/confetti";
import { LiveResults } from "@/components/live-results";
import { Chip, PageHeader } from "@/components/ui";
import { WinnerCard } from "@/components/winner-card";
import type { Results } from "@/lib/results";

// A made-up closed vote to preview the final results screen.
// Hard-coded so it never touches the real votes in Redis.
const DEMO: NonNullable<Results> = {
  title: "November team retreat",
  open: false,
  deadline: "",
  voters: 20,
  trips: [
    { id: "demo-lisbon", place: "Lisbon, Portugal", votes: 15 },
    { id: "demo-tulum", place: "Tulum, Mexico", votes: 3 },
    { id: "demo-asheville", place: "Asheville, North Carolina", votes: 2 },
  ],
};

export const metadata = { title: "Final results (demo) · Retreat Planner" };

export default function DemoResultsPage() {
  const winner = DEMO.trips[0];
  return (
    <>
      <Confetti />
      <PageHeader title="Final results" aside={<Chip>Demo</Chip>} sub={DEMO.title} />
      <WinnerCard place={winner.place} votes={winner.votes} voters={DEMO.voters} />
      <LiveResults initial={DEMO} poll={false} />
      <p className="mt-8 text-center text-xs text-muted">
        Sample numbers for a preview.{" "}
        <Link href="/results" className="underline underline-offset-2 hover:text-ink">
          See the real results
        </Link>
      </p>
    </>
  );
}
