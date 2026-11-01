import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading organizer tools" className="pt-6">
      <Skeleton className="h-7 w-44" />
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="mt-4 h-32 rounded-2xl" />
      ))}
    </div>
  );
}
