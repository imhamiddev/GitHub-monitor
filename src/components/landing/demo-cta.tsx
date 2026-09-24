"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { PlayCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { revealUp, viewportOnce } from "@/lib/motion";

export function DemoCta() {
  return (
    <motion.div
      variants={revealUp}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      className="mt-16 flex w-full max-w-3xl flex-col items-center gap-4 rounded-xl border bg-muted/40 p-8 text-center"
    >
      <PlayCircleIcon className="text-primary size-8" />
      <h2 className="text-xl font-semibold tracking-tight">
        See it in action — no sign-up required
      </h2>
      <p className="text-muted-foreground text-balance">
        Explore a fully interactive demo with sample repositories, activity,
        and charts before you connect your own GitHub account.
      </p>
      <Button asChild className="group">
        <Link href="/demo">
          <PlayCircleIcon className="transition-transform duration-200 ease-out group-hover:scale-110" />
          Open the live demo
        </Link>
      </Button>
    </motion.div>
  );
}
