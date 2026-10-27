import type { Metadata } from "next";

import { getServerSession } from "@/lib/auth/session";
import { getTelegramConnection, listGroups } from "@/lib/telegram/connection";
import { getBotUsername, isTelegramConfigured } from "@/lib/telegram/api";
import { TelegramConnectionCard } from "@/components/settings/telegram-connection-card";

export const metadata: Metadata = {
  title: "Telegram — Settings",
};

export default async function TelegramSettingsPage() {
  const session = await getServerSession();
  const connection = session ? await getTelegramConnection(session.user.id) : null;
  const groups = session ? await listGroups(session.user.id) : [];

  return (
    <TelegramConnectionCard
      configured={isTelegramConfigured()}
      groups={groups.map((g) => ({ id: g.id, title: g.title, chatType: g.chatType }))}
      botUsername={getBotUsername()}
      connection={
        connection?.chatId
          ? {
              connected: true,
              username: connection.telegramUsername,
              firstName: connection.telegramFirstName,
              notificationsEnabled: connection.notificationsEnabled,
            }
          : { connected: false }
      }
    />
  );
}
