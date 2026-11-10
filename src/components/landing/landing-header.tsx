import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function LandingHeader() {
  return (
    <header className="flex items-center justify-between border-b px-6 py-4 md:px-10">
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
    </header>
  );
}
