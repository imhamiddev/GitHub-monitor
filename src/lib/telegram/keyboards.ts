import type { InlineButton, ReplyKeyboard } from "@/lib/telegram/api";
import { t, type Lang, type MessageKey } from "@/lib/telegram/i18n";

export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export const CB = {
  toggleNotifications: "notif:toggle",
  statsRange: (range: "today" | "7d" | "30d") => `stats:${range}`,
  setLang: (lang: Lang) => `lang:${lang}`,
} as const;

const btn = (lang: Lang, key: MessageKey, style: "primary" | "success" | "danger" = "primary") => ({
  text: t(lang, key),
  style,
});

/** Bottom keyboard for users who haven't linked their account yet. */
export function guestKeyboard(lang: Lang): ReplyKeyboard {
  return {
    keyboard: [
      [btn(lang, "btn.profile"), btn(lang, "btn.connect", "success")],
      [btn(lang, "btn.how"), btn(lang, "btn.language")],
      [btn(lang, "btn.help")],
    ],
    resize_keyboard: true,
    is_persistent: true,
    input_field_placeholder: t(lang, "placeholder"),
  };
}

/** Bottom keyboard for linked users. */
export function memberKeyboard(lang: Lang): ReplyKeyboard {
  return {
    keyboard: [
      [btn(lang, "btn.profile"), btn(lang, "btn.stats", "success")],
      [btn(lang, "btn.activity"), btn(lang, "btn.top")],
      [btn(lang, "btn.repos"), btn(lang, "btn.notifications", "success")],
      [btn(lang, "btn.language"), btn(lang, "btn.help")],
    ],
    resize_keyboard: true,
    is_persistent: true,
    input_field_placeholder: t(lang, "placeholder"),
  };
}

export function websiteButtons(lang: Lang): InlineButton[][] {
  return [[{ text: t(lang, "ib.openSite"), url: getSiteUrl(), style: "primary" }]];
}

export function connectGithubButtons(lang: Lang): InlineButton[][] {
  const site = getSiteUrl();
  return [
    [{ text: t(lang, "ib.connectGithub"), url: `${site}/settings/github`, style: "success" }],
    [{ text: t(lang, "ib.openSite"), url: site, style: "primary" }],
  ];
}

export function connectTelegramButtons(lang: Lang): InlineButton[][] {
  const site = getSiteUrl();
  return [
    [{ text: t(lang, "ib.signIn"), url: `${site}/login`, style: "success" }],
    [{ text: t(lang, "ib.linkChat"), url: `${site}/settings/telegram`, style: "primary" }],
  ];
}

export function dashboardButtons(lang: Lang): InlineButton[][] {
  const site = getSiteUrl();
  return [
    [
      { text: t(lang, "ib.dashboard"), url: `${site}/dashboard`, style: "primary" },
      { text: t(lang, "ib.settings"), url: `${site}/settings/telegram`, style: "primary" },
    ],
  ];
}

export function fixConnectionButtons(lang: Lang): InlineButton[][] {
  return [[{ text: t(lang, "ib.fixConnection"), url: `${getSiteUrl()}/settings/github`, style: "danger" }]];
}

export function languageButtons(): InlineButton[][] {
  return [
    [
      { text: "🇬🇧 English", callback_data: CB.setLang("en"), style: "primary" },
      { text: "🇮🇷 فارسی", callback_data: CB.setLang("fa"), style: "primary" },
    ],
  ];
}
