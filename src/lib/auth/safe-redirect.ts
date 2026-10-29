/**
 * Validates a post-login redirect target taken from the query string.
 * Only same-site absolute paths are accepted ("/team/join/abc"); anything
 * that could leave the site ("//evil.com", "https://…", "/\evil") is
 * rejected so the login page can't be abused as an open redirect.
 */
export function safeRedirectPath(value: string | string[] | undefined): string | null {
  if (typeof value !== "string") return null;
  if (value.length === 0 || value.length > 300) return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  if (/[\u0000-\u001f]/.test(value)) return null;
  if (value.startsWith("/login") || value.startsWith("/register")) return null;
  return value;
}
