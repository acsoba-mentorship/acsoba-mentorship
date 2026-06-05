import { v } from "convex/values";

export const mentorshipGoalStatusValidator = v.union(
  v.literal("active"),
  v.literal("completed"),
  v.literal("archived")
);

export const mentorshipGoalsTableFields = {
  mentorshipId: v.id("mentorships"),
  title: v.string(),
  description: v.optional(v.string()),
  status: mentorshipGoalStatusValidator,
  createdBy: v.id("users"),
  completedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
};