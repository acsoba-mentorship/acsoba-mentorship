import { v } from "convex/values";

export const mentorshipRequestStatusValidator = v.union(
  v.literal("pending"),
  v.literal("accepted"),
  v.literal("rejected"),
  v.literal("expired")
);

export const mentorshipRequestsTableFields = {
  mentorId: v.id("users"),
  menteeId: v.id("users"),
  status: mentorshipRequestStatusValidator,
  message: v.string(),
  proposedDurationMonths: v.optional(v.number()),
  expiresAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
};
