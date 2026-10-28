import { subDays } from "@/lib/activity/group-by-day";
import { getDashboardStats, getRecentActivity } from "@/lib/dashboard/stats";
import { getStatistics } from "@/lib/statistics/counts";
import {
  answerCallbackQuery,
  editTelegramMessage,
  isChatAdmin,
  sendTelegramMessage,
  type InlineButton,
} from "@/lib/telegram/api";
import {
  completeGroupLink,
  completeLink,
  removeGroupByChatId,
} from "@/lib/telegram/connection";
import { LANGS, matchButton, t, type Lang } from "@/lib/telegram/i18n";
import {
  CB,
  connectGithubButtons,
  connectTelegramButtons,
  dashboardButtons,
  guestKeyboard,
  languageButtons,
  memberKeyboard,
  websiteButtons,
} from "@/lib/telegram/keyboards";
import * as msg from "@/lib/telegram/messages";
import { resolveLang, setChatLanguage } from "@/lib/telegram/prefs";
import {
  countGroups,
  getMemberByChatId,
  getMonitoredRepos,
  getTopData,
  setNotificationsByChatId,
} from "@/lib/telegram/queries";

type From = { id?: number; username?: string; first_name?: string; language_code?: string };
type Chat = { id: number; type: string; title?: string };

export type TelegramUpdate = {
  message?: { text?: string; chat: Chat; from?: From };
  channel_post?: { text?: string; chat: Chat };
  callback_query?: {
    id: string;
    data?: string;
    from: From;
    message?: { message_id: number; chat: Chat };
  };
};

type StatsRange = msg.StatsRange;

function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function statsKeyboard(lang: Lang, active: StatsRange): { inline_keyboard: InlineButton[][] } {
  const label = (r: StatsRange, key: "ib.today" | "ib.d7" | "ib.d30"): InlineButton => ({
    text: r === active ? `• ${t(lang, key)} •` : t(lang, key),
    callback_data: CB.statsRange(r),
    style: r === active ? "success" : "primary",
  });
  return {
    inline_keyboard: [[label("today", "ib.today"), label("7d", "ib.d7"), label("30d", "ib.d30")]],
  };
}

function notificationsKeyboard(lang: Lang, enabled: boolean) {
  return {
    inline_keyboard: [
      [
        {
          text: t(lang, enabled ? "ib.pause" : "ib.resume"),
          callback_data: CB.toggleNotifications,
          // Red = destructive action (pause), green = turn back on.
          style: enabled ? "danger" : "success",
        },
      ],
    ] as InlineButton[][],
  };
}

async function buildStats(lang: Lang, userId: string, range: StatsRange) {
  const from = range === "today" ? startOfTodayUtc() : subDays(new Date(), range === "7d" ? 7 : 30);
  return msg.statsMessage(lang, range, await getStatistics(userId, from));
}

const send = sendTelegramMessage;

/* ------------------------------ private-chat screens ---------------------------------- */

async function showStart(chatId: string, lang: Lang, firstName?: string | null) {
  const member = await getMemberByChatId(chatId);
  if (member) {
    await send(chatId, msg.memberWelcome(lang, member), { replyMarkup: memberKeyboard(lang) });
    await send(chatId, t(lang, "quick"), {
      replyMarkup: { inline_keyboard: dashboardButtons(lang) },
      silent: true,
    });
    return;
  }
  await send(chatId, msg.guestWelcome(lang, firstName), { replyMarkup: guestKeyboard(lang) });
  await send(chatId, t(lang, "guest.webPrompt"), {
    replyMarkup: { inline_keyboard: connectTelegramButtons(lang) },
    silent: true,
  });
}

async function showProfile(chatId: string, lang: Lang) {
  const member = await getMemberByChatId(chatId);
  if (!member) {
    await send(chatId, msg.guestProfile(lang), {
      replyMarkup: { inline_keyboard: connectTelegramButtons(lang) },
    });
    return;
  }
  const [stats, groups] = await Promise.all([
    getDashboardStats(member.userId),
    countGroups(member.userId),
  ]);
  await send(chatId, msg.memberProfile(lang, member, stats, groups), {
    replyMarkup: { inline_keyboard: dashboardButtons(lang) },
  });
}

