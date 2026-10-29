import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function TeamLoading() {
  return (
    <div className="flex max-w-3xl flex-1 flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Card>
        <CardHeader className="gap-1.5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
