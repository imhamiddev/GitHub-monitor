import type { LucideIcon } from "lucide-react";
import {
  ActivityIcon,
  BellIcon,
  FolderGitIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  ChartColumnIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboardIcon },
  { title: "Repositories", url: "/repositories", icon: FolderGitIcon },
  { title: "Activity", url: "/activity", icon: ActivityIcon },
  { title: "Notifications", url: "/notifications", icon: BellIcon },
  { title: "Statistics", url: "/statistics", icon: ChartColumnIcon },
  { title: "Settings", url: "/settings", icon: SettingsIcon },
];
