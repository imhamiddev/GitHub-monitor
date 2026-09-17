import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, ExternalLinkIcon } from "lucide-react";

import { getServerSession } from "@/lib/auth/session";
import { getInstallationForUser } from "@/lib/github/installations";
import { getRepositoryForUser } from "@/lib/github/repo-detail";
import { EVENT_CATEGORIES, EVENT_CATEGORY_LABELS } from "@/lib/github/events";
import { MonitoringToggleCard } from "@/components/repositories/monitoring-toggle-card";
import { EventSettingRow } from "@/components/repositories/event-setting-row";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export async function generateMetadata({
  params,
}: PageProps<"/repositories/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: `Repository settings — GitHub Monitor (${id})` };
}

export default async function RepositoryDetailPage({
  params,
}: PageProps<"/repositories/[id]">) {
  const { id } = await params;

  const session = await getServerSession();
  if (!session) return null;

  const installation = await getInstallationForUser(session.user.id);
  if (!installation) notFound();

  const repo = await getRepositoryForUser(id, installation.id);
  if (!repo) notFound();

  return (
    <div className="flex max-w-2xl flex-1 flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
          <Link href="/repositories">
            <ArrowLeftIcon />
            Back to repositories
          </Link>
        </Button>
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{repo.name}</h1>
            {repo.description && (
              <p className="text-muted-foreground text-sm">{repo.description}</p>
            )}
          </div>
          <Button variant="outline" size="sm" asChild>
            <a
              href={`https://github.com/${repo.fullName}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLinkIcon />
              View on GitHub
            </a>
          </Button>
        </div>
      </div>

      <MonitoringToggleCard
        githubRepoId={repo.githubRepoId}
        repoName={repo.name}
        initialMonitored={repo.isMonitored}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notifications</CardTitle>
          <CardDescription>
            Choose which kinds of events notify you for this repository.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {EVENT_CATEGORIES.map((category) => (
            <EventSettingRow
              key={category}
              repositoryId={repo.id}
              category={category}
              label={EVENT_CATEGORY_LABELS[category]}
              initialEnabled={repo.eventSettings[category]}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
