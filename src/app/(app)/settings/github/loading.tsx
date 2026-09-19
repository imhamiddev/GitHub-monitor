import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function GithubSettingsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="gap-1.5">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-9 w-40" />
        </CardContent>
      </Card>
    </div>
  );
}
