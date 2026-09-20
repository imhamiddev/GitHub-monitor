import type { Metadata } from "next";

import { DEMO_REPOS } from "@/lib/demo/data";
import { DemoRepositoryCard } from "@/components/demo/demo-repository-card";

export const metadata: Metadata = { title: "Repositories — Demo" };

export default function DemoRepositoriesPage() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Repositories</h1>
        <p className="text-muted-foreground text-sm">
          Choose which repositories to monitor and manage their tracked event
          settings.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DEMO_REPOS.map((repo) => (
          <DemoRepositoryCard key={repo.id} repo={repo} />
        ))}
      </div>
    </div>
  );
}
