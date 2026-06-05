import { v } from "convex/values";

export const mentorshipTodosTableFields = {
  mentorshipId: v.id("mentorships"),
  goalId: v.optional(v.id("mentorshipGoals")),
  title: v.string(),
  description: v.optional(v.string()),
  assignedTo: v.optional(v.id("users")),
  createdBy: v.id("users"),
  completed: v.boolean(),
  completedAt: v.optional(v.number()),
  dueDate: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
};