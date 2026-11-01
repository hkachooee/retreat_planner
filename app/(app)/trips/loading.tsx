import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading trips" className="pt-6">
      <Skeleton className="h-7 w-40" />
      <div className="mt-6 flex gap-2">
        <Skeleton className="h-8 w-12 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="mt-3 h-48 rounded-2xl" />
      ))}
    </div>
  );
}
