"use server";

import { revalidatePath } from "next/cache";
import { auth, signOut } from "@/auth";
import {
  castVote,
  getCurrentRetreat,
  getTrip,
  isMember,
  isTripInRetreat,
  isVotingOpen,
  setMember,
} from "@/lib/votes";

export type VoteState = { ok: boolean; message: string } | null;

export async function voteAction(tripId: string): Promise<VoteState> {
  const session = await auth();
  if (!session) return { ok: false, message: "Sign in with Telegram to vote." };
  const userId = Number(session.user.id);

  if (!(await isMember(userId))) {
    return { ok: false, message: `Confirm you're part of ${process.env.COMPANY_NAME ?? "the company"} first.` };
  }
  const retreat = await getCurrentRetreat();
  if (!isVotingOpen(retreat)) return { ok: false, message: "Voting is closed." };
  if (!(await isTripInRetreat(retreat.id, tripId))) {
    return { ok: false, message: "That trip is no longer available." };
  }

  const result = await castVote(retreat.id, userId, tripId);
  const place = (await getTrip(tripId))?.place ?? "this trip";
  revalidatePath("/trips", "layout");
  revalidatePath("/results");
  return {
    ok: true,
    message: result === "same" ? `You already voted for ${place}.` : `Your vote: ${place}`,
  };
}

export async function confirmMemberAction() {
  const session = await auth();
  if (!session) return;
  await setMember(Number(session.user.id));
  revalidatePath("/trips", "layout");
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
