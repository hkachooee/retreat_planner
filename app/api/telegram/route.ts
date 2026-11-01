import { timingSafeEqual } from "node:crypto";
import { answerCallback, botStartLink, sendMessage, siteUrl, tg } from "@/lib/telegram";
import {
  castVote,
  getCurrentRetreat,
  getTrip,
  getTrips,
  isMember,
  isTripInRetreat,
  setMember,
} from "@/lib/votes";

type User = { id: number; first_name: string };
type Chat = { id: number; type: "private" | "group" | "supergroup" | "channel" };
type Message = { message_id: number; chat: Chat; from?: User; text?: string };
type CallbackQuery = { id: string; from: User; message?: Message; data?: string };
type Update = { message?: Message; callback_query?: CallbackQuery };

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
    if (await isMember(msg.from.id)) {
      await sendMessage(msg.chat.id, "You're confirmed. Tap a trip in your team group to vote.");
      return;
    }
    await sendMessage(msg.chat.id, `Are you part of ${company()}?`, [
      [
        { text: "Yes", callback_data: "m:yes" },
        { text: "No", callback_data: "m:no" },
      ],
    ]);
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

async function postVote(chatId: number) {
  const retreat = await getCurrentRetreat();
  if (!retreat || retreat.status !== "open") {
    await sendMessage(chatId, "No vote is open right now.");
    return;
  }
  const trips = await getTrips(retreat.id);
  if (trips.length === 0) {
    await sendMessage(chatId, "No trips have been added yet.");
    return;
  }
  await sendMessage(
    chatId,
    "Where should we go? Tap a trip to vote.\nOne vote per person, and you can change it. Votes are anonymous.",
    [
      ...trips.map((t) => [
        {
          text: `${t.place} · ${t.date} · ${t.stay} · $${t.pricePerPerson}`,
          callback_data: `v:${retreat.id}:${t.id}`,
        },
      ]),
      [{ text: "See results", url: `${siteUrl()}/results` }],
    ],
  );
}

async function onCallback(cb: CallbackQuery) {
  const [kind, a, b] = (cb.data ?? "").split(":");

  if (kind === "m") {
    const answer = a === "yes" ? "Thanks, you can vote now. Head back to your team group." : `Only ${company()} members can vote.`;
    if (a === "yes") await setMember(cb.from.id);
    await answerCallback(cb.id, "");
    if (cb.message) {
      await tg("editMessageText", {
        chat_id: cb.message.chat.id,
        message_id: cb.message.message_id,
        text: answer,
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
    await answerCallback(cb.id, "", { url: botStartLink("join") });
    return;
  }

  const retreat = await getCurrentRetreat();
  if (!retreat || retreat.id !== retreatId || retreat.status !== "open") {
    await answerCallback(cb.id, "This vote is closed.", { alert: true });
    return;
  }
  if (!(await isTripInRetreat(retreatId, tripId))) {
    await answerCallback(cb.id, "That trip is no longer available.", { alert: true });
    return;
  }

  const result = await castVote(retreatId, cb.from.id, tripId);
  const place = (await getTrip(tripId))?.place ?? "that trip";
  const text =
    result === "same"
      ? `You already voted for ${place}.`
      : result === "changed"
        ? `Vote changed to ${place}.`
        : `Vote saved: ${place}.`;
  await answerCallback(cb.id, text);
}
