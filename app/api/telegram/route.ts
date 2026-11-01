import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/auth";
import { days, deadlineLabel, euro, tripDate } from "@/lib/format";
import { parseTripCommand, TRIP_USAGE } from "@/lib/trip-command";
import { answerCallback, botStartLink, sendMessage, siteUrl, tg } from "@/lib/telegram";
import {
  addTrip,
  castVote,
  getCurrentRetreat,
  getTrip,
  getTrips,
  isMember,
  isTripInRetreat,
  isVotingOpen,
  saveUserName,
  setMember,
} from "@/lib/votes";

type User = { id: number; first_name: string; last_name?: string };
type Chat = { id: number; type: "private" | "group" | "supergroup" | "channel" };
type Message = { message_id: number; chat: Chat; from?: User; text?: string };
type CallbackQuery = { id: string; from: User; message?: Message; data?: string };
type Update = { message?: Message; callback_query?: CallbackQuery };

const RESULTS_NOTE = "Final results will be up on Friday at 5 pm EST.";
const resultsButton = () => [[{ text: "Live results ↗", url: `${siteUrl()}/results` }]];

const company = () => process.env.COMPANY_NAME ?? "the company";

function hasValidSecret(request: Request) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";
  const got = request.headers.get("x-telegram-bot-api-secret-token") ?? "";
  return (
    expected.length > 0 &&
    got.length === expected.length &&
    timingSafeEqual(Buffer.from(got), Buffer.from(expected))
  );
}