async function requireMember(chatId: string, lang: Lang) {
  const member = await getMemberByChatId(chatId);
  if (!member) {
    await send(chatId, t(lang, "need.member"), {
      replyMarkup: { inline_keyboard: connectTelegramButtons(lang) },
    });
  }
  return member;
}

async function showStats(chatId: string, lang: Lang) {
  const member = await requireMember(chatId, lang);
  if (!member) return;
  await send(chatId, await buildStats(lang, member.userId, "today"), {
    replyMarkup: statsKeyboard(lang, "today"),
  });
}

async function showActivity(chatId: string, lang: Lang) {
  const member = await requireMember(chatId, lang);
  if (!member) return;
  const items = await getRecentActivity(member.userId, 8);
  await send(chatId, msg.activityMessage(lang, items));
}

async function showRepos(chatId: string, lang: Lang) {
  const member = await requireMember(chatId, lang);
  if (!member) return;
  await send(chatId, msg.reposMessage(lang, await getMonitoredRepos(member.userId)));
}

async function showTop(chatId: string, lang: Lang) {
  const member = await requireMember(chatId, lang);
  if (!member) return;
  await send(chatId, msg.topMessage(lang, await getTopData(member.userId)));
}

async function showNotifications(chatId: string, lang: Lang) {
  const member = await requireMember(chatId, lang);
  if (!member) return;
  await send(chatId, msg.notificationsMessage(lang, member.notificationsEnabled), {
    replyMarkup: notificationsKeyboard(lang, member.notificationsEnabled),
  });
}

async function showHelp(chatId: string, lang: Lang) {
  const member = await getMemberByChatId(chatId);
  await send(chatId, msg.helpMessage(lang, Boolean(member)), {
    replyMarkup: { inline_keyboard: websiteButtons(lang) },
  });
}

async function showLanguage(chatId: string, lang: Lang) {
  await send(chatId, msg.languageMessage(lang), {
    replyMarkup: { inline_keyboard: languageButtons() },
  });
}

async function handleStartWithToken(chatId: string, token: string, lang: Lang, from?: From) {
  const result = await completeLink(token, {
    chatId,
    username: from?.username ?? null,
    firstName: from?.first_name ?? null,
  });

  if (result.ok) {
    await send(chatId, msg.linkedSuccess(lang, from?.first_name), {
      replyMarkup: memberKeyboard(lang),
    });
    await send(chatId, t(lang, "quick"), {
      replyMarkup: { inline_keyboard: dashboardButtons(lang) },
      silent: true,
    });
  } else if (result.reason === "chat_in_use") {
    await send(chatId, t(lang, "err.inUse"));
  } else {
    await send(chatId, t(lang, "err.badLink"), {
      replyMarkup: { inline_keyboard: connectTelegramButtons(lang) },
    });
  }
}

/* ------------------------------ groups & channels ---------------------------------- */

async function handleGroupMessage(
  message: NonNullable<TelegramUpdate["message"]>,
  command: string | null,
  arg: string | undefined
) {
  const chatId = String(message.chat.id);
  const lang = await resolveLang(chatId, message.from?.language_code);

  if (command === "/start" && arg) {
    const result = await completeGroupLink(arg, {
      chatId,
      type: message.chat.type,
      title: message.chat.title ?? null,
    });
    await send(chatId, t(lang, result.ok ? "group.linked" : "group.badLink"));
    return;
  }

  if (command === "/stop" || command === "/status") {
    const admin = message.from?.id ? await isChatAdmin(chatId, message.from.id) : false;
    if (!admin) {
      await send(chatId, t(lang, "group.adminOnly"), { silent: true });
      return;
    }
    if (command === "/stop") {
      const removed = await removeGroupByChatId(chatId);
      await send(chatId, t(lang, removed ? "group.stopped" : "group.notLinked"));
    } else {
      await send(chatId, t(lang, "group.status"), { silent: true });
    }
  }
}

/** Channels have no senders; an admin posts `/link <token>` to connect one. */
async function handleChannelPost(post: NonNullable<TelegramUpdate["channel_post"]>) {
  const text = post.text?.trim();
  if (!text) return;
  const [command, arg] = text.split(/\s+/, 2);
  if (command.split("@")[0].toLowerCase() !== "/link" || !arg) return;

  const chatId = String(post.chat.id);
  const result = await completeGroupLink(arg, {
    chatId,
    type: "channel",
    title: post.chat.title ?? null,
  });
  const lang = await resolveLang(chatId, null);
  await send(chatId, t(lang, result.ok ? "group.linked" : "group.badLink"));
}

