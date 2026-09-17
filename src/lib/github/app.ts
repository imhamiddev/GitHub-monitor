import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";

/**
 * GitHub App credentials. GITHUB_APP_PRIVATE_KEY is the PEM contents;
 * when stored as a Vercel env var, newlines are typically escaped as
 * literal "\n" — we un-escape them here.
 */
function getAppCredentials() {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const clientId = process.env.GITHUB_APP_CLIENT_ID;
  const clientSecret = process.env.GITHUB_APP_CLIENT_SECRET;

  if (!appId || !privateKey || !clientId || !clientSecret) {
    throw new Error(
      "Missing GitHub App credentials. Check GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY, " +
        "GITHUB_APP_CLIENT_ID, GITHUB_APP_CLIENT_SECRET."
    );
  }

  return { appId, privateKey, clientId, clientSecret };
}

/**
 * An Octokit instance authenticated as the GitHub App itself (JWT).
 * Used for app-level endpoints, e.g. exchanging the OAuth callback
 * code, or listing installations.
 */
export function getAppOctokit(): Octokit {
  const { appId, privateKey, clientId, clientSecret } = getAppCredentials();
  return new Octokit({
    authStrategy: createAppAuth,
    auth: { appId, privateKey, clientId, clientSecret },
  });
}

/**
 * An Octokit instance authenticated as a specific installation
 * (i.e. scoped to the repos that installation was granted access to).
 * Installation tokens are short-lived (~1h); Octokit's auth strategy
 * handles refreshing them transparently within a single instance's
 * lifetime, but since serverless functions are short-lived anyway we
 * simply create a fresh instance per invocation.
 */
export function getInstallationOctokit(installationId: number): Octokit {
  const { appId, privateKey, clientId, clientSecret } = getAppCredentials();
  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId,
      privateKey,
      clientId,
      clientSecret,
      installationId,
    },
  });
}

/**
 * Builds the URL to start a GitHub App installation flow, optionally
 * scoped to "new" installations. GitHub App installation (choosing
 * which repos to grant access to) is a separate step from OAuth user
 * identification, but for this product we drive users through the
 * install flow directly, then read the resulting installation_id
 * from the callback.
 */
export function getAppInstallUrl(state: string): string {
  const appSlug = process.env.GITHUB_APP_SLUG;
  if (!appSlug) throw new Error("GITHUB_APP_SLUG is not set");

  const url = new URL(`https://github.com/apps/${appSlug}/installations/new`);
  url.searchParams.set("state", state);
  return url.toString();
}
