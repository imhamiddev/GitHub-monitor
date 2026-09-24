import {
  ActivityIcon,
  FilterIcon,
  GitPullRequestIcon,
  UsersIcon,
} from "lucide-react";

import { LandingHeader } from "@/components/landing/landing-header";
import { HeroSection } from "@/components/landing/hero-section";
import { FeatureGrid, type Feature } from "@/components/landing/feature-grid";
import { DemoCta } from "@/components/landing/demo-cta";

const features: Feature[] = [
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
      <LandingHeader />

      <main className="flex flex-1 flex-col items-center px-6 py-16 md:py-24">
        <HeroSection />
        <FeatureGrid features={features} />
        <DemoCta />
      </main>

      <footer className="text-muted-foreground border-t px-6 py-6 text-center text-sm">
        GitHub Monitor — connects via a GitHub App, never stores your
        password on GitHub&apos;s behalf.
      </footer>
    </div>
  );
}
