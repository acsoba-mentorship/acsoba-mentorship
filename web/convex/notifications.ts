import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import * as NotificationsModel from "./model/notifications";

export const listMine = query({
  args: { limit: v.optional(v.number()) },
  handler: (ctx, args) => NotificationsModel.listMine(ctx, args),
});

export const unreadCount = query({
  args: {},
  handler: (ctx) => NotificationsModel.unreadCount(ctx),
});

export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: (ctx, args) => NotificationsModel.markRead(ctx, args),
});

export const markAllRead = mutation({
  args: {},
  handler: (ctx) => NotificationsModel.markAllRead(ctx),
});
