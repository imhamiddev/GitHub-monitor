"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, UsersIcon } from "lucide-react";
import { toast } from "sonner";

import { createTeamAction } from "@/lib/teams/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function CreateTeamCard() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");

  function handleCreate() {
    startTransition(async () => {
      const result = await createTeamAction(name);
      if (result.success) {
        toast.success("Team created.");
        setName("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UsersIcon className="size-4" />
          Create a team
        </CardTitle>
        <CardDescription>
          Invite teammates to a read-only view of your repositories, statistics and activity. They never get write
          access.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={name}
          maxLength={60}
          placeholder="Team name"
          aria-label="Team name"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && name.trim() && handleCreate()}
        />
        <Button onClick={handleCreate} disabled={isPending || name.trim().length === 0}>
          {isPending && <Loader2Icon className="animate-spin" />}
          Create team
        </Button>
      </CardContent>
    </Card>
  );
}
