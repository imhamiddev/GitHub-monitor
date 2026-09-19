import type {
  CreateEvent,
  DeleteEvent,
  DeploymentEvent,
  DeploymentStatusEvent,
  ForkEvent,
  IssueCommentEvent,
  IssuesEvent,
  PullRequestEvent,
  PullRequestReviewEvent,
  PushEvent,
  ReleaseEvent,
  StarEvent,
  WorkflowRunEvent,
} from "@octokit/webhooks-types";

export type NormalizedEvent = {
  action: string | null;
  actorLogin: string | null;
  actorAvatarUrl: string | null;
  summary: Record<string, unknown>;
  url: string | null;
};

/**
 * Normalizes a raw webhook payload for a given GitHub event type into
 * a small, display-ready summary. Returns null for payloads we don't
 * have a normalizer for (caller should skip storing an event in that
 * case, though the webhook itself is still acknowledged).
 */
export function normalizeGithubEvent(
  eventType: string,
  payload: unknown
): NormalizedEvent | null {
  switch (eventType) {
    case "push":
      return normalizePush(payload as PushEvent);
    case "star":
      return normalizeStar(payload as StarEvent);
    case "fork":
      return normalizeFork(payload as ForkEvent);
    case "pull_request":
      return normalizePullRequest(payload as PullRequestEvent);
    case "pull_request_review":
      return normalizePullRequestReview(payload as PullRequestReviewEvent);
    case "issues":
      return normalizeIssue(payload as IssuesEvent);
    case "issue_comment":
      return normalizeIssueComment(payload as IssueCommentEvent);
    case "release":
      return normalizeRelease(payload as ReleaseEvent);
    case "create":
      return normalizeCreate(payload as CreateEvent);
    case "delete":
      return normalizeDelete(payload as DeleteEvent);
    case "workflow_run":
      return normalizeWorkflowRun(payload as WorkflowRunEvent);
    case "deployment":
      return normalizeDeployment(payload as DeploymentEvent);
    case "deployment_status":
      return normalizeDeploymentStatus(payload as DeploymentStatusEvent);
    default:
      return null;
  }
}

function normalizePush(payload: PushEvent): NormalizedEvent | null {
  // Branch/tag deletions arrive as push events with a null "after" sha —
  // GitHub recommends handling this rather than treating it as commits.
  if (payload.deleted) return null;

  const branch = payload.ref.replace("refs/heads/", "");
  const commits = payload.commits ?? [];

  return {
    action: null,
    actorLogin: payload.sender?.login ?? null,
    actorAvatarUrl: payload.sender?.avatar_url ?? null,
    summary: {
      kind: "push",
      branch,
      commitCount: commits.length,
      commits: commits.slice(0, 10).map((c) => ({
        id: c.id.slice(0, 7),
        message: c.message.split("\n")[0],
        author: c.author?.name ?? "unknown",
      })),
    },
    url: payload.compare,
  };
}

function normalizeStar(payload: StarEvent): NormalizedEvent {
  return {
    action: payload.action,
    actorLogin: payload.sender?.login ?? null,
    actorAvatarUrl: payload.sender?.avatar_url ?? null,
    summary: {
      kind: "star",
      starsCount: payload.repository.stargazers_count,
    },
    url: payload.repository.html_url,
  };
}

function normalizeFork(payload: ForkEvent): NormalizedEvent {
  return {
    action: null,
    actorLogin: payload.sender?.login ?? null,
    actorAvatarUrl: payload.sender?.avatar_url ?? null,
    summary: {
      kind: "fork",
      forkFullName: payload.forkee.full_name,
    },
    url: payload.forkee.html_url,
  };
}

const RELEVANT_PR_ACTIONS = new Set([
  "opened",
  "reopened",
  "closed",
  "review_requested",
]);

function normalizePullRequest(payload: PullRequestEvent): NormalizedEvent | null {
  if (!RELEVANT_PR_ACTIONS.has(payload.action)) return null;

  const merged = payload.action === "closed" && payload.pull_request.merged;

  return {
    action: merged ? "merged" : payload.action,
    actorLogin: payload.sender?.login ?? null,
    actorAvatarUrl: payload.sender?.avatar_url ?? null,
    summary: {
      kind: "pull_request",
      number: payload.pull_request.number,
      title: payload.pull_request.title,
      baseBranch: payload.pull_request.base.ref,
    },
    url: payload.pull_request.html_url,
  };
}

function normalizePullRequestReview(
  payload: PullRequestReviewEvent
): NormalizedEvent | null {
  if (payload.action !== "submitted") return null;

  return {
    action: "review_submitted",
    actorLogin: payload.sender?.login ?? null,
    actorAvatarUrl: payload.sender?.avatar_url ?? null,
    summary: {
      kind: "pull_request_review",
      number: payload.pull_request.number,
      title: payload.pull_request.title,
      reviewState: payload.review.state,
    },
    url: payload.review.html_url,
  };
}