/* ------------------------------ routing ---------------------------------- */

async function handleMessage(update: NonNullable<TelegramUpdate["message"]>) {
  if (!update.text) return;

  const text = update.text.trim();
  const [command, arg] = text.split(/\s+/, 2);
  const cmd = command.startsWith("/") ? command.split("@")[0].toLowerCase() : null;

  if (update.chat.type === "group" || update.chat.type === "supergroup") {
    return handleGroupMessage(update, cmd, arg);
  }
  if (update.chat.type !== "private") return;

  const chatId = String(update.chat.id);
  const lang = await resolveLang(chatId, update.from?.language_code);
  const button = matchButton(text);

  if (cmd === "/start") {
    if (arg) return handleStartWithToken(chatId, arg, lang, update.from);
    return showStart(chatId, lang, update.from?.first_name);
  }

  // Commands are intentionally not supported (except /start, which Telegram
  // needs for deep links): everything is reachable from the menu buttons.
  switch (button) {
    case "btn.profile":
      return showProfile(chatId, lang);
    case "btn.connect":
      return void (await send(chatId, msg.connectGithubMessage(lang), {
        replyMarkup: { inline_keyboard: connectGithubButtons(lang) },
      }));
    case "btn.stats":
      return showStats(chatId, lang);
    case "btn.activity":
      return showActivity(chatId, lang);
    case "btn.repos":
      return showRepos(chatId, lang);
    case "btn.top":
      return showTop(chatId, lang);
    case "btn.notifications":
      return showNotifications(chatId, lang);
    case "btn.language":
      return showLanguage(chatId, lang);
    case "btn.help":
      return showHelp(chatId, lang);
    case "btn.how":
      return void (await send(chatId, msg.howItWorks(lang), {
        replyMarkup: { inline_keyboard: websiteButtons(lang) },
      }));
  }

  const member = await getMemberByChatId(chatId);
  await send(chatId, t(lang, "unknown"), {
    replyMarkup: member ? memberKeyboard(lang) : guestKeyboard(lang),
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
  const lang = await resolveLang(chatId, query.from.language_code);

  // Language switch works for everyone (linked or not).
  const newLang = LANGS.find((l) => CB.setLang(l) === query.data);
  if (newLang) {
    await setChatLanguage(chatId, newLang);
    await answerCallbackQuery(query.id, t(newLang, "lang.changed"));
    const member = await getMemberByChatId(chatId);
    // Re-send the menu so the bottom keyboard labels switch language too.
    await send(chatId, t(newLang, "lang.changed"), {
      replyMarkup: member ? memberKeyboard(newLang) : guestKeyboard(newLang),
      silent: true,
    });
    return;
  }

  const member = await getMemberByChatId(chatId);
  if (!member) {
    await answerCallbackQuery(query.id, t(lang, "toast.notConnected"));
    return;
  }

  if (query.data === CB.toggleNotifications) {
    const enabled = !member.notificationsEnabled;
    await setNotificationsByChatId(chatId, enabled);
    await answerCallbackQuery(query.id, t(lang, enabled ? "notif.toastOn" : "notif.toastOff"));
    await editTelegramMessage(
      chatId,
      message.message_id,
      msg.notificationsMessage(lang, enabled),
      notificationsKeyboard(lang, enabled)
    );
    return;
  }

  const range = (["today", "7d", "30d"] as const).find((r) => CB.statsRange(r) === query.data);
  if (range) {
    await answerCallbackQuery(query.id);
    await editTelegramMessage(
      chatId,
      message.message_id,
      await buildStats(lang, member.userId, range),
      statsKeyboard(lang, range)
    );
    return;
  }

  await answerCallbackQuery(query.id);
}

export async function handleTelegramUpdate(update: TelegramUpdate) {
  if (update.message) await handleMessage(update.message);
  else if (update.channel_post) await handleChannelPost(update.channel_post);
  else if (update.callback_query) await handleCallback(update.callback_query);
}
