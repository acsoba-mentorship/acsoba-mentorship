import { v } from "convex/values";

export const notificationTypeValidator = v.union(
  v.literal("request_received"),
  v.literal("request_accepted"),
  v.literal("request_rejected"),
  v.literal("request_expired"),
  v.literal("pulse_survey_due"),
  v.literal("exit_feedback_due"),
  v.literal("incident_updated"),
  v.literal("internship_interest_received"),
  v.literal("internship_interest_acknowledged")
);

export const notificationsTableFields = {
  userId: v.id("users"),
  type: notificationTypeValidator,
  title: v.string(),
  message: v.string(),
  href: v.optional(v.string()),
  readAt: v.optional(v.number()),
  createdAt: v.number(),
};
