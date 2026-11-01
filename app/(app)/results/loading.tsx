import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading results" className="pt-6">
      <Skeleton className="h-7 w-36" />
      <Skeleton className="mt-6 h-20 rounded-2xl" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="mt-5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-2 h-3 rounded-full" />
        </div>
      ))}
    </div>
  );
}
