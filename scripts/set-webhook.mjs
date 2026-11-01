// Points the Telegram bot at the deployed /api/telegram route.
// Usage: npm run telegram:webhook [-- https://your-domain]
const base = process.argv[2] ?? "https://retreatplanner.vercel.app";
const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!token || !secret) {
  console.error("TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET must be set (run `vercel env pull .env.local`).");
  process.exit(1);
}

const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url: `${base}/api/telegram`,
    secret_token: secret,
    allowed_updates: ["message", "callback_query"],
  }),
});
const data = await res.json();
console.log(data.ok ? `Webhook set to ${base}/api/telegram` : `Failed: ${data.description}`);
if (!data.ok) process.exit(1);

// The command menu Telegram shows when someone types "/".
const commands = await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    commands: [
      { command: "vote", description: "Post the trip vote in this group" },
      { command: "trip", description: "Organizers: add a trip (name, date, days, price)" },
    ],
  }),
}).then((r) => r.json());
console.log(commands.ok ? "Command menu updated" : `Commands failed: ${commands.description}`);
