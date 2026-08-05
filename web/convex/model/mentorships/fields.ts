import { v } from "convex/values";

export const mentorshipStatusValidator = v.union(
  v.literal("active"),
  v.literal("completed"),
  v.literal("cancelled")
);

export const mentorshipsTableFields = {
  mentorId: v.id("users"),
  menteeId: v.id("users"),
  requestId: v.optional(v.id("mentorshipRequests")),
  startDate: v.number(),
  plannedEndDate: v.optional(v.number()),
  agreedDurationMonths: v.optional(v.number()),
  endDate: v.optional(v.number()),
  exitInitiatedAt: v.optional(v.number()),
  exitInitiatedBy: v.optional(v.id("users")),
  status: mentorshipStatusValidator,
  createdAt: v.number(),
  updatedAt: v.number(),
};
