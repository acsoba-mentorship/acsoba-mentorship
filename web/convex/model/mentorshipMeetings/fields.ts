import { v } from "convex/values";

export const mentorshipMeetingStatusValidator = v.union(
  v.literal("scheduled"),
  v.literal("cancelled"),
  v.literal("completed")
);

export const mentorshipMeetingsTableFields = {
  mentorshipId: v.id("mentorships"),
  title: v.string(),
  description: v.optional(v.string()),
  location: v.optional(v.string()),
  startAt: v.number(),
  endAt: v.number(),
  status: mentorshipMeetingStatusValidator,
  createdBy: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.number(),
};
