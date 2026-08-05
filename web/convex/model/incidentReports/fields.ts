import { v } from "convex/values";
import { formAnswerValidator } from "../formQuestions/fields";

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

export const incidentReporterRoleValidator = v.union(
  v.literal("mentor"),
  v.literal("mentee")
);

export const incidentReportsTableFields = {
  reporterId: v.id("users"),
  // Optional so incident reports created before role-scoped reporting remain valid.
  reporterRole: v.optional(incidentReporterRoleValidator),
  reportedUserId: v.optional(v.id("users")),
  mentorshipId: v.optional(v.id("mentorships")),
  category: v.optional(incidentCategoryValidator),
  severity: v.optional(incidentSeverityValidator),
  description: v.optional(v.string()),
  occurredAt: v.optional(v.number()),
  allowContact: v.optional(v.boolean()),
  answers: v.optional(v.array(formAnswerValidator)),
  status: incidentStatusValidator,
  assignedAdminId: v.optional(v.id("users")),
  adminNotes: v.optional(v.string()),
  resolvedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
};
