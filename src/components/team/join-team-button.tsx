"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, UserPlusIcon } from "lucide-react";
import { toast } from "sonner";

import { acceptInviteAction } from "@/lib/teams/actions";
import { Button } from "@/components/ui/button";

export function JoinTeamButton({ token }: { token: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function join() {
    startTransition(async () => {
      const result = await acceptInviteAction(token);
      if (result.success) {
        toast.success("You joined the team.");
        router.push(`/team/${result.teamId}`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Button onClick={join} disabled={isPending}>
      {isPending ? <Loader2Icon className="animate-spin" /> : <UserPlusIcon />}
      Join team
    </Button>
  );
}
