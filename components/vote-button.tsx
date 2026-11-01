"use client";

import { useActionState } from "react";
import { voteAction, type VoteState } from "@/app/actions";
import { Button, buttonStyles } from "./ui";

export function VoteButton({
  tripId,
  isMyVote,
  disabledReason,
}: {
  tripId: string;
  isMyVote: boolean;
  disabledReason?: string;
}) {
  const [state, formAction, pending] = useActionState<VoteState>(() => voteAction(tripId), null);

  if (disabledReason) {
    return (
      <div className="flex flex-col gap-2">
        <Button disabled aria-describedby="vote-reason">
          {isMyVote ? "✓ Your vote" : "Vote for this trip"}
        </Button>
        <p id="vote-reason" className="min-h-5 text-center text-sm text-muted">
          {disabledReason}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      {isMyVote ? (
        <p className={buttonStyles.accent} role="status">
          ✓ Your vote
        </p>
      ) : (
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Vote for this trip"}
        </Button>
      )}
      <p aria-live="polite" className={`min-h-5 text-center text-sm ${state?.ok === false ? "text-danger" : "text-accent"}`}>
        {state?.message}
      </p>
    </form>
  );
}
