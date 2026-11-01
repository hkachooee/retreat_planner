import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export type TelegramLogin = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
};

const MAX_AGE_SECONDS = 24 * 60 * 60;
const FIELDS = ["id", "first_name", "last_name", "username", "photo_url", "auth_date"] as const;

// Checks a Telegram Login Widget payload: the hash must be an HMAC-SHA256 of the
// other fields, keyed with SHA-256(bot token), and the login must be recent.
// https://core.telegram.org/widgets/login#checking-authorization
export function verifyTelegramLogin(data: Record<string, unknown>): TelegramLogin | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const hash = data.hash;
  if (!token || typeof hash !== "string") return null;

  // Only Telegram's own fields are signed; ignore anything else in the form.
  const fields = Object.fromEntries(
    FIELDS.map((k) => [k, data[k]]).filter(([, v]) => v !== undefined && v !== null && v !== ""),
  );
  const checkString = Object.keys(fields)
    .sort()
    .map((k) => `${k}=${fields[k]}`)
    .join("\n");
  const secret = createHash("sha256").update(token).digest();
  const expected = createHmac("sha256", secret).update(checkString).digest("hex");

  if (hash.length !== expected.length || !timingSafeEqual(Buffer.from(hash), Buffer.from(expected))) {
    return null;
  }
  const authDate = Number(fields.auth_date);
  if (!authDate || Date.now() / 1000 - authDate > MAX_AGE_SECONDS) return null;

  return {
    id: Number(fields.id),
    first_name: String(fields.first_name ?? ""),
    last_name: fields.last_name ? String(fields.last_name) : undefined,
    username: fields.username ? String(fields.username) : undefined,
    photo_url: fields.photo_url ? String(fields.photo_url) : undefined,
    auth_date: authDate,
  };
}

// Telegram's hosted login page. It sends the user back to returnTo with the
// signed payload in the URL fragment (#tgAuthResult=...).
export function telegramLoginUrl(origin: string, returnTo: string) {
  const botId = process.env.TELEGRAM_BOT_TOKEN?.split(":")[0] ?? "";
  const params = new URLSearchParams({
    bot_id: botId,
    origin,
    return_to: returnTo,
    request_access: "write",
  });
  return `https://oauth.telegram.org/auth?${params}`;
}
