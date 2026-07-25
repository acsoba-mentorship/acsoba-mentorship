import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import {
  getAuthenticatedUser,
  requireAdmin,
  requireHeadAdmin,
} from "./auth";
import {
  getConfiguredHeadAdminEmail,
  normalizeAdminEmail,
  syncAuthenticatedEmailAndAdminAccess,
} from "./admin/bootstrap";
import { writeAdminAuditLog } from "./admin/audit";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function getMyAccess(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier)
    )
    .unique();

  if (!user) {
    return null;
  }

  const membership = await ctx.db
    .query("adminMemberships")
    .withIndex("by_user", (q) => q.eq("userId", user._id))
    .unique();

  if (!membership || membership.status !== "active") {
    return null;
  }

  return {
    role: membership.role,
    membershipId: membership._id,
    email: membership.email,
    userId: user._id,
    name: user.name,
  };
}

export async function claimMyAccess(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  const user = await getAuthenticatedUser(ctx);
  const membership = await syncAuthenticatedEmailAndAdminAccess(ctx, user, {
    authEmail: identity.email,
    authEmailVerified: identity.emailVerified === true,
  });

  return membership?.status === "active"
    ? {
        role: membership.role,
        membershipId: membership._id,
        email: membership.email,
      }
    : null;
}

export async function listMemberships(ctx: QueryCtx) {
  await requireHeadAdmin(ctx);
  const memberships = await ctx.db
    .query("adminMemberships")
    .order("desc")
    .collect();

  const userIds = memberships
    .map((membership) => membership.userId)
    .filter((userId): userId is Id<"users"> => Boolean(userId));
  const users = await Promise.all(userIds.map((userId) => ctx.db.get("users", userId)));
  const userById = new Map(
    users.filter(Boolean).map((user) => [String(user!._id), user!])
  );

  return memberships.map((membership) => {
    const user = membership.userId
      ? userById.get(String(membership.userId))
      : null;
    return {
      _id: membership._id,
      email: membership.email,
      normalizedEmail: membership.normalizedEmail,
      role: membership.role,
      status: membership.status,
      userId: membership.userId ?? null,
      userName: user?.name ?? null,
      invitedAt: membership.invitedAt,
      activatedAt: membership.activatedAt ?? null,
      revokedAt: membership.revokedAt ?? null,
      updatedAt: membership.updatedAt,
    };
  });
}

export async function inviteAdmin(
  ctx: MutationCtx,
  { email: rawEmail }: { email: string }
) {
  const { user: headAdmin, membership: headMembership } =
    await requireHeadAdmin(ctx);
  const email = normalizeAdminEmail(rawEmail);

  if (email.length > 320 || !EMAIL_PATTERN.test(email)) {
    throw new Error("Enter a valid administrator email address");
  }

  if (email === getConfiguredHeadAdminEmail()) {
    throw new Error("The configured head administrator is already managed");
  }

  const existing = await ctx.db
    .query("adminMemberships")
    .withIndex("by_normalized_email", (q) => q.eq("normalizedEmail", email))
    .unique();

  if (existing?.role === "head_admin") {
    throw new Error("The head administrator membership cannot be changed");
  }

  if (existing?.status === "active") {
    throw new Error("This email already has active administrator access");
  }

  const now = Date.now();
  const status = "invited" as const;

  let membershipId: Id<"adminMemberships">;
  if (existing) {
    membershipId = existing._id;
    await ctx.db.patch("adminMemberships", membershipId, {
      email: rawEmail.trim(),
      role: "admin",
      status,
      userId: existing.userId,
      invitedByUserId: headAdmin._id,
      invitedAt: now,
      activatedAt: undefined,
      revokedAt: undefined,
      updatedAt: now,
    });
  } else {
    membershipId = await ctx.db.insert("adminMemberships", {
      normalizedEmail: email,
      email: rawEmail.trim(),
      role: "admin",
      status,
      invitedByUserId: headAdmin._id,
      invitedAt: now,
      updatedAt: now,
    });
  }

  await writeAdminAuditLog(ctx, {
    actorId: headAdmin._id,
    action: existing ? "admin_membership.reactivated" : "admin_membership.invited",
    targetType: "admin_membership",
    targetId: String(membershipId),
    targetEmail: email,
    targetUserId: existing?.userId,
    metadata: {
      status,
      actorMembershipId: String(headMembership._id),
    },
  });

  return membershipId;
}

export async function revokeAdmin(
  ctx: MutationCtx,
  {
    membershipId,
    reason,
  }: {
    membershipId: Id<"adminMemberships">;
    reason?: string;
  }
) {
  const { user: headAdmin, membership: headMembership } =
    await requireHeadAdmin(ctx);
  const target = await ctx.db.get("adminMemberships", membershipId);

  if (!target || target.role === "head_admin") {
    throw new Error("Only ordinary administrator memberships can be revoked");
  }

  if (target.userId === headAdmin._id || target._id === headMembership._id) {
    throw new Error("You cannot revoke your own administrator access");
  }

  if (target.status === "revoked") {
    return target._id;
  }

  const cleanReason = reason?.trim();
  if (cleanReason && cleanReason.length > 500) {
    throw new Error("Revocation reason must be 500 characters or fewer");
  }

  const now = Date.now();
  await ctx.db.patch("adminMemberships", target._id, {
    status: "revoked",
    revokedAt: now,
    updatedAt: now,
  });

  await writeAdminAuditLog(ctx, {
    actorId: headAdmin._id,
    action: "admin_membership.revoked",
    targetType: "admin_membership",
    targetId: String(target._id),
    targetEmail: target.normalizedEmail,
    targetUserId: target.userId,
    reason: cleanReason,
  });

  return target._id;
}

