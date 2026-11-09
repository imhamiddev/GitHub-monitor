"use client";

import Link from "next/link";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { fadeUp, staggerContainer } from "@/lib/motion";

export function HeroSection() {
  return (
    <motion.div
      variants={staggerContainer(0.08)}
      initial="hidden"
      animate="show"
      className="flex max-w-xl flex-col items-start gap-6"
    >
      <motion.h1
        variants={fadeUp}
        className="text-4xl font-medium text-balance md:text-5xl"
      >
        Stars, issues, pull requests and followers across your repositories, in one feed
      </motion.h1>

      <motion.p variants={fadeUp} className="text-muted-foreground text-lg text-pretty">
        GitHub Monitor watches your repositories and followers so you don&apos;t
        have to keep checking manually.
      </motion.p>

      <motion.div variants={fadeUp} className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg" asChild>
          <Link href="/register">Start monitoring</Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/demo">View live demo</Link>
        </Button>
      </motion.div>
    </motion.div>
  );
}
