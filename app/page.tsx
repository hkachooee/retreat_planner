import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { deadlineLabel } from "@/lib/format";
import { telegramLoginUrl } from "@/lib/telegram-login";
import { getCurrentRetreat, isVotingOpen } from "@/lib/votes";

export default async function SignInPage({ searchParams }: PageProps<"/">) {
  if (await auth()) redirect("/trips");

  const { error } = await searchParams;
  const retreat = await getCurrentRetreat();
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${host}`;
  const loginUrl = telegramLoginUrl(origin, `${origin}/auth/telegram`);

  const subtitle = !retreat
    ? "Your organizer hasn't opened a vote yet. Sign in to be ready."
    : isVotingOpen(retreat)
      ? `Vote for where we go.${retreat.deadline ? ` Voting closes ${deadlineLabel(retreat.deadline)}.` : ""}`
      : "Voting has closed. Sign in to see where we're going.";

  return (
    <main className="flex flex-1 flex-col py-6">
      <div className="relative flex aspect-[4/3] items-end overflow-hidden rounded-2xl bg-tile p-5">
        <div aria-hidden className="absolute -top-10 -right-10 size-48 rounded-full bg-accent/15" />
        <div aria-hidden className="absolute top-16 right-20 size-20 rounded-full bg-accent/25" />
        <p className="relative text-sm font-medium text-ink/60">Retreat Planner</p>
      </div>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight">{retreat?.title ?? "Team retreat"}</h1>
      <p className="mt-2 text-sm text-muted">{subtitle}</p>

      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
          We couldn&apos;t sign you in with Telegram. Please try again.
        </p>
      )}

      <div className="mt-auto pt-10">
        <a
          href={loginUrl}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-ink text-sm font-semibold text-paper hover:bg-ink/90"
        >
          Continue with Telegram
        </a>
        <p className="mt-3 text-center text-xs text-muted">
          One vote per person · You can change it until voting closes
        </p>
        <p className="mt-6 text-center text-xs">
          <Link href="/results" className="text-muted underline underline-offset-2">
            See live results
          </Link>
        </p>
      </div>
    </main>
  );
}
