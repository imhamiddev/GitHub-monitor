import type { LucideIcon } from "lucide-react";
import {
  ActivityIcon,
  BellRingIcon,
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
  { title: "Statistics", url: "/statistics", icon: ChartColumnIcon },
  { title: "Alerts", url: "/alerts", icon: BellRingIcon },
  { title: "Settings", url: "/settings", icon: SettingsIcon },
];
