import type { Metadata } from "next";

import { getServerSession } from "@/lib/auth/session";
import { getNotificationsEnabled } from "@/lib/notifications/settings";
import { getMonitoredRepositoriesForFilter } from "@/lib/activity/list";
import { GlobalNotificationToggle } from "@/components/settings/global-notification-toggle";
import { RepositoryNotificationLinks } from "@/components/settings/repository-notification-links";

export const metadata: Metadata = {
  title: "Notifications — Settings",
};

export default async function NotificationSettingsPage() {
  const session = await getServerSession();
  if (!session) return null;

  const [notificationsEnabled, repositories] = await Promise.all([
    getNotificationsEnabled(session.user.id),
    getMonitoredRepositoriesForFilter(session.user.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <GlobalNotificationToggle initialEnabled={notificationsEnabled} />
      <RepositoryNotificationLinks repositories={repositories} />
    </div>
  );
}
