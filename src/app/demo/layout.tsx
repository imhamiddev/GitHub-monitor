import type { Metadata } from "next";

import { DemoBanner } from "@/components/demo/demo-banner";
import { DemoSidebar } from "@/components/demo/demo-sidebar";
import { DemoHeader } from "@/components/demo/demo-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export const metadata: Metadata = {
  title: "Demo — GitHub Monitor",
  robots: { index: false, follow: false },
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <DemoBanner />
      <SidebarProvider className="min-h-0 flex-1">
        <DemoSidebar />
        <SidebarInset>
          <DemoHeader />
          <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
