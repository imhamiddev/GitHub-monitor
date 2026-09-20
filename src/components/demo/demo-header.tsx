"use client";

import { usePathname } from "next/navigation";

import { NAV_ITEMS } from "@/lib/constants/nav";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function DemoHeader() {
  const pathname = usePathname();
  const currentLabel =
    NAV_ITEMS.find((item) => `/demo${item.url}` === pathname)?.title ?? "Demo";

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <span className="flex-1 text-sm font-medium">{currentLabel}</span>
      <ThemeToggle />
    </header>
  );
}
