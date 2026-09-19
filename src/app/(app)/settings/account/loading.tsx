import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AccountSettingsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="gap-1.5">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-48 max-w-full" />
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-1.5">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="grid gap-1.5">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-48" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-1.5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </CardHeader>
        <CardContent className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="grid gap-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </CardContent>
        <CardFooter>
          <Skeleton className="h-9 w-36" />
        </CardFooter>
      </Card>

      <Card>
        <CardHeader className="gap-1.5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </CardHeader>
        <CardContent>
          <div className="grid max-w-sm gap-1.5">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-9 w-full" />
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-9 w-36" />
        </CardFooter>
      </Card>
    </div>
  );
}
