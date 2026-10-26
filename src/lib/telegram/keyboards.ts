import type { InlineButton, ReplyKeyboard } from "@/lib/telegram/api";

export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

/** Labels of the persistent (bottom) keyboard — also used to route taps. */
export const BTN = {
  profile: "👤 Profile",
  connectGithub: "🔗 Connect GitHub",
  howItWorks: "ℹ️ How it works",
  stats: "📊 Statistics",
  activity: "🕒 Recent activity",
  repos: "📁 Repositories",
  notifications: "🔔 Notifications",
  help: "❓ Help",
} as const;

export type ButtonLabel = (typeof BTN)[keyof typeof BTN];

/** Bottom keyboard for users who haven't linked their account yet. */
export function guestKeyboard(): ReplyKeyboard {
  return {
    keyboard: [
      [{ text: BTN.profile }, { text: BTN.connectGithub }],
      [{ text: BTN.howItWorks }, { text: BTN.help }],
    ],
    resize_keyboard: true,
    is_persistent: true,
    input_field_placeholder: "Choose an option…",
  };
}

/** Bottom keyboard for linked users. */
export function memberKeyboard(): ReplyKeyboard {
  return {
    keyboard: [
      [{ text: BTN.profile }, { text: BTN.stats }],
      [{ text: BTN.activity }, { text: BTN.repos }],
      [{ text: BTN.notifications }, { text: BTN.help }],
    ],
    resize_keyboard: true,
    is_persistent: true,
    input_field_placeholder: "Choose an option…",
  };
}

export const CB = {
  toggleNotifications: "notif:toggle",
  refreshStats: "stats:refresh",
  statsRange: (range: "today" | "7d" | "30d") => `stats:${range}`,
} as const;

export function websiteButtons(): InlineButton[][] {
  const site = getSiteUrl();
  return [[{ text: "🌐 Open website", url: site }]];
}

export function connectGithubButtons(): InlineButton[][] {
  const site = getSiteUrl();
  return [
    [{ text: "🔗 Connect GitHub on the website", url: `${site}/settings/github` }],
    [{ text: "🌐 Open website", url: site }],
  ];
}

export function connectTelegramButtons(): InlineButton[][] {
  const site = getSiteUrl();
  return [
    [{ text: "🔐 Sign in / Create account", url: `${site}/login` }],
    [{ text: "🤖 Link this chat", url: `${site}/settings/telegram` }],
  ];
}

export function dashboardButtons(): InlineButton[][] {
  const site = getSiteUrl();
  return [
    [
      { text: "📊 Dashboard", url: `${site}/dashboard` },
      { text: "⚙️ Settings", url: `${site}/settings/telegram` },
    ],
  ];
}
