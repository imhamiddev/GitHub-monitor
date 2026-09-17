import type { LucideIcon } from "lucide-react";
import {
  CircleDotIcon,
  GitBranchIcon,
  GitForkIcon,
  GitPullRequestIcon,
  MessageSquareIcon,
  RocketIcon,
  SettingsIcon,
  StarIcon,
  UserPlusIcon,
  UserMinusIcon,
} from "lucide-react";

export type EventDisplay = {
  icon: LucideIcon;
  label: string;
  colorClassName: string;
};

/**
 * Maps a stored event's (eventType, action) to a display icon/label.
 * Falls back to a generic label if the specific action isn't mapped.
 */
export function getEventDisplay(eventType: string, action: string | null): EventDisplay {
  switch (eventType) {
    case "push":
      return { icon: GitBranchIcon, label: "New Commit", colorClassName: "text-success" };
    case "star":
      return { icon: StarIcon, label: "New Star", colorClassName: "text-warning" };
    case "fork":
      return { icon: GitForkIcon, label: "New Fork", colorClassName: "text-primary" };
    case "pull_request":
      return {
        icon: GitPullRequestIcon,
        label:
          action === "merged"
            ? "Pull Request Merged"
            : action === "closed"
              ? "Pull Request Closed"
              : action === "reopened"
                ? "Pull Request Reopened"
                : action === "review_requested"
                  ? "Review Requested"
                  : "New Pull Request",
        colorClassName: "text-primary",
      };
    case "pull_request_review":
      return {
        icon: GitPullRequestIcon,
        label: "Pull Request Review",
        colorClassName: "text-primary",
      };
    case "issues":
      return {
        icon: CircleDotIcon,
        label:
          action === "closed"
            ? "Issue Closed"
            : action === "reopened"
              ? "Issue Reopened"
              : action === "assigned"
                ? "Issue Assigned"
                : action === "labeled"
                  ? "Issue Labeled"
                  : "New Issue",
        colorClassName: "text-destructive",
      };
    case "issue_comment":
      return {
        icon: MessageSquareIcon,
        label: "New Comment",
        colorClassName: "text-muted-foreground",
      };
    case "release":
      return { icon: RocketIcon, label: "New Release", colorClassName: "text-primary" };
    case "create":
    case "delete":
      return {
        icon: GitBranchIcon,
        label: eventType === "create" ? "Branch Created" : "Branch Deleted",
        colorClassName: "text-muted-foreground",
      };
    case "workflow_run":
      return {
        icon: SettingsIcon,
        label:
          action === "failure"
            ? "Workflow Failed"
            : action === "cancelled"
              ? "Workflow Cancelled"
              : action === "started"
                ? "Workflow Started"
                : "Workflow Succeeded",
        colorClassName:
          action === "failure"
            ? "text-destructive"
            : action === "success"
              ? "text-success"
              : "text-muted-foreground",
      };
    case "deployment":
    case "deployment_status":
      return {
        icon: RocketIcon,
        label: action === "failure" ? "Deployment Failed" : "Deployment",
        colorClassName: action === "failure" ? "text-destructive" : "text-success",
      };
    case "follower":
      return {
        icon: action === "unfollowed" ? UserMinusIcon : UserPlusIcon,
        label: action === "unfollowed" ? "Unfollow" : "New Follower",
        colorClassName: action === "unfollowed" ? "text-muted-foreground" : "text-primary",
      };
    default:
      return { icon: CircleDotIcon, label: eventType, colorClassName: "text-muted-foreground" };
  }
}
