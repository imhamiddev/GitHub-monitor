import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/session";
import { getInstallationForUser } from "@/lib/github/installations";
import { listInstallationRepositories } from "@/lib/github/repo-sync";
import { hasCompletedOnboarding } from "@/lib/onboarding/actions";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export const metadata: Metadata = {
  title: "Get started — GitHub Monitor",
};

export default async function OnboardingPage() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  const alreadyDone = await hasCompletedOnboarding(session.user.id);
  if (alreadyDone) {
    redirect("/dashboard");
  }

  const installation = await getInstallationForUser(session.user.id);
  const repos = installation
    ? await listInstallationRepositories(installation.id, installation.installationId)
    : [];

  return <OnboardingWizard githubConnected={!!installation} repos={repos} />;
}