const RELEVANT_ISSUE_ACTIONS = new Set([
  "opened",
  "closed",
  "reopened",
  "assigned",
  "labeled",
]);

function normalizeIssue(payload: IssuesEvent): NormalizedEvent | null {
  if (!RELEVANT_ISSUE_ACTIONS.has(payload.action)) return null;

  return {
    action: payload.action,
    actorLogin: payload.sender?.login ?? null,
    actorAvatarUrl: payload.sender?.avatar_url ?? null,
    summary: {
      kind: "issue",
      number: payload.issue.number,
      title: payload.issue.title,
    },
    url: payload.issue.html_url,
  };
}

function normalizeIssueComment(payload: IssueCommentEvent): NormalizedEvent | null {
  if (payload.action !== "created") return null;

  return {
    action: "commented",
    actorLogin: payload.sender?.login ?? null,
    actorAvatarUrl: payload.sender?.avatar_url ?? null,
    summary: {
      kind: "issue_comment",
      issueNumber: payload.issue.number,
      issueTitle: payload.issue.title,
      commentExcerpt: payload.comment.body.slice(0, 140),
    },
    url: payload.comment.html_url,
  };
}

function normalizeRelease(payload: ReleaseEvent): NormalizedEvent | null {
  if (payload.action !== "published") return null;

  return {
    action: "published",
    actorLogin: payload.sender?.login ?? null,
    actorAvatarUrl: payload.sender?.avatar_url ?? null,
    summary: {
      kind: "release",
      tagName: payload.release.tag_name,
      name: payload.release.name,
    },
    url: payload.release.html_url,
  };
}

function normalizeCreate(payload: CreateEvent): NormalizedEvent | null {
  // Repository creation itself isn't a "branch change" — only tags/branches.
  if (payload.ref_type !== "branch" && payload.ref_type !== "tag") return null;

  return {
    action: "created",
    actorLogin: payload.sender?.login ?? null,
    actorAvatarUrl: payload.sender?.avatar_url ?? null,
    summary: {
      kind: "branch_change",
      refType: payload.ref_type,
      ref: payload.ref,
    },
    url: payload.repository?.html_url ?? null,
  };
}

function normalizeDelete(payload: DeleteEvent): NormalizedEvent | null {
  if (payload.ref_type !== "branch" && payload.ref_type !== "tag") return null;

  return {
    action: "deleted",
    actorLogin: payload.sender?.login ?? null,
    actorAvatarUrl: payload.sender?.avatar_url ?? null,
    summary: {
      kind: "branch_change",
      refType: payload.ref_type,
      ref: payload.ref,
    },
    url: payload.repository?.html_url ?? null,
  };
}

const RELEVANT_WORKFLOW_CONCLUSIONS = new Set([
  "success",
  "failure",
  "cancelled",
]);

function normalizeWorkflowRun(payload: WorkflowRunEvent): NormalizedEvent | null {
  const run = payload.workflow_run;

  // "requested"/"in_progress" = started; only report meaningful terminal
  // states plus the initial start, to avoid noisy duplicate entries.
  if (payload.action === "requested") {
    return {
      action: "started",
      actorLogin: payload.sender?.login ?? null,
      actorAvatarUrl: payload.sender?.avatar_url ?? null,
      summary: {
        kind: "workflow_run",
        workflowName: run.name,
        status: "started",
        branch: run.head_branch,
      },
      url: run.html_url,
    };
  }

  if (payload.action === "completed" && run.conclusion) {
    if (!RELEVANT_WORKFLOW_CONCLUSIONS.has(run.conclusion)) return null;

    return {
      action: run.conclusion,
      actorLogin: payload.sender?.login ?? null,
      actorAvatarUrl: payload.sender?.avatar_url ?? null,
      summary: {
        kind: "workflow_run",
        workflowName: run.name,
        status: run.conclusion,
        branch: run.head_branch,
      },
      url: run.html_url,
    };
  }

  return null;
}

function normalizeDeployment(payload: DeploymentEvent): NormalizedEvent {
  return {
    action: "created",
    actorLogin: payload.sender?.login ?? null,
    actorAvatarUrl: payload.sender?.avatar_url ?? null,
    summary: {
      kind: "deployment",
      environment: payload.deployment.environment,
      ref: payload.deployment.ref,
    },
    url: payload.repository.html_url,
  };
}

function normalizeDeploymentStatus(
  payload: DeploymentStatusEvent
): NormalizedEvent | null {
  const state = payload.deployment_status.state;
  if (state !== "success" && state !== "failure" && state !== "error") {
    return null;
  }

  return {
    action: state,
    actorLogin: payload.sender?.login ?? null,
    actorAvatarUrl: payload.sender?.avatar_url ?? null,
    summary: {
      kind: "deployment",
      environment: payload.deployment.environment,
      status: state,
    },
    url: payload.deployment_status.target_url || payload.repository.html_url,
  };
}
