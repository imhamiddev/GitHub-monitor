"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, ExternalLinkIcon, GitBranch, PartyPopperIcon } from "lucide-react";
import { toast } from "sonner";

import { completeOnboarding } from "@/lib/onboarding/actions";
import type { RepoListItem } from "@/lib/github/repo-sync";
import { bulkSetRepositoryMonitoring } from "@/lib/github/repo-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Logo } from "@/components/layout/logo";

type Step = 1 | 2 | 3;

const STEP_LABELS = ["Connect GitHub", "Choose Repositories", "Done"];

export function OnboardingWizard({
  githubConnected,
  repos,
}: {
  githubConnected: boolean;
  repos: RepoListItem[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(githubConnected ? 2 : 1);
  const [selected, setSelected] = useState<Set<number>>(
    new Set(repos.filter((r) => r.isMonitored).map((r) => r.githubRepoId))
  );
  const [isFinishing, setIsFinishing] = useState(false);

  function toggleRepo(githubRepoId: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(githubRepoId)) next.delete(githubRepoId);
      else next.add(githubRepoId);
      return next;
    });
  }

  async function handleFinish() {
    setIsFinishing(true);
    if (selected.size > 0) {
      const result = await bulkSetRepositoryMonitoring([...selected], true);
      if (!result.success) {
        toast.error(result.error);
        setIsFinishing(false);
        return;
      }
    }
    await completeOnboarding();
    setStep(3);
    setIsFinishing(false);
  }

  function handleDone() {
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex items-center gap-2 font-medium">
        <Logo className="size-8" />
        GitHub Monitor
      </div>

      <div className="flex items-center gap-2">
        {STEP_LABELS.map((label, index) => {
          const stepNumber = (index + 1) as Step;
          const isComplete = step > stepNumber;
          const isActive = step === stepNumber;
          return (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`flex size-6 items-center justify-center rounded-full text-xs font-medium ${
                  isComplete
                    ? "bg-primary text-primary-foreground"
                    : isActive
                      ? "border-primary text-primary border-2"
                      : "bg-muted-foreground/20 text-muted-foreground"
                }`}
              >
                {isComplete ? <CheckIcon className="size-3.5" /> : stepNumber}
              </div>
              <span
                className={`hidden text-sm sm:inline ${isActive ? "font-medium" : "text-muted-foreground"}`}
              >
                {label}
              </span>
              {index < STEP_LABELS.length - 1 && (
                <div className="bg-border mx-1 h-px w-6 sm:w-10" />
              )}
            </div>
          );
        })}
      </div>

      <div className="w-full max-w-md">
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Connect your GitHub account</CardTitle>
              <CardDescription>
                GitHub Monitor connects via a GitHub App — you choose exactly which
                repositories to grant access to, and can revoke access at any time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <a href="/api/github/connect?returnTo=onboarding">
                  <GitBranch />
                  Connect GitHub
                </a>
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Choose repositories to monitor</CardTitle>
              <CardDescription>
                Select which repositories you&apos;d like to track. You can change
                this anytime from Settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {repos.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No repositories found for this installation.{" "}
                  <a
                    href="https://github.com/settings/installations"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary inline-flex items-center gap-1 underline underline-offset-2"
                  >
                    Grant repository access
                    <ExternalLinkIcon className="size-3" />
                  </a>
                </p>
              ) : (
                <div className="divide-y rounded-md border">
                  {repos.map((repo) => (
                    <div
                      key={repo.githubRepoId}
                      className="flex items-center justify-between px-3 py-2.5"
                    >
                      <span className="truncate text-sm">{repo.name}</span>
                      <Switch
                        checked={selected.has(repo.githubRepoId)}
                        onCheckedChange={() => toggleRepo(repo.githubRepoId)}
                      />
                    </div>
                  ))}
                </div>
              )}
              <Button onClick={handleFinish} disabled={isFinishing} className="w-full">
                {selected.size > 0
                  ? `Start monitoring ${selected.size} ${selected.size === 1 ? "repository" : "repositories"}`
                  : "Skip for now"}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader className="items-center text-center">
              <div className="bg-primary/10 mb-2 flex size-12 items-center justify-center rounded-full">
                <PartyPopperIcon className="text-primary size-6" />
              </div>
              <CardTitle>You&apos;re all set!</CardTitle>
              <CardDescription>
                GitHub Monitor is now watching your repositories. Head to your
                dashboard to see what&apos;s happening.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleDone} className="w-full">
                Go to dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
