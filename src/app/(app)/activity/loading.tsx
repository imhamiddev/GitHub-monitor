import { Skeleton } from "@/components/ui/skeleton";

export default function ActivityLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Skeleton className="h-9 w-full sm:w-48" />
        <Skeleton className="h-9 w-full sm:w-48" />
        <Skeleton className="h-9 w-full sm:w-40" />
        <Skeleton className="h-9 flex-1 sm:min-w-48" />
      </div>

      <div className="flex flex-col gap-6">
        {Array.from({ length: 2 }).map((_, groupIndex) => (
          <div key={groupIndex}>
            <Skeleton className="mb-2 h-4 w-20" />
            <div className="divide-y rounded-lg border">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 px-3 py-3">
                  <Skeleton className="mt-0.5 size-4 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-56 max-w-full" />
                    <Skeleton className="h-3 w-72 max-w-full" />
                  </div>
                  <Skeleton className="h-3 w-16 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
