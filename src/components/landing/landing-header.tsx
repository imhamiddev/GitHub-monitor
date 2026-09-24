"use client";

import Link from "next/link";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { duration, easing } from "@/lib/motion";

export function LandingHeader() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.normal, ease: easing.out }}
      className="flex items-center justify-between border-b px-6 py-4 md:px-10"
    >
      <div className="flex items-center gap-2 font-medium">
        <Logo className="size-8" />
        GitHub Monitor
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button variant="ghost" asChild className="hidden sm:inline-flex">
          <Link href="/demo">Demo</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/login">Sign in</Link>
        </Button>
        <Button asChild>
          <Link href="/register">Get started</Link>
        </Button>
      </div>
    </motion.header>
  );
}
