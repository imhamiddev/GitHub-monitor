"use client";

import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/motion";

export type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function FeatureGrid({ features }: { features: Feature[] }) {
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
