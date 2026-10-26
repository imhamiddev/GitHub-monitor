import { subDays } from "@/lib/activity/group-by-day";
import { getDashboardStats, getRecentActivity } from "@/lib/dashboard/stats";
import { getStatistics } from "@/lib/statistics/counts";
import {
  answerCallbackQuery,
  editTelegramMessage,
  sendTelegramMessage,
  type InlineButton,
} from "@/lib/telegram/api";
import { completeLink, unlinkByChatId } from "@/lib/telegram/connection";
import {
  BTN,
  CB,
  connectGithubButtons,
  connectTelegramButtons,
  dashboardButtons,
  guestKeyboard,
  memberKeyboard,
  websiteButtons,
} from "@/lib/telegram/keyboards";
import * as msg from "@/lib/telegram/messages";
import { getMemberByChatId, getMonitoredRepos, setNotificationsByChatId } from "@/lib/telegram/queries";

export type TelegramUpdate = {
  message?: {
    text?: string;
    chat: { id: number; type: string };
    from?: { username?: string; first_name?: string };
  };
  callback_query?: {
    id: string;
    data?: string;
    from: { first_name?: string };
    message?: { message_id: number; chat: { id: number; type: string } };
  };
};

type StatsRange = "today" | "7d" | "30d";

function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function statsKeyboard(active: StatsRange): { inline_keyboard: InlineButton[][] } {
  const label = (r: StatsRange, text: string) => ({
    text: r === active ? `• ${text} •` : text,
    callback_data: CB.statsRange(r),
  });
  return {
    inline_keyboard: [
      [label("today", "Today"), label("7d", "7 days"), label("30d", "30 days")],
      ...dashboardButtons(),
    ],
  };
}

function notificationsKeyboard(enabled: boolean) {
  return {
    inline_keyboard: [
      [
        {
          text: enabled ? "⏸ Pause notifications" : "▶️ Resume notifications",
          callback_data: CB.toggleNotifications,
        },
      ],
    ] as InlineButton[][],
  };
}

async function buildStats(userId: string, range: StatsRange) {
  const from = range === "today" ? startOfTodayUtc() : subDays(new Date(), range === "7d" ? 7 : 30);
  return msg.statsMessage(range, await getStatistics(userId, from));
}

/* ------------------------------ screens ---------------------------------- */

async function showStart(chatId: string, firstName?: string | null) {
  const member = await getMemberByChatId(chatId);
  if (member) {
    await sendTelegramMessage(chatId, msg.memberWelcome(member), {
      replyMarkup: memberKeyboard(),
    });
    await sendTelegramMessage(chatId, "Quick links 👇", {
      replyMarkup: { inline_keyboard: dashboardButtons() },
      silent: true,
    });
    return;
  }
  await sendTelegramMessage(chatId, msg.guestWelcome(firstName), {
    replyMarkup: guestKeyboard(),
  });
  await sendTelegramMessage(chatId, "🌐 Get started on the website:", {
    replyMarkup: { inline_keyboard: connectTelegramButtons() },
    silent: true,
  });
}

async function showProfile(chatId: string) {
  const member = await getMemberByChatId(chatId);
  if (!member) {
    await sendTelegramMessage(chatId, msg.guestProfile(), {
      replyMarkup: { inline_keyboard: connectTelegramButtons() },
    });
    return;
  }
  const stats = await getDashboardStats(member.userId);
  await sendTelegramMessage(chatId, msg.memberProfile(member, stats), {
    replyMarkup: { inline_keyboard: dashboardButtons() },
  });
}

async function showConnectGithub(chatId: string) {
  await sendTelegramMessage(chatId, msg.connectGithubMessage(), {
    replyMarkup: { inline_keyboard: connectGithubButtons() },
  });
}

async function requireMember(chatId: string) {
  const member = await getMemberByChatId(chatId);
  if (!member) {
    await sendTelegramMessage(chatId, msg.NOT_CONNECTED_HINT, {
      replyMarkup: { inline_keyboard: connectTelegramButtons() },
    });
  }
  return member;
}

async function showStats(chatId: string) {
  const member = await requireMember(chatId);
  if (!member) return;
  await sendTelegramMessage(chatId, await buildStats(member.userId, "today"), {
    replyMarkup: statsKeyboard("today"),
  });
}

async function showActivity(chatId: string) {
  const member = await requireMember(chatId);
  if (!member) return;
  const items = await getRecentActivity(member.userId, 8);
  await sendTelegramMessage(chatId, msg.activityMessage(items), {
    replyMarkup: { inline_keyboard: dashboardButtons() },
  });
}

async function showRepos(chatId: string) {
  const member = await requireMember(chatId);
  if (!member) return;
  await sendTelegramMessage(chatId, msg.reposMessage(await getMonitoredRepos(member.userId)), {
    replyMarkup: { inline_keyboard: dashboardButtons() },
  });
}

