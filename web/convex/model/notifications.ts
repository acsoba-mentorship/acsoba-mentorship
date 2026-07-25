import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Infer } from "convex/values";
import { notificationTypeValidator } from "./notifications/fields";
import { getAuthenticatedUser } from "./auth";

export async function createNotification(
  ctx: MutationCtx,
  {
    userId,
    type,
    title,
    message,
    href,
  }: {
    userId: Id<"users">;
    type: Infer<typeof notificationTypeValidator>;
    title: string;
    message: string;
    href?: string;
  }
) {
  return ctx.db.insert("notifications", {
    userId,
    type,
    title: title.trim().slice(0, 120),
    message: message.trim().slice(0, 500),
    href: href?.trim().slice(0, 300),
    createdAt: Date.now(),
  });
}

export async function listMine(ctx: QueryCtx, { limit }: { limit?: number }) {
  const user = await getAuthenticatedUser(ctx);
  const effectiveLimit = Math.min(Math.max(Math.floor(limit ?? 30), 1), 100);

  return ctx.db
    .query("notifications")
    .withIndex("by_userId", (q) => q.eq("userId", user._id))
    .order("desc")
    .take(effectiveLimit);
}

export async function unreadCount(ctx: QueryCtx) {
  const user = await getAuthenticatedUser(ctx);
  const unread = await ctx.db
    .query("notifications")
    .withIndex("by_userId_readAt", (q) =>
      q.eq("userId", user._id).eq("readAt", undefined)
    )
    .collect();
  return unread.length;
}

export async function markRead(
  ctx: MutationCtx,
  { notificationId }: { notificationId: Id<"notifications"> }
) {
  const user = await getAuthenticatedUser(ctx);
  const notification = await ctx.db.get("notifications", notificationId);

  if (!notification || notification.userId !== user._id) {
    throw new Error("Notification not found");
  }

  if (!notification.readAt) {
    await ctx.db.patch("notifications", notification._id, {
      readAt: Date.now(),
    });
  }

  return notification._id;
}

export async function markAllRead(ctx: MutationCtx) {
  const user = await getAuthenticatedUser(ctx);
  const unread = await ctx.db
    .query("notifications")
    .withIndex("by_userId_readAt", (q) =>
      q.eq("userId", user._id).eq("readAt", undefined)
    )
    .collect();
  const now = Date.now();

  await Promise.all(
    unread.map((notification) =>
      ctx.db.patch("notifications", notification._id, { readAt: now })
    )
  );

  return unread.length;
}
