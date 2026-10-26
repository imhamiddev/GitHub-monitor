"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BellIcon,
  CheckCircle2Icon,
  CopyIcon,
  Loader2Icon,
  RefreshCwIcon,
  SendIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  disconnectTelegram,
  generateTelegramLink,
  getTelegramStatus,
  sendTelegramTestMessage,
  setTelegramNotifications,
} from "@/lib/telegram/actions";
import { useLoadingBarAction } from "@/hooks/use-loading-bar-action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type ConnectionState =
  | { connected: false }
  | {
      connected: true;
      username: string | null;
      firstName: string | null;
      notificationsEnabled: boolean;
    };

type PendingLink = { link: string; qrDataUrl: string; expiresAt: number };

export function TelegramConnectionCard({
  connection,
  botUsername,
  configured,
}: {
  connection: ConnectionState;
  botUsername: string;
  configured: boolean;
}) {
  const router = useRouter();
  const runWithBar = useLoadingBarAction();
  const [isPending, startTransition] = useTransition();
  const [pendingLink, setPendingLink] = useState<PendingLink | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // While a link is waiting to be opened in Telegram, poll until the bot
  // confirms it, then refresh the page into the "connected" state.
  useEffect(() => {
    if (!pendingLink || connection.connected) return;

    const interval = setInterval(async () => {
      if (Date.now() > pendingLink.expiresAt) {
        setPendingLink(null);
        return;
      }
      const status = await getTelegramStatus();
      if (status.connected) {
        setPendingLink(null);
        toast.success("Telegram connected!");
        router.refresh();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [pendingLink, connection.connected, router]);

  function handleGenerate() {
    startTransition(async () => {
      const result = await runWithBar(() => generateTelegramLink());
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setPendingLink({
        link: result.link,
        qrDataUrl: result.qrDataUrl,
        expiresAt: new Date(result.expiresAt).getTime(),
      });
    });
  }

  function handleDisconnect() {
    startTransition(async () => {
      const result = await runWithBar(() => disconnectTelegram());
      if (result.success) {
        toast.success("Telegram disconnected.");
        setDialogOpen(false);
        setPendingLink(null);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleToggle(enabled: boolean) {
    startTransition(async () => {
      const result = await runWithBar(() => setTelegramNotifications(enabled));
      if (result.success) {
        toast.success(enabled ? "Notifications turned on" : "Notifications paused");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleTest() {
    startTransition(async () => {
      const result = await runWithBar(() => sendTelegramTestMessage());
      if (result.success) toast.success("Test message sent — check Telegram.");
      else toast.error(result.error);
    });
  }

  async function copyLink(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy the link.");
    }
  }

  const header = (
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <SendIcon className="size-5" />
        Telegram
      </CardTitle>
      <CardDescription>
        Get every event recorded by GitHub Monitor instantly in Telegram via @{botUsername}.
      </CardDescription>
    </CardHeader>
  );

  if (!configured) {
    return (
      <Card>
        {header}
        <CardContent>
          <p className="text-muted-foreground text-sm">
            The Telegram bot isn&apos;t configured on this server yet. Set{" "}
            <code>TELEGRAM_BOT_TOKEN</code> and <code>TELEGRAM_WEBHOOK_SECRET</code> to enable it.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (connection.connected) {
    return (
      <Card>
        {header}
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="success" className="gap-1">
              <CheckCircle2Icon className="size-3.5" />
              Connected
            </Badge>
            <span className="text-sm font-medium">
              {connection.username ? `@${connection.username}` : (connection.firstName ?? "Telegram user")}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <span className="flex items-center gap-2 text-sm font-medium">
              <BellIcon className="text-muted-foreground size-4" />
              Notifications: {connection.notificationsEnabled ? "ON" : "OFF"}
            </span>
            <Switch
              checked={connection.notificationsEnabled}
              onCheckedChange={handleToggle}
              disabled={isPending}
              aria-label="Toggle Telegram notifications"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <a href={`https://t.me/${botUsername}`} target="_blank" rel="noopener noreferrer">
                <SendIcon />
                Open bot
              </a>
            </Button>
            <Button variant="outline" onClick={handleTest} disabled={isPending}>
              {isPending ? <Loader2Icon className="animate-spin" /> : <BellIcon />}
              Send test message
            </Button>
            <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Disconnect</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Disconnect Telegram?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will stop receiving notifications in Telegram. You can reconnect at any time.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(event) => {
                      event.preventDefault();
                      handleDisconnect();
                    }}
                    disabled={isPending}
                    className="bg-destructive text-white hover:bg-destructive/90"
                  >
                    {isPending && <Loader2Icon className="animate-spin" />}
                    Disconnect
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {header}
      <CardContent className="flex flex-col gap-4">
        {!pendingLink ? (
          <div>
            <Button onClick={handleGenerate} disabled={isPending}>
              {isPending ? <Loader2Icon className="animate-spin" /> : <SendIcon />}
              Connect Telegram
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pendingLink.qrDataUrl}
              alt="Telegram connection QR code"
              width={176}
              height={176}
              className="size-44 shrink-0 rounded-lg border bg-white p-2"
            />
            <div className="flex flex-col gap-3">
              <p className="text-muted-foreground text-sm">
                Scan the QR code with your phone, or open the bot directly and press{" "}
                <span className="text-foreground font-medium">Start</span>. This page will update
                automatically once connected. The link expires in 15 minutes.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <a href={pendingLink.link} target="_blank" rel="noopener noreferrer">
                    <SendIcon />
                    Open in Telegram
                  </a>
                </Button>
                <Button variant="outline" onClick={() => copyLink(pendingLink.link)}>
                  <CopyIcon />
                  Copy link
                </Button>
                <Button variant="ghost" onClick={handleGenerate} disabled={isPending}>
                  <RefreshCwIcon className={isPending ? "animate-spin" : undefined} />
                  New link
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
