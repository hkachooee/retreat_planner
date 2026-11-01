"use client";

import { useEffect, useState } from "react";
import type { Results } from "@/lib/results";

const POLL_MS = 4000;

export function LiveResults({ initial }: { initial: NonNullable<Results> }) {
  const [results, setResults] = useState(initial);
  const [stale, setStale] = useState(false);

  useEffect(() => {
    let active = true;
    const tick = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch("/api/results", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const next = (await res.json()) as Results;
        if (active && next) {
          setResults(next);
          setStale(false);
        }
      } catch {
        if (active) setStale(true);
      }
    };
    const timer = setInterval(tick, POLL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const max = Math.max(1, ...results.trips.map((t) => t.votes));
  const leader = results.trips[0]?.votes ? results.trips[0].id : null;

  return (
    <section aria-label="Votes per trip">
      <p className="mb-4 text-sm text-muted" aria-live="polite">
        {results.voters} {results.voters === 1 ? "person has" : "people have"} voted ·{" "}
        {stale ? (
          <span className="text-danger">reconnecting…</span>
        ) : results.open ? (
          "updates automatically"
        ) : (
          "voting closed"
        )}
      </p>

      {results.trips.length === 0 ? (
        <p className="text-sm text-muted">No trips have been added yet.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {results.trips.map((t, i) => (
            <li key={t.id}>
              <div className="mb-1.5 flex items-baseline justify-between text-sm">
                <span className="font-medium">
                  {t.place}
                  {t.id === leader && <span className="ml-2 text-xs font-semibold text-accent">Leading</span>}
                </span>
                <span className="tabular-nums text-muted">{t.votes}</span>
              </div>
              <div
                className="h-3 overflow-hidden rounded-full bg-tile"
                role="meter"
                aria-label={`${t.place} votes`}
                aria-valuemin={0}
                aria-valuemax={max}
                aria-valuenow={t.votes}
              >
                <div
                  className={`h-full rounded-full transition-[width] duration-700 ease-out ${
                    i === 0 ? "bg-accent" : i === 1 ? "bg-accent/60" : "bg-accent/30"
                  }`}
                  style={{ width: `${(t.votes / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