export async function getOverview(ctx: QueryCtx) {
  await requireAdmin(ctx);

  const [
    users,
    activeMentorships,
    pendingPulse,
    submittedPulse,
    pendingExit,
    submittedExit,
    openIncidents,
    inReviewIncidents,
    activeAdmins,
  ] = await Promise.all([
    ctx.db.query("users").collect(),
    ctx.db
      .query("mentorships")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect(),
    ctx.db
      .query("mentorshipPulseSurveys")
      .withIndex("by_status_dueAt", (q) => q.eq("status", "pending"))
      .collect(),
    ctx.db
      .query("mentorshipPulseSurveys")
      .withIndex("by_status_dueAt", (q) => q.eq("status", "submitted"))
      .collect(),
    ctx.db
      .query("exitFeedback")
      .withIndex("by_status_dueAt", (q) => q.eq("status", "pending"))
      .collect(),
    ctx.db
      .query("exitFeedback")
      .withIndex("by_status_dueAt", (q) => q.eq("status", "submitted"))
      .collect(),
    ctx.db
      .query("incidentReports")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .collect(),
    ctx.db
      .query("incidentReports")
      .withIndex("by_status", (q) => q.eq("status", "in_review"))
      .collect(),
    ctx.db
      .query("adminMemberships")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect(),
  ]);

  const supportFlags = submittedPulse.filter(
    (survey) => survey.needsSupport === true
  ).length;

  return {
    totalUsers: users.length,
    activeMentorships: activeMentorships.length,
    activeAdmins: activeAdmins.length,
    pendingForms: pendingPulse.length + pendingExit.length,
    pendingPulseSurveys: pendingPulse.length,
    pendingExitFeedback: pendingExit.length,
    submittedPulseSurveys: submittedPulse.length,
    submittedExitFeedback: submittedExit.length,
    supportFlags,
    openIncidents: openIncidents.length + inReviewIncidents.length,
  };
}

export async function listOutstandingForms(ctx: QueryCtx) {
  await requireAdmin(ctx);
  const [pulseForms, exitForms] = await Promise.all([
    ctx.db
      .query("mentorshipPulseSurveys")
      .withIndex("by_status_dueAt", (q) => q.eq("status", "pending"))
      .collect(),
    ctx.db
      .query("exitFeedback")
      .withIndex("by_status_dueAt", (q) => q.eq("status", "pending"))
      .collect(),
  ]);

  const respondentIds = [
    ...pulseForms.map((form) => form.respondentId),
    ...exitForms.map((form) => form.respondentId),
  ];
  const respondents = await Promise.all(
    respondentIds.map((userId) => ctx.db.get("users", userId))
  );
  const respondentById = new Map(
    respondents.filter(Boolean).map((user) => [String(user!._id), user!])
  );

  return [
    ...pulseForms.map((form) => ({
      id: String(form._id),
      type: "pulse_survey" as const,
      mentorshipId: form.mentorshipId,
      respondentRole: form.respondentRole,
      respondentName:
        respondentById.get(String(form.respondentId))?.name ?? "Unknown user",
      dueAt: form.dueAt,
      createdAt: form.createdAt,
    })),
    ...exitForms.map((form) => ({
      id: String(form._id),
      type: "exit_feedback" as const,
      mentorshipId: form.mentorshipId,
      respondentRole: form.respondentRole,
      respondentName:
        respondentById.get(String(form.respondentId))?.name ?? "Unknown user",
      dueAt: form.dueAt,
      createdAt: form.createdAt,
    })),
  ]
    .sort((a, b) => a.dueAt - b.dueAt);
}

export async function listPulseSurveys(ctx: QueryCtx) {
  await requireAdmin(ctx);
  const surveys = await ctx.db
    .query("mentorshipPulseSurveys")
    .withIndex("by_status_dueAt", (q) => q.eq("status", "submitted"))
    .order("desc")
    .collect();
  const respondents = await Promise.all(
    surveys.map((survey) => ctx.db.get("users", survey.respondentId))
  );

  return surveys.map((survey, index) => ({
    _id: survey._id,
    mentorshipId: survey.mentorshipId,
    respondentRole: survey.respondentRole,
    respondentName: respondents[index]?.name ?? "Unknown user",
    cycleNumber: survey.cycleNumber,
    relationshipRating: survey.relationshipRating ?? null,
    communicationRating: survey.communicationRating ?? null,
    progressRating: survey.progressRating ?? null,
    needsSupport: survey.needsSupport ?? false,
    comments: survey.comments ?? null,
    submittedAt: survey.submittedAt ?? null,
  }));
}

export async function listAuditLog(ctx: QueryCtx) {
  await requireHeadAdmin(ctx);
  const logs = await ctx.db
    .query("adminAuditLogs")
    .withIndex("by_createdAt")
    .order("desc")
    .collect();
  const actors = await Promise.all(
    logs.map((log) => ctx.db.get("users", log.actorId))
  );

  return logs.map((log, index) => ({
    _id: log._id,
    actorName: actors[index]?.name ?? "Unknown administrator",
    action: log.action,
    targetEmail: log.targetEmail ?? null,
    reason: log.reason ?? null,
    createdAt: log.createdAt,
  }));
}
