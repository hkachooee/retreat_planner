export type InlineButton = { text: string; callback_data?: string; url?: string };

// Calls a Telegram Bot API method. Logs and returns null on failure so one bad
// call never breaks the webhook response.
export async function tg<T = unknown>(method: string, body: object): Promise<T | null> {
  const res = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  const data = (await res.json()) as { ok: boolean; result?: T; description?: string };
  if (!data.ok) {
    console.error(`telegram ${method} failed:`, data.description);
    return null;
  }
  return data.result ?? null;
}

export function sendMessage(chatId: number, text: string, buttons?: InlineButton[][]) {
  return tg("sendMessage", {
    chat_id: chatId,
    text,
    ...(buttons && { reply_markup: { inline_keyboard: buttons } }),
  });
}

export function answerCallback(id: string, text: string, opts: { alert?: boolean; url?: string } = {}) {
  return tg("answerCallbackQuery", {
    callback_query_id: id,
    text,
    show_alert: opts.alert ?? false,
    ...(opts.url && { url: opts.url }),
  });
}

export function siteUrl() {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "localhost:3000";
  return `${host.startsWith("localhost") ? "http" : "https"}://${host}`;
}

// Deep link that opens a private chat with the bot, e.g. to confirm membership.
export function botStartLink(payload: string) {
  return `https://t.me/${process.env.TELEGRAM_BOT_USERNAME}?start=${payload}`;
}
