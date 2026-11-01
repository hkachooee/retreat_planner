"use client";

import { Button, Notice } from "@/components/ui";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex flex-1 flex-col justify-center py-6">
      <Notice
        title="Something went wrong"
        action={
          <Button onClick={reset} variant="secondary" className="h-11">
            Try again
          </Button>
        }
      >
        We couldn&apos;t load this page. Check your connection and try again.
      </Notice>
    </main>
  );
}
