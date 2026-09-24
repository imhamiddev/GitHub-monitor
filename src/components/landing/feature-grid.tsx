"use client";

import { motion } from "motion/react";
import {
  ActivityIcon,
  FilterIcon,
  GitPullRequestIcon,
  UsersIcon,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/motion";

// Defined here (not passed as a prop) because icon components are
// functions, and functions can't cross the server -> client boundary as
// props — only as JSX already rendered on the server, or defined locally
// on the client like this.
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

export function FeatureGrid() {
  return (
    <motion.div
      variants={staggerContainer(0.06)}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      className="mt-20 grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {features.map((feature) => (
        <motion.div key={feature.title} variants={fadeUp}>
          <Card className="group h-full transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-md">
            <CardHeader>
              <feature.icon className="text-primary size-6 transition-transform duration-200 ease-out group-hover:scale-110" />
              <CardTitle className="mt-2 text-base">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
