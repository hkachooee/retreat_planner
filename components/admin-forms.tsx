"use client";

import { useActionState, useRef } from "react";
import { addTripAction, saveRetreatAction, type FormState } from "@/app/(app)/admin/actions";
import { Button } from "./ui";

const input =
  "h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink placeholder:text-muted/70 focus:border-ink";
const label = "flex flex-col gap-1 text-xs font-medium text-muted";

function Status({ state }: { state: FormState }) {
  return (
    <p aria-live="polite" className={`min-h-5 text-sm ${state?.ok === false ? "text-danger" : "text-accent"}`}>
      {state?.message}
    </p>
  );
}

export function RetreatForm({ title, deadline, isNew }: { title: string; deadline: string; isNew: boolean }) {
  const [state, action, pending] = useActionState(saveRetreatAction, null);
  return (
    <form action={action} className="flex flex-col gap-3">
      <label className={label}>
        Retreat name
        <input name="title" defaultValue={title} placeholder="Team Retreat 2027" className={input} required />
      </label>
      <label className={label}>
        Voting deadline (Eastern time)
        <input name="deadline" type="datetime-local" defaultValue={deadline} className={input} />
      </label>
      <Button type="submit" variant="secondary" className="h-11" disabled={pending}>
        {pending ? "Saving…" : isNew ? "Start retreat" : "Save"}
      </Button>
      <Status state={state} />
    </form>
  );
}

export function AddTripForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(async (prev: FormState, form: FormData) => {
    const result = await addTripAction(prev, form);
    if (result?.ok) formRef.current?.reset();
    return result;
  }, null);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3">
      <label className={label}>
        Place
        <input name="place" placeholder="Lake house, Sapanca" className={input} required />
      </label>
      <div className="grid grid-cols-3 gap-2">
        <label className={label}>
          Trip date
          <input name="date" type="date" className={input} required />
        </label>
        <label className={label}>
          Days
          <input name="days" type="number" min={1} inputMode="numeric" placeholder="3" className={input} required />
        </label>
        <label className={label}>
          € per person
          <input name="price" type="number" min={0} inputMode="numeric" placeholder="320" className={input} required />
        </label>
      </div>
      <label className={label}>
        Includes (optional)
        <textarea name="details" rows={3} placeholder="Rooms, meals, activities…" className={`${input} h-auto py-2`} />
      </label>
      <Button type="submit" variant="secondary" className="h-11" disabled={pending}>
        {pending ? "Adding…" : "+ Add trip"}
      </Button>
      <Status state={state} />
    </form>
  );
}
