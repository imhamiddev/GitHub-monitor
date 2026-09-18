import { SettingsNav } from "@/components/settings/settings-nav";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your account, GitHub connection, and notification preferences.
        </p>
      </div>
      <SettingsNav />
      <div className="max-w-2xl">{children}</div>
    </div>
  );
}
