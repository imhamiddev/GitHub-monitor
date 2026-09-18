import type { Metadata } from "next";

import { getServerSession } from "@/lib/auth/session";
import { ProfileCard } from "@/components/settings/profile-card";
import { ChangePasswordCard } from "@/components/settings/change-password-card";
import { DeleteAccountCard } from "@/components/settings/delete-account-card";

export const metadata: Metadata = {
  title: "Account — Settings",
};

export default async function AccountSettingsPage() {
  const session = await getServerSession();
  if (!session) return null;

  return (
    <div className="flex flex-col gap-6">
      <ProfileCard name={session.user.name} email={session.user.email} />
      <ChangePasswordCard />
      <DeleteAccountCard />
    </div>
  );
}
