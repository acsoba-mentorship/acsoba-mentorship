import { v } from "convex/values";

export const adminMembershipStatusValidator = v.union(
  v.literal("invited"),
  v.literal("active"),
  v.literal("revoked")
);

export const adminMembershipRoleValidator = v.union(
  v.literal("admin"),
  v.literal("head_admin")
);

export const adminMembershipsTableFields = {
  normalizedEmail: v.string(),
  email: v.string(),
  role: adminMembershipRoleValidator,
  status: adminMembershipStatusValidator,
  userId: v.optional(v.id("users")),
  invitedByUserId: v.optional(v.id("users")),
  invitedAt: v.number(),
  activatedAt: v.optional(v.number()),
  revokedAt: v.optional(v.number()),
  updatedAt: v.number(),
};

export const adminBootstrapStateTableFields = {
  key: v.string(),
  membershipId: v.id("adminMemberships"),
  claimedByUserId: v.id("users"),
  claimedAt: v.number(),
};

export const programSettingsTableFields = {
  key: v.string(),
  maxActiveMentorsPerMentee: v.number(),
  requestExpiryDays: v.number(),
  pulseSurveyIntervalDays: v.number(),
  exitSurveyDueDays: v.number(),
  onboardingIndustries: v.optional(v.array(v.string())),
  onboardingInterests: v.optional(v.array(v.string())),
  updatedBy: v.optional(v.id("users")),
  updatedAt: v.number(),
};

export const adminAuditLogTableFields = {
  actorId: v.id("users"),
  action: v.string(),
  targetType: v.optional(v.string()),
  targetId: v.optional(v.string()),
  targetEmail: v.optional(v.string()),
  targetUserId: v.optional(v.id("users")),
  reason: v.optional(v.string()),
  metadata: v.optional(v.string()),
  createdAt: v.number(),
};
