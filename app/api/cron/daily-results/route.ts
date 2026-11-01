import { timingSafeEqual } from "node:crypto";
import { connection } from "next/server";
import { deadlineLabel } from "@/lib/format";
import { getResults, type Results } from "@/lib/results";
import { siteUrl } from "@/lib/telegram";

// Vercel Cron calls this at 13:00 and 14:00 UTC. Only the run that lands at
// 9 am Eastern sends, so the email keeps its time across daylight saving.
// Add ?now=1 (with the same Authorization header) to send right away.
export async function GET(request: Request) {
  await connection();
  if (!hasCronSecret(request)) return new Response("Unauthorized", { status: 401 });

  const now = new URL(request.url).searchParams.get("now") === "1";
  const hour = Number(
    new Date().toLocaleString("en-US", { timeZone: "America/New_York", hour: "numeric", hourCycle: "h23" }),
  );
  if (!now && hour !== 9) return Response.json({ sent: false, reason: `It's ${hour}:00 ET, not 9:00` });

  const { RESEND_API_KEY, RESULTS_EMAIL_TO } = process.env;
  if (!RESEND_API_KEY || !RESULTS_EMAIL_TO) {
    return Response.json({ sent: false, reason: "RESEND_API_KEY or RESULTS_EMAIL_TO is not set" }, { status: 500 });
  }

  const email = buildEmail(await getResults());
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.RESULTS_EMAIL_FROM || "Retreat Planner <onboarding@resend.dev>",
      to: RESULTS_EMAIL_TO.split(",").map((s) => s.trim()),
      ...email,
    }),
  });
  if (!res.ok) {
    console.error("results email failed", res.status, await res.text());
    return Response.json({ sent: false, reason: `Resend returned ${res.status}` }, { status: 502 });
  }
  return Response.json({ sent: true });
}

function hasCronSecret(request: Request) {
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  const got = request.headers.get("authorization") ?? "";
  return (
    !!process.env.CRON_SECRET &&
    got.length === expected.length &&
    timingSafeEqual(Buffer.from(got), Buffer.from(expected))
  );
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function buildEmail(results: Results) {
  const link = `${siteUrl()}/results`;
  const footer = { text: `Live results: ${link}`, html: `<p><a href="${link}">Open live results</a></p>` };

  if (!results) {
    return {
      subject: "Retreat votes: no vote open yet",
      text: `No retreat vote is open yet.\n\n${footer.text}`,
      html: `<p>No retreat vote is open yet.</p>${footer.html}`,
    };
  }

  const { title, open, deadline, voters, trips } = results;
  const leader = trips[0]?.votes ? trips[0] : null;
  const status = open
    ? `Voting is open${deadline ? ` until ${deadlineLabel(deadline)}` : ""}.`
    : "Voting has closed.";
  const pct = (votes: number) => (voters ? Math.round((votes / voters) * 100) : 0);
  const lines = trips.map((t) => `${t.place}: ${t.votes} ${t.votes === 1 ? "vote" : "votes"} (${pct(t.votes)}%)`);

  return {
    subject: leader
      ? `${title}: ${leader.place} leads, ${voters} ${voters === 1 ? "voter" : "voters"}`
      : `${title}: no votes yet`,
    text: [`${title}`, status, `${voters} people have voted.`, "", ...lines, "", footer.text].join("\n"),
    html: `
      <div style="font-family:Inter,Arial,sans-serif;color:#1b1b1f;max-width:480px">
        <h2 style="margin:0 0 4px">${esc(title)}</h2>
        <p style="margin:0 0 16px;color:#6b6a70">${esc(status)} ${voters} people have voted.</p>
        <table style="width:100%;border-collapse:collapse">
          ${trips
            .map(
              (t) => `<tr>
                <td style="padding:8px 0;border-bottom:1px solid #e2e0da">${esc(t.place)}</td>
                <td style="padding:8px 0;border-bottom:1px solid #e2e0da;text-align:right">${t.votes} · ${pct(t.votes)}%</td>
              </tr>`,
            )
            .join("")}
        </table>
        ${trips.length ? "" : "<p>No trips have been added yet.</p>"}
        ${footer.html}
      </div>`,
  };
}
