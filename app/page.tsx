import { headers } from "next/headers";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ButtonLink } from "@/components/ui";
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
    ? "Your organizer hasn't opened a vote yet. Check back soon."
    : isVotingOpen(retreat)
      ? `Browse the trips, then vote in Telegram.${retreat.deadline ? ` Voting closes ${deadlineLabel(retreat.deadline)}.` : ""}`
      : "Voting has closed. See where we're going.";

  return (
    <main className="flex flex-1 flex-col py-6">
      <div className="relative flex aspect-[4/3] items-end overflow-hidden rounded-2xl bg-tile p-5">
        <Image src="/photos/hero.jpg" alt="" fill priority sizes="(max-width: 448px) 100vw, 448px" className="object-cover" />
        <p className="relative rounded-full bg-paper/90 px-3 py-1 text-sm font-medium text-ink">Retreat Planner</p>
      </div>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight">{retreat?.title ?? "Team retreat"}</h1>
      <p className="mt-2 text-sm text-muted">{subtitle}</p>

      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
          We couldn&apos;t sign you in with Telegram. Please try again.
        </p>
      )}

      <div className="mt-auto flex flex-col gap-2 pt-10">
        <ButtonLink href="/trips">See the trips</ButtonLink>
        <ButtonLink href="/results" variant="secondary">
          Live results
        </ButtonLink>
        <p className="mt-3 text-center text-xs text-muted">
          One vote per person · You can change it until voting closes
        </p>
        <p className="mt-6 text-center text-xs text-muted">
          Organizer?{" "}
          <a href={loginUrl} className="underline underline-offset-2 hover:text-ink">
            Sign in with Telegram
          </a>
        </p>
      </div>
    </main>
  );
}
