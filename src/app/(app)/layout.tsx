import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/session";
import { getMonitoredRepositoriesForFilter } from "@/lib/activity/list";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { CommandPalette } from "@/components/layout/command-palette";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Authoritative check: middleware only looked for a cookie's presence.
  // This is the real, DB-backed verification — never trust the client.
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  const monitoredRepos = await getMonitoredRepositoriesForFilter(session.user.id);

  return (
    <SidebarProvider>
      <AppSidebar
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        }}
      />
      <SidebarInset>
        <AppHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">{children}</div>
      </SidebarInset>
      <CommandPalette
        repos={monitoredRepos.map((repo) => ({
          id: repo.id,
          name: repo.name,
          fullName: repo.fullName,
        }))}
      />
    </SidebarProvider>
  );
}
