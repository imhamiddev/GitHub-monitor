/**
 * Minimal Telegram Bot API client (no dependency — plain fetch).
 * The bot token is read from TELEGRAM_BOT_TOKEN and never leaves the server.
 */

const DEFAULT_BOT_USERNAME = "github_monitorbot";

export function getBotUsername(): string {
  return (process.env.TELEGRAM_BOT_USERNAME || DEFAULT_BOT_USERNAME).replace(/^@/, "");
}

export function buildBotLink(startToken: string): string {
  return `https://t.me/${getBotUsername()}?start=${encodeURIComponent(startToken)}`;
}

export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN);
}

/**
 * Button colour (Bot API 9.4+): "primary" = blue, "success" = green,
 * "danger" = red. Older Telegram clients ignore it and show the default.
 */
export type ButtonStyle = "primary" | "success" | "danger";

export type InlineButton = { text: string; style?: ButtonStyle } & (
  | { url: string }
  | { callback_data: string }
);

export type KeyboardButton = { text: string; style?: ButtonStyle };

export type ReplyKeyboard = {
  keyboard: KeyboardButton[][];
  resize_keyboard: boolean;
  is_persistent: boolean;
  input_field_placeholder?: string;
};

export type ReplyMarkup =
  | { inline_keyboard: InlineButton[][] }
  | ReplyKeyboard
  | { remove_keyboard: true };

export type SendResult =
  | { ok: true }
  | { ok: false; error: string; blocked: boolean };

async function callApi<T>(method: string, body: Record<string, unknown>) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");

  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = (await response.json().catch(() => null)) as {
    ok: boolean;
    result?: T;
    description?: string;
    error_code?: number;
  } | null;

  return { status: response.status, data };
}

/** Sends an HTML-formatted message. `blocked` = user blocked/removed the bot. */
export async function sendTelegramMessage(
  chatId: string,
  html: string,
  options: { silent?: boolean; replyMarkup?: ReplyMarkup } = {}
): Promise<SendResult> {
  try {
    const { status, data } = await callApi("sendMessage", {
      chat_id: chatId,
      text: html,
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
      disable_notification: options.silent ?? false,
      ...(options.replyMarkup ? { reply_markup: options.replyMarkup } : {}),
    });
    if (data?.ok) return { ok: true };
    return {
      ok: false,
      error: data?.description ?? `HTTP ${status}`,
      blocked: status === 403,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
      blocked: false,
    };
  }
}

export async function setTelegramWebhook(url: string, secretToken: string) {
  return callApi("setWebhook", {
    url,
    secret_token: secretToken,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: false,
  });
}

/** Stops the loading spinner on an inline button; optional toast text. */
export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  try {
    await callApi("answerCallbackQuery", { callback_query_id: callbackQueryId, text });
  } catch (error) {
    console.error("answerCallbackQuery failed:", error);
  }
}

/** Edits a previously sent message in place (used for toggles/refresh). */
export async function editTelegramMessage(
  chatId: string,
  messageId: number,
  html: string,
  replyMarkup?: { inline_keyboard: InlineButton[][] }
) {
  try {
    await callApi("editMessageText", {
      chat_id: chatId,
      message_id: messageId,
      text: html,
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    });
  } catch (error) {
    console.error("editMessageText failed:", error);
  }
}

/** Registers the "/" command menu shown in the bot's chat UI. */
export async function setTelegramCommands(commands: { command: string; description: string }[]) {
  return callApi("setMyCommands", { commands });
}
