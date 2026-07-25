import { v } from "convex/values";

export const incidentCategoryValidator = v.union(
  v.literal("misconduct"),
  v.literal("harassment"),
  v.literal("safety"),
  v.literal("privacy"),
  v.literal("other")
);

export const incidentSeverityValidator = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
  v.literal("urgent")
);

export const incidentStatusValidator = v.union(
  v.literal("open"),
  v.literal("in_review"),
  v.literal("resolved"),
  v.literal("dismissed")
);

export const incidentReportsTableFields = {
  reporterId: v.id("users"),
  reportedUserId: v.optional(v.id("users")),
  mentorshipId: v.optional(v.id("mentorships")),
  category: incidentCategoryValidator,
  severity: incidentSeverityValidator,
  description: v.string(),
  occurredAt: v.optional(v.number()),
  allowContact: v.boolean(),
  status: incidentStatusValidator,
  assignedAdminId: v.optional(v.id("users")),
  adminNotes: v.optional(v.string()),
  resolvedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
};
