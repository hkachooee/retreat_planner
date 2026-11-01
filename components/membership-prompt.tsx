"use client";

import { useState } from "react";
import { confirmMemberAction } from "@/app/actions";
import { Button, Card } from "./ui";

export function MembershipPrompt({ company }: { company: string }) {
  const [declined, setDeclined] = useState(false);

  if (declined) {
    return (
      <Card className="p-4 text-sm">
        Only {company} members can vote. You can still browse trips and results.{" "}
        <button className="font-semibold text-accent underline" onClick={() => setDeclined(false)}>
          Change answer
        </button>
      </Card>
    );
  }

  return (
    <Card highlight className="p-4">
      <p className="font-semibold">Are you part of {company}?</p>
      <p className="mt-1 text-sm text-muted">Only team members can vote.</p>
      <form action={confirmMemberAction} className="mt-3 flex gap-2">
        <Button type="submit" variant="accent" className="h-10">
          Yes
        </Button>
        <Button type="button" variant="secondary" className="h-10" onClick={() => setDeclined(true)}>
          No
        </Button>
      </form>
    </Card>
  );
}
