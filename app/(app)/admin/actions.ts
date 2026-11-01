"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { easternToIso } from "@/lib/format";
import { addTrip, getCurrentRetreat, removeTrip, startRetreat, updateRetreat } from "@/lib/votes";

export type FormState = { ok: boolean; message: string } | null;

async function requireAdmin() {
  const session = await auth();
  if (!session?.user.isAdmin) throw new Error("Not allowed");
}

function refresh() {
  revalidatePath("/", "layout");
}

const text = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export async function saveRetreatAction(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const title = text(form, "title");
  const deadline = easternToIso(text(form, "deadline"));
  if (!title) return { ok: false, message: "Give the retreat a name." };

  const retreat = await getCurrentRetreat();
  if (retreat) await updateRetreat(retreat.id, { title, deadline });
  else await startRetreat(title, deadline);
  refresh();
  return { ok: true, message: retreat ? "Saved." : "Retreat created. Add some trips." };
}

export async function addTripAction(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const retreat = await getCurrentRetreat();
  if (!retreat) return { ok: false, message: "Create the retreat first." };

  const place = text(form, "place");
  const date = text(form, "date");
  const days = Number(text(form, "days"));
  const price = Number(text(form, "price"));
  if (!place || !date || !(days > 0) || !(price >= 0)) {
    return { ok: false, message: "Fill in place, date, days and price." };
  }
  await addTrip(retreat.id, { place, date, days, price, details: text(form, "details") });
  refresh();
  return { ok: true, message: `${place} added.` };
}

export async function removeTripAction(tripId: string) {
  await requireAdmin();
  const retreat = await getCurrentRetreat();
  if (retreat) await removeTrip(retreat.id, tripId);
  refresh();
}

export async function setVotingAction(status: "open" | "closed") {
  await requireAdmin();
  const retreat = await getCurrentRetreat();
  if (!retreat) return;
  // Reopening also clears a deadline that has already passed.
  const reopenPastDeadline = status === "open" && retreat.deadline && Date.parse(retreat.deadline) <= Date.now();
  await updateRetreat(retreat.id, reopenPastDeadline ? { status, deadline: "" } : { status });
  refresh();
}