async function showNotifications(chatId: string) {
  const member = await requireMember(chatId);
  if (!member) return;
  await sendTelegramMessage(chatId, msg.notificationsMessage(member.notificationsEnabled), {
    replyMarkup: notificationsKeyboard(member.notificationsEnabled),
  });
}

async function showHelp(chatId: string) {
  const member = await getMemberByChatId(chatId);
  await sendTelegramMessage(chatId, msg.helpMessage(Boolean(member)), {
    replyMarkup: { inline_keyboard: websiteButtons() },
  });
}

async function handleStartWithToken(
  chatId: string,
  token: string,
  from?: { username?: string; first_name?: string }
) {
  const result = await completeLink(token, {
    chatId,
    username: from?.username ?? null,
    firstName: from?.first_name ?? null,
  });

  if (result.ok) {
    await sendTelegramMessage(chatId, msg.linkedSuccess(from?.first_name), {
      replyMarkup: memberKeyboard(),
    });
    await sendTelegramMessage(chatId, "Quick links 👇", {
      replyMarkup: { inline_keyboard: dashboardButtons() },
      silent: true,
    });
  } else if (result.reason === "chat_in_use") {
    await sendTelegramMessage(
      chatId,
      "⚠️ This Telegram account is already linked to another GitHub Monitor user. Send /stop first, then try again."
    );
  } else {
    await sendTelegramMessage(
      chatId,
      "❌ This link is invalid or has expired. Generate a new one from <b>Settings → Telegram</b>.",
      { replyMarkup: { inline_keyboard: connectTelegramButtons() } }
    );
  }
}

async function handleStop(chatId: string) {
  const removed = await unlinkByChatId(chatId);
  await sendTelegramMessage(
    chatId,
    removed
      ? "🔌 <b>Disconnected.</b> You will no longer receive notifications.\nSend /start any time to set things up again."
      : "This chat isn't connected.",
    { replyMarkup: guestKeyboard() }
  );
}

/* ------------------------------ routing ---------------------------------- */

async function handleMessage(update: NonNullable<TelegramUpdate["message"]>) {
  if (!update.text || update.chat.type !== "private") return;

  const chatId = String(update.chat.id);
  const text = update.text.trim();
  const [command, arg] = text.split(/\s+/, 2);
  const cmd = command.startsWith("/") ? command.split("@")[0].toLowerCase() : null;

  if (cmd === "/start") {
    if (arg) return handleStartWithToken(chatId, arg, update.from);
    return showStart(chatId, update.from?.first_name);
  }

  // Slash commands and taps on the bottom keyboard share the same handlers.
  if (cmd === "/profile" || text === BTN.profile) return showProfile(chatId);
  if (cmd === "/connect" || text === BTN.connectGithub) return showConnectGithub(chatId);
  if (cmd === "/stats" || text === BTN.stats) return showStats(chatId);
  if (cmd === "/activity" || text === BTN.activity) return showActivity(chatId);
  if (cmd === "/repos" || text === BTN.repos) return showRepos(chatId);
  if (cmd === "/notifications" || text === BTN.notifications) return showNotifications(chatId);
  if (cmd === "/help" || text === BTN.help) return showHelp(chatId);
  if (cmd === "/stop") return handleStop(chatId);
  if (text === BTN.howItWorks) {
    return void (await sendTelegramMessage(chatId, msg.howItWorks(), {
      replyMarkup: { inline_keyboard: websiteButtons() },
    }));
  }

  // Anything else: gentle nudge back to the menu.
  const member = await getMemberByChatId(chatId);
  await sendTelegramMessage(chatId, "I didn't get that 🤔 Use the menu below or type /help.", {
    replyMarkup: member ? memberKeyboard() : guestKeyboard(),
    silent: true,
  });
}

async function handleCallback(query: NonNullable<TelegramUpdate["callback_query"]>) {
  const message = query.message;
  if (!message || message.chat.type !== "private" || !query.data) {
    await answerCallbackQuery(query.id);
    return;
  }
  const chatId = String(message.chat.id);
  const member = await getMemberByChatId(chatId);
  if (!member) {
    await answerCallbackQuery(query.id, "Not connected");
    return;
  }

  if (query.data === CB.toggleNotifications) {
    const enabled = !member.notificationsEnabled;
    await setNotificationsByChatId(chatId, enabled);
    await answerCallbackQuery(query.id, enabled ? "Notifications ON" : "Notifications paused");
    await editTelegramMessage(
      chatId,
      message.message_id,
      msg.notificationsMessage(enabled),
      notificationsKeyboard(enabled)
    );
    return;
  }

  const range = (["today", "7d", "30d"] as const).find((r) => CB.statsRange(r) === query.data);
  if (range) {
    await answerCallbackQuery(query.id);
    await editTelegramMessage(
      chatId,
      message.message_id,
      await buildStats(member.userId, range),
      statsKeyboard(range)
    );
    return;
  }

  await answerCallbackQuery(query.id);
}

export async function handleTelegramUpdate(update: TelegramUpdate) {
  if (update.message) await handleMessage(update.message);
  else if (update.callback_query) await handleCallback(update.callback_query);
}
