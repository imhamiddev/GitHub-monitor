import type { Metadata } from "next";
import Link from "next/link";
import { BellIcon } from "lucide-react";

import { getServerSession } from "@/lib/auth/session";
import { getNotifications } from "@/lib/notifications/list";
import { NotificationItem } from "@/components/notifications/notification-item";
import { MarkAllReadButton } from "@/components/notifications/mark-all-read-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export const metadata: Metadata = {
  title: "Notifications — GitHub Monitor",
};

function buildHref(filter: string, page: number) {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("filter", filter);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `/notifications${query ? `?${query}` : ""}`;
}

export default async function NotificationsPage({
  searchParams,
}: PageProps<"/notifications">) {
  const session = await getServerSession();
  if (!session) return null;

  const params = await searchParams;
  const filter = params.filter === "unread" ? "unread" : "all";
  const page = Math.max(1, Number(params.page) || 1);

  const { items, totalPages } = await getNotifications(session.user.id, {
    filter,
    page,
  });

  return (
    <div className="flex max-w-2xl flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground text-sm">
            Stay on top of activity across your monitored repositories.
          </p>
        </div>
        <MarkAllReadButton disabled={items.length === 0} />
      </div>

      <Tabs value={filter}>
        <TabsList>
          <TabsTrigger value="all" asChild>
            <Link href={buildHref("all", 1)}>All</Link>
          </TabsTrigger>
          <TabsTrigger value="unread" asChild>
            <Link href={buildHref("unread", 1)}>Unread</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {items.length === 0 ? (
        <EmptyState
          icon={BellIcon}
          title={filter === "unread" ? "No unread notifications" : "No notifications yet"}
          description="Notifications from your monitored repositories will show up here."
        />
      ) : (
        <div className="flex flex-col gap-1">
          {items.map((item) => (
            <NotificationItem key={item.id} item={item} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={buildHref(filter, Math.max(1, page - 1))}
                aria-disabled={page <= 1}
                className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href={buildHref(filter, page)} isActive>
                {page}
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href={buildHref(filter, Math.min(totalPages, page + 1))}
                aria-disabled={page >= totalPages}
                className={
                  page >= totalPages ? "pointer-events-none opacity-50" : undefined
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
