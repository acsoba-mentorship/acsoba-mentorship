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
  v.literal("internship_interest_acknowledged"),
  v.literal("internship_application_accepted"),
  v.literal("internship_application_rejected"),
  v.literal("account_suspended"),
  v.literal("account_reactivated"),
  v.literal("admin_message"),
  v.literal("internship_taken_down"),
  v.literal("volunteer_activity_taken_down"),
  v.literal("mentorship_ended_by_admin")
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
