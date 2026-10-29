import type { Metadata } from "next";
import { BellRingIcon } from "lucide-react";

import { getServerSession } from "@/lib/auth/session";
import { getInstallationForUser } from "@/lib/github/installations";
import { listAlertRules, listRepoOptions } from "@/lib/alerts/queries";
import { AlertRuleForm } from "@/components/alerts/alert-rule-form";
import { AlertRuleList } from "@/components/alerts/alert-rule-list";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "Alerts — GitHub Monitor",
};

export default async function AlertsPage() {
  const session = await getServerSession();
  if (!session) return null;

  const installation = await getInstallationForUser(session.user.id);
  if (!installation) {
    return (
      <EmptyState
        icon={BellRingIcon}
        title="Connect your GitHub account"
        description="Alert rules watch your repositories, so GitHub needs to be connected first."
        actionLabel="Connect GitHub"
        actionHref="/settings/github"
      />
    );
  }

  const [rules, repos] = await Promise.all([listAlertRules(session.user.id), listRepoOptions(session.user.id)]);

  return (
    <div className="flex max-w-3xl flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Alerts</h1>
        <p className="text-muted-foreground text-sm">
          Smart notifications for things that matter — delivered to your connected Telegram chats.
        </p>
      </div>
      <AlertRuleForm repos={repos} />
      <AlertRuleList rules={rules} />
    </div>
  );
}
