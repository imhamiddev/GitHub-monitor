import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FolderGitIcon } from "lucide-react";

export function RepositoryNotificationLinks({
  repositories,
}: {
  repositories: { id: string; name: string }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Repository preferences</CardTitle>
        <CardDescription>
          Fine-tune which event types notify you for each monitored repository.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {repositories.length === 0 ? (
          <EmptyState
            icon={FolderGitIcon}
            title="No monitored repositories"
            description="Start monitoring a repository to configure its notification preferences."
            actionLabel="Browse repositories"
            actionHref="/repositories"
          />
        ) : (
          <div className="divide-y">
            {repositories.map((repo) => (
              <Link
                key={repo.id}
                href={`/repositories/${repo.id}`}
                className="hover:bg-accent/50 -mx-2 flex items-center justify-between rounded-md px-2 py-2.5 text-sm transition-colors"
              >
                {repo.name}
                <ChevronRightIcon className="text-muted-foreground size-4" />
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
