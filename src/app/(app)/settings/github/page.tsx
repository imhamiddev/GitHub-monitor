import type { Metadata } from "next";

import { getServerSession } from "@/lib/auth/session";
import { getInstallationForUser } from "@/lib/github/installations";
import { GithubConnectionCard } from "@/components/settings/github-connection-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangleIcon, CheckCircle2Icon } from "lucide-react";

export const metadata: Metadata = {
  title: "GitHub connection — Settings",
};

const STATUS_MESSAGES: Record<string, { variant: "success" | "destructive"; title: string; description: string }> = {
  connected: {
    variant: "success",
    title: "GitHub connected",
    description: "Your GitHub App installation was linked successfully.",
  },
  pending_approval: {
    variant: "destructive",
    title: "Approval pending",
    description:
      "An organization owner needs to approve this installation before it can be used.",
  },
  invalid_state: {
    variant: "destructive",
    title: "Connection failed",
    description: "The installation request could not be verified. Please try again.",
  },
  missing_params: {
    variant: "destructive",
    title: "Connection failed",
    description: "GitHub did not return the expected installation details.",
  },
  installation_error: {
    variant: "destructive",
    title: "Connection failed",
    description: "Something went wrong while linking your installation. Please try again.",
  },
};

export default async function GithubSettingsPage({
  searchParams,
}: PageProps<"/settings/github">) {
  const session = await getServerSession();
  const installation = session
    ? await getInstallationForUser(session.user.id)
    : null;

  const params = await searchParams;
  const statusKey = typeof params.status === "string" ? params.status : undefined;
  const statusMessage = statusKey ? STATUS_MESSAGES[statusKey] : undefined;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">GitHub connection</h1>
        <p className="text-muted-foreground text-sm">
          Manage how GitHub Monitor connects to your GitHub account.
        </p>
      </div>

      {statusMessage && (
        <Alert variant={statusMessage.variant}>
          {statusMessage.variant === "success" ? (
            <CheckCircle2Icon />
          ) : (
            <AlertTriangleIcon />
          )}
          <AlertTitle>{statusMessage.title}</AlertTitle>
          <AlertDescription>{statusMessage.description}</AlertDescription>
        </Alert>
      )}

      <GithubConnectionCard
        connection={
          installation
            ? {
                connected: true,
                accountLogin: installation.githubAccountLogin,
                accountType: installation.githubAccountType,
              }
            : { connected: false }
        }
      />
    </div>
  );
}
