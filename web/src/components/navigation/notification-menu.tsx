"use client";

import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatDate } from "@/lib/utils";

export function NotificationMenu({
  inverted = false,
}: {
  inverted?: boolean;
}) {
  const { isAuthenticated } = useConvexAuth();
  const notifications = useQuery(
    api.notifications.listMine,
    isAuthenticated ? { limit: 8 } : "skip"
  );
  const unreadCount = useQuery(
    api.notifications.unreadCount,
    isAuthenticated ? {} : "skip"
  );
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);

  if (!isAuthenticated) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "relative",
            inverted &&
              "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
          )}
          aria-label={
            unreadCount
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
          }
        >
          <Bell className="size-4" />
          {Boolean(unreadCount) && (
            <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-[#D7B45B] px-1 text-[10px] font-bold leading-4 text-[#000F33]">
              {Math.min(unreadCount ?? 0, 99)}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[min(92vw,24rem)] p-0">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {Boolean(unreadCount) && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 gap-1.5 px-2 text-xs"
              onClick={() => void markAllRead({})}
            >
              <CheckCheck className="size-3.5" />
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator className="m-0" />

        <div className="max-h-96 overflow-y-auto">
          {notifications === undefined ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Loading notifications…
            </p>
          ) : notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              You are all caught up.
            </p>
          ) : (
            notifications.map((notification) => {
              const content = (
                <div
                  className={cn(
                    "block px-4 py-3 transition-colors hover:bg-muted/70",
                    !notification.readAt && "bg-primary/5"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-1.5 size-2 shrink-0 rounded-full",
                        notification.readAt ? "bg-transparent" : "bg-[#735C00]"
                      )}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {notification.title}
                      </p>
                      <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              );

              return notification.href ? (
                <Link
                  key={notification._id}
                  href={notification.href}
                  onClick={() =>
                    void markRead({ notificationId: notification._id })
                  }
                >
                  {content}
                </Link>
              ) : (
                <button
                  key={notification._id}
                  type="button"
                  className="w-full text-left"
                  onClick={() =>
                    void markRead({ notificationId: notification._id })
                  }
                >
                  {content}
                </button>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