export async function POST(request: Request) {
  if (!hasValidSecret(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const update = (await request.json()) as Update;
  try {
    if (update.message) await onMessage(update.message);
    if (update.callback_query) await onCallback(update.callback_query);
  } catch (err) {
    // Still return 200 so Telegram doesn't retry the same update forever.
    console.error("telegram update failed", err);
  }
  return Response.json({ ok: true });
}

async function onMessage(msg: Message) {
  // "/vote@bot_name args" -> "/vote"
  const command = msg.text?.split(/[\s@]/)[0];
  if (!msg.from) return;

  if (command === "/start" && msg.chat.type === "private") {
    // "/start v_ab12cd34" comes from a trip's "Vote in Telegram" button on the web.
    const payload = msg.text?.split(" ")[1] ?? "";
    const tripId = payload.startsWith("v_") ? payload.slice(2) : "";

    if (await isMember(msg.from.id)) {
      if (!tripId) {
        await sendMessage(msg.chat.id, "You're confirmed. Tap a trip in your team group to vote.");
        return;
      }
      await sendMessage(msg.chat.id, await recordVote(msg.from, tripId), resultsButton());
      return;
    }
    // Carry the trip through the membership question so the vote lands after "Yes".
    const suffix = tripId ? `:${tripId}` : "";
    await sendMessage(msg.chat.id, `Are you part of ${company()}?`, [
      [
        { text: "Yes", callback_data: `m:yes${suffix}` },
        { text: "No", callback_data: "m:no" },
      ],
    ]);
    return;
  }

  if (command === "/trip") {
    await onTripCommand(msg, msg.from);
    return;
  }

  if (command === "/vote") {
    if (msg.chat.type === "private") {
      await sendMessage(msg.chat.id, "Send /vote in your team group.");
      return;
    }
    if (!(await isMember(msg.from.id))) {
      await sendMessage(msg.chat.id, `Only ${company()} members can start a vote.`, [
        [{ text: "Confirm I'm a member", url: botStartLink("join") }],
      ]);
      return;
    }
    await postVote(msg.chat.id);
  }
}

// "/trip name: Lisbon | date: 2026-12-05 | days: 4 | price: 650". Organizers only.
async function onTripCommand(msg: Message, from: User) {
  if (!isAdmin(from.id)) {
    await sendMessage(msg.chat.id, "Only organizers can add trips.");
    return;
  }
  const args = (msg.text ?? "").replace(/^\/trip(@\w+)?/, "").trim();
  if (!args) {
    await sendMessage(msg.chat.id, TRIP_USAGE);
    return;
  }
  const retreat = await getCurrentRetreat();
  if (!retreat) {
    await sendMessage(msg.chat.id, "Create the retreat in Organizer on the web first.");
    return;
  }
  const parsed = parseTripCommand(args);
  if ("error" in parsed) {
    await sendMessage(msg.chat.id, parsed.error);
    return;
  }
  const { trip } = parsed;
  await addTrip(retreat.id, trip);
  revalidatePath("/", "layout");
  await sendMessage(
    msg.chat.id,
    `Added ${trip.place}: ${tripDate(trip.date)} · ${days(trip.days)} · ${euro(trip.price)} per person.\nIt's now an option on the web and in /vote.`,
    [[{ text: "See all trips ↗", url: `${siteUrl()}/trips` }]],
  );
}

async function postVote(chatId: number) {
  const retreat = await getCurrentRetreat();
  if (!isVotingOpen(retreat)) {
    await sendMessage(chatId, "No vote is open right now.");
    return;
  }
  const trips = await getTrips(retreat.id);
  if (trips.length === 0) {
    await sendMessage(chatId, "No trips have been added yet.");
    return;
  }
  const closes = retreat.deadline ? `\nCloses ${deadlineLabel(retreat.deadline)}` : "";
  const buttons = trips.map((t) => ({ text: t.place, callback_data: `v:${retreat.id}:${t.id}` }));
  const rows = [];
  for (let i = 0; i < buttons.length; i += 3) rows.push(buttons.slice(i, i + 3));

  await sendMessage(
    chatId,
    `${retreat.title}: where should we go?${closes}\nTap a trip to vote. You can change it anytime. Votes are anonymous.`,
    [...rows, [{ text: "Open full details ↗", url: `${siteUrl()}/trips` }]],
  );
}

async function onCallback(cb: CallbackQuery) {
  const [kind, a, b] = (cb.data ?? "").split(":");

  if (kind === "m") {
    if (a === "yes") await setMember(cb.from.id);
    const answer =
      a !== "yes"
        ? `Only ${company()} members can vote.`
        : b
          ? await recordVote(cb.from, b)
          : "Thanks, you can vote now. Head back to your team group.";
    await answerCallback(cb.id, "");
    if (cb.message) {
      await tg("editMessageText", {
        chat_id: cb.message.chat.id,
        message_id: cb.message.message_id,
        text: answer,
        ...(a === "yes" && b && { reply_markup: { inline_keyboard: resultsButton() } }),
      });
    }
    return;
  }

  if (kind === "v") {
    await onVote(cb, a, b);
    return;
  }

  await answerCallback(cb.id, "");
}

async function onVote(cb: CallbackQuery, retreatId: string, tripId: string) {
  if (!(await isMember(cb.from.id))) {
    // Opens a private chat with the bot, which asks the membership question.
    await answerCallback(cb.id, "", { url: botStartLink(`v_${tripId}`) });
    return;
  }

  const retreat = await getCurrentRetreat();
  if (retreat?.id !== retreatId) {
    await answerCallback(cb.id, "This vote is closed.", { alert: true });
    return;
  }
  // An alert (not a toast) so the voter sees when results are coming.
  await answerCallback(cb.id, await recordVote(cb.from, tripId), { alert: true });
}

// Checks the round is open and the trip belongs to it, then casts the vote.
// Returns the reply to show the voter. Callers check membership first.
async function recordVote(from: User, tripId: string) {
  const retreat = await getCurrentRetreat();
  if (!isVotingOpen(retreat)) return "This vote is closed.";
  if (!(await isTripInRetreat(retreat.id, tripId))) return "That trip is no longer available.";

  const result = await castVote(retreat.id, from.id, tripId);
  await saveUserName(from.id, from.first_name);
  const place = (await getTrip(tripId))?.place ?? "that trip";
  const saved =
    result === "same"
      ? `You already voted for ${place}.`
      : result === "changed"
        ? `Vote changed to ${place}.`
        : `Vote saved: ${place}.`;
  return `${saved}\n\n${RESULTS_NOTE}`;
}
