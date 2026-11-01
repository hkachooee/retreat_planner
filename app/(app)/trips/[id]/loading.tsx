import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading trip" className="pt-5">
      <Skeleton className="h-4 w-12" />
      <Skeleton className="mt-4 h-48 rounded-xl" />
      <Skeleton className="mt-5 h-7 w-56" />
      <Skeleton className="mt-3 h-6 w-48" />
      <Skeleton className="mt-6 h-16" />
    </div>
  );
}
