"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Fragment } from "react";

import { NAV_ITEMS } from "@/lib/constants/nav";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

function humanize(segment: string) {
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function AppHeader() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const rootLabel =
    NAV_ITEMS.find((item) => item.url === `/${segments[0]}`)?.title ??
    humanize(segments[0] ?? "");

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb className="flex-1">
        <BreadcrumbList>
          <BreadcrumbItem>
            {segments.length > 1 ? (
              <BreadcrumbLink asChild>
                <Link href={`/${segments[0]}`}>{rootLabel}</Link>
              </BreadcrumbLink>
            ) : (
              <BreadcrumbPage>{rootLabel}</BreadcrumbPage>
            )}
          </BreadcrumbItem>
          {segments.slice(1).map((segment, index) => {
            const isLast = index === segments.length - 2;
            const href = `/${segments.slice(0, index + 2).join("/")}`;
            return (
              <Fragment key={href}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{humanize(segment)}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={href}>{humanize(segment)}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
      <ThemeToggle />
    </header>
  );
}
