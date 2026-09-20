"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ActivityIcon,
  ChartColumnIcon,
  FolderGitIcon,
  GitBranch,
  LayoutDashboardIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

export type CommandPaletteRepo = { id: string; name: string; fullName: string };

export function openCommandPalette() {
  document.dispatchEvent(new Event("open-command-palette"));
}

const NAV_COMMANDS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
  { label: "Repositories", href: "/repositories", icon: FolderGitIcon },
  { label: "Activity", href: "/activity", icon: ActivityIcon },
  { label: "Statistics", href: "/statistics", icon: ChartColumnIcon },
] as const;

const SETTINGS_COMMANDS = [
  { label: "Account settings", href: "/settings/account", icon: UserIcon },
  { label: "GitHub connection", href: "/settings/github", icon: GitBranch },
  { label: "Settings", href: "/settings", icon: SettingsIcon },
] as const;

export function CommandPalette({ repos }: { repos: CommandPaletteRepo[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      setOpen((prev) => !prev);
    }
  }

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    function handleOpenRequest() {
      setOpen(true);
    }
    document.addEventListener("open-command-palette", handleOpenRequest);
    return () => document.removeEventListener("open-command-palette", handleOpenRequest);
  }, []);

  function navigate(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command Palette"
      description="Jump to a page or repository"
    >
      <CommandInput placeholder="Search pages and repositories..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigate">
          {NAV_COMMANDS.map((item) => (
            <CommandItem key={item.href} onSelect={() => navigate(item.href)}>
              <item.icon />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Settings">
          {SETTINGS_COMMANDS.map((item) => (
            <CommandItem key={item.href} onSelect={() => navigate(item.href)}>
              <item.icon />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>

        {repos.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Repositories">
              {repos.map((repo) => (
                <CommandItem
                  key={repo.id}
                  value={`repository ${repo.fullName}`}
                  onSelect={() => navigate(`/repositories/${repo.id}`)}
                >
                  <FolderGitIcon />
                  {repo.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
