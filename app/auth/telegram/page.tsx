"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

// Telegram returns here with the signed login in the URL fragment
// (#tgAuthResult=<base64 JSON>). The server verifies it in auth.ts.
function parseLogin(hash: string): Record<string, string> | null {
  const raw = new URLSearchParams(hash.slice(1)).get("tgAuthResult");
  if (!raw) return null;
  try {
    const b64 = raw.replace(/-/g, "+").replace(/_/g, "/");
    const data = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))));
    if (!data?.hash) return null;
    return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)]));
  } catch {
    return null;
  }
}

const subscribe = () => () => {};

export default function TelegramCallbackPage() {
  // null on the server, the URL fragment once hydrated
  const hash = useSyncExternalStore(subscribe, () => window.location.hash, () => null);
  const [signInFailed, setSignInFailed] = useState(false);
  const login = hash === null ? null : parseLogin(hash);
  const failed = signInFailed || (hash !== null && !login);

  useEffect(() => {
    if (login) signIn("telegram", { ...login, redirectTo: "/trips" }).catch(() => setSignInFailed(true));
    // Run once per fragment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hash]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      {failed ? (
        <>
          <p className="font-semibold">Sign-in didn&apos;t go through</p>
          <p className="text-sm text-muted">Telegram didn&apos;t send a valid login.</p>
          <Link href="/" className="text-sm font-semibold text-accent underline underline-offset-2">
            Try again
          </Link>
        </>
      ) : (
        <>
          <div className="size-8 animate-spin rounded-full border-2 border-line border-t-accent" />
          <p className="text-sm text-muted">Signing you in…</p>
        </>
      )}
    </main>
  );
}
