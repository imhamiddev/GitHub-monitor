import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { githubEvent, notification, webhookDelivery } from "@/lib/db/schema";
import { WEBHOOK_EVENT_TO_CATEGORY } from "@/lib/github/events";
import { normalizeGithubEvent } from "@/lib/github/normalize";
import {
  findMonitoredRepositoryByGithubId,
  isEventCategoryEnabled,
} from "@/lib/github/repositories";
import { markInstallationRevoked } from "@/lib/github/installations";
import { getNotificationsEnabled } from "@/lib/notifications/settings";
import { verifyGithubWebhookSignature } from "@/lib/security/webhook";

export const runtime = "nodejs";

/**
 * GitHub retries webhook deliveries on failure/timeout, and in rare
 * cases can send the same delivery more than once even without a
 * failure. X-GitHub-Delivery is a stable UUID per delivery attempt
 * group, so we use it (not the payload contents) as our idempotency
 * key — a unique constraint on webhookDelivery gives us an atomic,
 * race-safe check even if two requests arrive concurrently.
 */
async function alreadyProcessed(deliveryId: string): Promise<boolean> {
  const existing = await db.query.webhookDelivery.findFirst({
    where: (row, { eq }) => eq(row.githubDeliveryId, deliveryId),
  });
  return !!existing;
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("GITHUB_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  const eventType = request.headers.get("x-github-event");
  const deliveryId = request.headers.get("x-github-delivery");

  if (!verifyGithubWebhookSignature(rawBody, signature, webhookSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (!eventType || !deliveryId) {
    return NextResponse.json({ error: "Missing required headers" }, { status: 400 });
  }

  // Acknowledge (2xx) even for events we don't act on, so GitHub
  // doesn't keep retrying a delivery type we intentionally ignore.
  if (eventType === "ping") {
    return NextResponse.json({ ok: true, message: "pong" });
  }

  if (await alreadyProcessed(deliveryId)) {
    return NextResponse.json({ ok: true, deduped: true });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  // GitHub App installation lifecycle events — track suspensions so we
  // stop attempting API calls with a dead installation token.
  if (eventType === "installation" || eventType === "installation_repositories") {
    await handleInstallationLifecycleEvent(payload);
    await recordDelivery(deliveryId, eventType);
    return NextResponse.json({ ok: true });
  }

  const category = WEBHOOK_EVENT_TO_CATEGORY[eventType];
  if (!category) {
    // Not an event type we track (e.g. "meta", "security_advisory").
    await recordDelivery(deliveryId, eventType);
    return NextResponse.json({ ok: true, ignored: true });
  }

  const githubRepoId = extractRepoId(payload);
  if (githubRepoId === null) {
    await recordDelivery(deliveryId, eventType);
    return NextResponse.json({ ok: true, ignored: true });
  }

  const repo = await findMonitoredRepositoryByGithubId(githubRepoId);
  if (!repo) {
    // Repository isn't monitored (or webhook arrived before our sync
    // caught up) — nothing to do, but still acknowledge.
    await recordDelivery(deliveryId, eventType);
    return NextResponse.json({ ok: true, unmonitored: true });
  }

  const categoryEnabled = await isEventCategoryEnabled(repo.id, category);
  if (!categoryEnabled) {
    await recordDelivery(deliveryId, eventType);
    return NextResponse.json({ ok: true, categoryDisabled: true });
  }

  const normalized = normalizeGithubEvent(eventType, payload);
  if (!normalized) {
    // Recognized event type, but this particular action isn't one we
    // display (e.g. an issue "unlabeled" action).
    await recordDelivery(deliveryId, eventType);
    return NextResponse.json({ ok: true, ignored: true });
  }

  const eventId = randomUUID();
  await db.insert(githubEvent).values({
    id: eventId,
    repositoryId: repo.id,
    githubDeliveryId: deliveryId,
    eventType,
    action: normalized.action,
    actorLogin: normalized.actorLogin,
    actorAvatarUrl: normalized.actorAvatarUrl,
    summary: normalized.summary,
    url: normalized.url,
  });

  // Fan out a notification to the repo owner (the user who owns this
  // installation). Multi-user shared installations aren't modeled yet,
  // so this is currently always exactly one recipient.
  const installation = await db.query.githubInstallation.findFirst({
    where: (row, { eq }) => eq(row.id, repo.installationId),
  });

  if (installation) {
    const notificationsEnabled = await getNotificationsEnabled(installation.userId);
    if (notificationsEnabled) {
      await db.insert(notification).values({
        id: randomUUID(),
        userId: installation.userId,
        eventId,
      });
    }
  }

  await recordDelivery(deliveryId, eventType);
  return NextResponse.json({ ok: true });
}

async function recordDelivery(deliveryId: string, eventType: string) {
  try {
    await db.insert(webhookDelivery).values({
      id: randomUUID(),
      githubDeliveryId: deliveryId,
      eventType,
    });
  } catch {
    // Unique constraint race: another concurrent request for the same
    // delivery already recorded it. Safe to ignore.
  }
}

function extractRepoId(payload: unknown): number | null {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "repository" in payload &&
    typeof (payload as { repository?: unknown }).repository === "object" &&
    (payload as { repository?: { id?: unknown } }).repository !== null
  ) {
    const id = (payload as { repository: { id?: unknown } }).repository.id;
    return typeof id === "number" ? id : null;
  }
  return null;
}

async function handleInstallationLifecycleEvent(payload: unknown) {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("action" in payload) ||
    !("installation" in payload)
  ) {
    return;
  }

  const action = (payload as { action: unknown }).action;
  const installation = (payload as { installation: { id?: unknown } }).installation;
  const installationId =
    typeof installation === "object" && installation !== null
      ? installation.id
      : null;

  if (typeof installationId !== "number") return;

  if (action === "suspend" || action === "deleted") {
    await markInstallationRevoked(installationId);
  }
}
