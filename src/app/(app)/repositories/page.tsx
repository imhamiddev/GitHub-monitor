import type { Metadata } from "next";
import { GitBranchIcon } from "lucide-react";

import { getServerSession } from "@/lib/auth/session";
import { getInstallationForUser } from "@/lib/github/installations";
import { listInstallationRepositories } from "@/lib/github/repo-sync";
import { RepositoryList } from "@/components/repositories/repository-list";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "Repositories — GitHub Monitor",
};

export default async function RepositoriesPage() {
  const session = await getServerSession();
  if (!session) return null;

  const installation = await getInstallationForUser(session.user.id);

  if (!installation) {
    return (
      <EmptyState
        icon={GitBranchIcon}
        title="Connect your GitHub account"
        description="Connect GitHub Monitor to your GitHub account to see and manage your repositories."
        actionLabel="Connect GitHub"
        actionHref="/settings/github"
      />
    );
  }

  const repos = await listInstallationRepositories(
    installation.id,
    installation.installationId
  );

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Repositories</h1>
        <p className="text-muted-foreground text-sm">
          Choose which repositories to monitor and manage their tracked
          event settings.
        </p>
      </div>

      {repos.length === 0 ? (
        <EmptyState
          icon={GitBranchIcon}
          title="No repositories found"
          description="No repositories are accessible to this GitHub App installation. Grant access to repositories from GitHub's installation settings."
        />
      ) : (
        <RepositoryList repos={repos} />
      )}
    </div>
  );
}
