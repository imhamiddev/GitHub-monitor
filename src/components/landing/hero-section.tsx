"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRightIcon, PlayCircleIcon, StarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/landing/magnetic";
import { fadeUp, staggerContainer } from "@/lib/motion";

export function HeroSection() {
  return (
    <motion.div
      variants={staggerContainer(0.08)}
      initial="hidden"
      animate="show"
      className="flex max-w-2xl flex-col items-center gap-6 text-center"
    >
      <motion.div
        variants={fadeUp}
        className="bg-muted text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
      >
        <StarIcon className="size-3.5" />
        Built for maintainers and small teams
      </motion.div>

      <motion.h1
        variants={fadeUp}
        className="text-4xl font-semibold tracking-tight text-balance md:text-5xl"
      >
        Everything happening in your repos, in one place
      </motion.h1>

      <motion.p variants={fadeUp} className="text-muted-foreground text-lg text-balance">
        GitHub Monitor watches your repositories and followers so you
        don&apos;t have to keep checking manually — stars, issues, pull
        requests, releases, and more.
      </motion.p>

      <motion.div variants={fadeUp} className="flex flex-col gap-3 sm:flex-row">
        <Magnetic>
          <Button size="lg" asChild className="group">
            <Link href="/register">
              Start monitoring — it&apos;s free
              <ArrowRightIcon className="transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </Magnetic>
        <Button size="lg" variant="outline" asChild className="group">
          <Link href="/demo">
            <PlayCircleIcon className="transition-transform duration-200 ease-out group-hover:scale-110" />
            View live demo
          </Link>
        </Button>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Link
          href="/login"
          className="text-muted-foreground group relative text-sm"
        >
          I already have an account
          <span className="bg-muted-foreground absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 transition-transform duration-200 ease-out group-hover:scale-x-100" />
        </Link>
      </motion.div>
    </motion.div>
  );
}
