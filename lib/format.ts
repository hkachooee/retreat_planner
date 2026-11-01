// Shared display formatting. Times are shown in the organizer's zone (US Eastern).
const ZONE = "America/New_York";

export const euro = (n: number) => `€${n.toLocaleString("en-US")}`;

export const tripDate = (iso: string) =>
  iso
    ? new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      })
    : "Date TBC";

export const days = (n: number) => `${n} ${n === 1 ? "day" : "days"}`;

// "Friday 18:00 ET"
export function deadlineLabel(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const weekday = d.toLocaleDateString("en-US", { weekday: "long", timeZone: ZONE });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: ZONE });
  return `${weekday} ${time} ET`;
}

// "2d 4h left", "35m left", "" when there's no deadline
export function timeLeft(iso: string, now = Date.now()) {
  if (!iso) return "";
  const ms = Date.parse(iso) - now;
  if (ms <= 0) return "Voting closed";
  const m = Math.floor(ms / 60000);
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  if (d > 0) return `${d}d ${h}h left`;
  if (h > 0) return `${h}h ${m % 60}m left`;
  return `${m}m left`;
}

// Converts a datetime-local value entered in Eastern time to an ISO timestamp.
export function easternToIso(local: string) {
  if (!local) return "";
  const asUtc = new Date(`${local}:00Z`);
  const offsetMin =
    (new Date(asUtc.toLocaleString("en-US", { timeZone: "UTC" })).getTime() -
      new Date(asUtc.toLocaleString("en-US", { timeZone: ZONE })).getTime()) /
    60000;
  return new Date(asUtc.getTime() + offsetMin * 60000).toISOString();
}

// ISO timestamp -> datetime-local value in Eastern time, for form defaults.
export function isoToEastern(iso: string) {
  if (!iso) return "";
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(iso))
      .map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
