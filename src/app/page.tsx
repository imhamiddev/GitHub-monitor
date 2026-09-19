import Link from "next/link";
import {
  ActivityIcon,
  FilterIcon,
  GitPullRequestIcon,
  StarIcon,
  UsersIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const features = [
  {
    icon: ActivityIcon,
    title: "Real-time activity",
    description:
      "See stars, forks, issues, pull requests, and releases across all your repositories the moment they happen.",
  },
  {
    icon: FilterIcon,
    title: "Fine-grained tracking",
    description:
      "Choose exactly which event types matter for each repository, and keep your activity feed free of noise.",
  },
  {
    icon: UsersIcon,
    title: "Follower tracking",
    description:
      "Know when someone new follows you on GitHub, even though GitHub itself doesn't send that event.",
  },
  {
    icon: GitPullRequestIcon,
    title: "Pull request insights",
    description:
      "Track open, merged, and closed pull requests without leaving your dashboard.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4 md:px-10">
        <div className="flex items-center gap-2 font-medium">
          <Logo className="size-8" />
          GitHub Monitor
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Get started</Link>
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center px-6 py-16 md:py-24">
        <div className="flex max-w-2xl flex-col items-center gap-6 text-center">
          <div className="bg-muted text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium">
            <StarIcon className="size-3.5" />
            Built for maintainers and small teams
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-5xl">
            Everything happening in your repos, in one place
          </h1>
          <p className="text-muted-foreground text-lg text-balance">
            GitHub Monitor watches your repositories and followers so you
            don&apos;t have to keep checking manually — stars, issues, pull
            requests, releases, and more.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/register">Start monitoring — it&apos;s free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">I already have an account</Link>
            </Button>
          </div>
        </div>

        <div className="mt-20 grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <feature.icon className="text-primary size-6" />
                <CardTitle className="mt-2 text-base">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <footer className="text-muted-foreground border-t px-6 py-6 text-center text-sm">
        GitHub Monitor — connects via a GitHub App, never stores your
        password on GitHub&apos;s behalf.
      </footer>
    </div>
  );
}
