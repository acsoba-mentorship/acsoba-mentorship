import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { ConvexError } from "convex/values";
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
import { fetchUsersById } from "./helper";
import { createNotification } from "./notifications";
import { ACCOUNT_STATUS } from "./users/fields";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ProgrammeFormReference = {
  mentorshipId: Id<"mentorships">;
  respondentId: Id<"users">;
  respondentRole: "mentor" | "mentee";
};

function getCounterpartId(
  form: ProgrammeFormReference,
  mentorshipById: Map<Id<"mentorships">, Doc<"mentorships"> | null>
) {
  const mentorship = mentorshipById.get(form.mentorshipId);
  if (!mentorship) return null;

  return form.respondentRole === "mentor"
    ? mentorship.menteeId
    : mentorship.mentorId;
}

async function loadProgrammeFormPeople(
  ctx: QueryCtx,
  forms: ProgrammeFormReference[]
) {
  const mentorshipIds = [...new Set(forms.map((form) => form.mentorshipId))];
  const mentorships = await Promise.all(
    mentorshipIds.map((mentorshipId) =>
      ctx.db.get("mentorships", mentorshipId)
    )
  );
  const mentorshipById = new Map(
    mentorshipIds.map((mentorshipId, index) => [
      mentorshipId,
      mentorships[index] ?? null,
    ])
  );
  const counterpartIds = forms
    .map((form) => getCounterpartId(form, mentorshipById))
    .filter((userId): userId is Id<"users"> => userId !== null);
  const userById = await fetchUsersById(ctx, [
    ...forms.map((form) => form.respondentId),
    ...counterpartIds,
  ]);

  return { mentorshipById, userById };
}

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
    throw new ConvexError("Not authenticated");
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
    throw new ConvexError("Enter a valid administrator email address");
  }

  if (email === getConfiguredHeadAdminEmail()) {
    throw new ConvexError("The configured head administrator is already managed");
  }

  const existing = await ctx.db
    .query("adminMemberships")
    .withIndex("by_normalized_email", (q) => q.eq("normalizedEmail", email))
    .unique();

  if (existing?.role === "head_admin") {
    throw new ConvexError("The head administrator membership cannot be changed");
  }

  if (existing?.status === "active") {
    throw new ConvexError("This email already has active administrator access");
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
    throw new ConvexError("Only ordinary administrator memberships can be revoked");
  }

  if (target.userId === headAdmin._id || target._id === headMembership._id) {
    throw new ConvexError("You cannot revoke your own administrator access");
  }

  if (target.status === "revoked") {
    return target._id;
  }

  const cleanReason = reason?.trim();
  if (cleanReason && cleanReason.length > 500) {
    throw new ConvexError("Revocation reason must be 500 characters or fewer");
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

  const forms = [...pulseForms, ...exitForms];
  const { mentorshipById, userById } = await loadProgrammeFormPeople(
    ctx,
    forms
  );

  return [
    ...pulseForms.map((form) => {
      const counterpartId = getCounterpartId(form, mentorshipById);
      return {
        id: String(form._id),
        type: "pulse_survey" as const,
        mentorshipId: form.mentorshipId,
        respondentRole: form.respondentRole,
        respondentName: userById.get(form.respondentId)?.name ?? "Unknown user",
        counterpartRole:
          form.respondentRole === "mentor"
            ? ("mentee" as const)
            : ("mentor" as const),
        counterpartName:
          (counterpartId ? userById.get(counterpartId)?.name : null) ??
          "Unknown user",
        dueAt: form.dueAt,
        createdAt: form.createdAt,
      };
    }),
    ...exitForms.map((form) => {
      const counterpartId = getCounterpartId(form, mentorshipById);
      return {
        id: String(form._id),
        type: "exit_feedback" as const,
        mentorshipId: form.mentorshipId,
        respondentRole: form.respondentRole,
        respondentName: userById.get(form.respondentId)?.name ?? "Unknown user",
        counterpartRole:
          form.respondentRole === "mentor"
            ? ("mentee" as const)
            : ("mentor" as const),
        counterpartName:
          (counterpartId ? userById.get(counterpartId)?.name : null) ??
          "Unknown user",
        dueAt: form.dueAt,
        createdAt: form.createdAt,
      };
    }),
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
  const { mentorshipById, userById } = await loadProgrammeFormPeople(
    ctx,
    surveys
  );

  return surveys.map((survey) => {
    const counterpartId = getCounterpartId(survey, mentorshipById);
    return {
      _id: survey._id,
      mentorshipId: survey.mentorshipId,
      respondentRole: survey.respondentRole,
      respondentName:
        userById.get(survey.respondentId)?.name ?? "Unknown user",
      counterpartRole:
        survey.respondentRole === "mentor"
          ? ("mentee" as const)
          : ("mentor" as const),
      counterpartName:
        (counterpartId ? userById.get(counterpartId)?.name : null) ??
        "Unknown user",
      cycleNumber: survey.cycleNumber,
      relationshipRating: survey.relationshipRating ?? null,
      communicationRating: survey.communicationRating ?? null,
      progressRating: survey.progressRating ?? null,
      needsSupport: survey.needsSupport ?? false,
      comments: survey.comments ?? null,
      submittedAt: survey.submittedAt ?? null,
    };
  });
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

const MESSAGE_SUBJECT_MAX = 150;
const MESSAGE_BODY_MAX = 2000;
const SUSPENSION_REASON_MAX = 500;

function matchesUserSearch(user: Doc<"users">, search: string) {
  if (!search) return true;
  const haystack = [
    user.name,
    user.username,
    user.email,
    user.phoneNumber,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();
  return haystack.includes(search);
}

function toAdminUserSummary(
  user: Doc<"users">,
  headAdminUserIds: Set<string>
) {
  return {
    _id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    phoneNumber: user.phoneNumber,
    accountStatus: user.accountStatus ?? ACCOUNT_STATUS.ACTIVE,
    suspendedAt: user.suspendedAt ?? null,
    suspendedReason: user.suspendedReason ?? null,
    onboardingStatus: user.onboardingStatus,
    isMentor: Boolean(user.mentorProfile),
    isMentee: Boolean(user.menteeProfile),
    isHeadAdmin: headAdminUserIds.has(String(user._id)),
    createdAt: user.createdAt,
  };
}

/**
 * FR: "Admins should be able to close a user account temporarily and be
 * able to activate it. For this tab, admin should be able to search for
 * users also." Search matches name, username, email, or phone number.
 */
export async function listUsers(
  ctx: QueryCtx,
  { search }: { search?: string }
) {
  await requireAdmin(ctx);
  const normalizedSearch = (search ?? "").trim().toLowerCase();

  const users = await ctx.db.query("users").collect();

  const headAdminMemberships = await ctx.db
    .query("adminMemberships")
    .withIndex("by_status_role", (q) =>
      q.eq("status", "active").eq("role", "head_admin")
    )
    .collect();
  const headAdminUserIds = new Set(
    headAdminMemberships
      .filter((membership) => membership.userId)
      .map((membership) => String(membership.userId))
  );

  return users
    .filter((user) => matchesUserSearch(user, normalizedSearch))
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 200)
    .map((user) => toAdminUserSummary(user, headAdminUserIds));
}

export async function suspendUser(
  ctx: MutationCtx,
  { userId, reason }: { userId: Id<"users">; reason?: string }
) {
  const { user: admin } = await requireAdmin(ctx);
  if (userId === admin._id) {
    throw new ConvexError("You cannot suspend your own account");
  }

  const target = await ctx.db.get("users", userId);
  if (!target) {
    throw new ConvexError("User not found");
  }

  const targetMembership = await ctx.db
    .query("adminMemberships")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
  if (targetMembership && targetMembership.status === "active") {
    if (targetMembership.role === "head_admin") {
      throw new ConvexError("You cannot suspend the head administrator account");
    }
    throw new ConvexError(
      "This user is an administrator. Revoke their administrator access first."
    );
  }

  if (target.accountStatus === ACCOUNT_STATUS.SUSPENDED) {
    return target._id;
  }

  const cleanReason = reason?.trim();
  if (cleanReason && cleanReason.length > SUSPENSION_REASON_MAX) {
    throw new ConvexError(
      `Suspension reason must be ${SUSPENSION_REASON_MAX} characters or fewer`
    );
  }

  const now = Date.now();
  await ctx.db.patch("users", userId, {
    accountStatus: ACCOUNT_STATUS.SUSPENDED,
    suspendedAt: now,
    suspendedReason: cleanReason,
  });

  await writeAdminAuditLog(ctx, {
    actorId: admin._id,
    action: "user.suspended",
    targetType: "user",
    targetId: String(userId),
    targetUserId: userId,
    targetEmail: target.email,
    reason: cleanReason,
  });

  await createNotification(ctx, {
    userId,
    type: "account_suspended",
    title: "Your account has been temporarily suspended",
    message: cleanReason
      ? `An administrator has temporarily suspended your account: ${cleanReason}`
      : "An administrator has temporarily suspended your account. Contact ACSOBA support for more information.",
  });

  return target._id;
}

export async function reactivateUser(
  ctx: MutationCtx,
  { userId }: { userId: Id<"users"> }
) {
  const { user: admin } = await requireAdmin(ctx);
  const target = await ctx.db.get("users", userId);
  if (!target) {
    throw new ConvexError("User not found");
  }

  if (
    !target.accountStatus ||
    target.accountStatus === ACCOUNT_STATUS.ACTIVE
  ) {
    return target._id;
  }

  await ctx.db.patch("users", userId, {
    accountStatus: ACCOUNT_STATUS.ACTIVE,
    suspendedAt: undefined,
    suspendedReason: undefined,
  });

  await writeAdminAuditLog(ctx, {
    actorId: admin._id,
    action: "user.reactivated",
    targetType: "user",
    targetId: String(userId),
    targetUserId: userId,
    targetEmail: target.email,
  });

  await createNotification(ctx, {
    userId,
    type: "account_reactivated",
    title: "Your account has been reactivated",
    message: "An administrator has reactivated your account. Welcome back!",
  });

  return target._id;
}

/**
 * FR: "Admins should be able to contact users regarding volunteering
 * activities, this includes sending messages in general (also even if
 * there is no volunteering activities, admin should still be able to
 * contact users)." A general-purpose message delivered as a notification.
 */
export async function sendUserMessage(
  ctx: MutationCtx,
  {
    userId,
    subject,
    message,
  }: { userId: Id<"users">; subject: string; message: string }
) {
  const { user: admin } = await requireAdmin(ctx);
  if (userId === admin._id) {
    throw new ConvexError("You cannot message your own account");
  }
  const target = await ctx.db.get("users", userId);
  if (!target) {
    throw new ConvexError("User not found");
  }

  const cleanSubject = subject.trim();
  const cleanMessage = message.trim();
  if (!cleanSubject) {
    throw new ConvexError("Message subject is required");
  }
  if (cleanSubject.length > MESSAGE_SUBJECT_MAX) {
    throw new ConvexError(
      `Message subject must be ${MESSAGE_SUBJECT_MAX} characters or fewer`
    );
  }
  if (!cleanMessage) {
    throw new ConvexError("Message body is required");
  }
  if (cleanMessage.length > MESSAGE_BODY_MAX) {
    throw new ConvexError(
      `Message body must be ${MESSAGE_BODY_MAX} characters or fewer`
    );
  }

  await createNotification(ctx, {
    userId,
    type: "admin_message",
    title: cleanSubject,
    message: cleanMessage,
  });

  await writeAdminAuditLog(ctx, {
    actorId: admin._id,
    action: "user.messaged",
    targetType: "user",
    targetId: String(userId),
    targetUserId: userId,
    targetEmail: target.email,
    metadata: { subject: cleanSubject },
  });

  return { ok: true };
}

/**
 * FR: "Admins ... [are] able to end a mentorship immediately. All users
 * affected will be notified (such as the person who set up the
 * internship/volunteer, the mentee and the mentor)." This bypasses the
 * normal two-sided exit-feedback flow and ends the mentorship right away.
 */
export async function endMentorshipImmediately(
  ctx: MutationCtx,
  { mentorshipId, reason }: { mentorshipId: Id<"mentorships">; reason?: string }
) {
  const { user: admin } = await requireAdmin(ctx);
  const mentorship = await ctx.db.get("mentorships", mentorshipId);
  if (!mentorship) {
    throw new ConvexError("Mentorship not found");
  }
  if (mentorship.status !== "active") {
    throw new ConvexError("This mentorship has already ended");
  }

  const cleanReason = reason?.trim();
  if (cleanReason && cleanReason.length > 500) {
    throw new ConvexError("Reason must be 500 characters or fewer");
  }

  const now = Date.now();
  await ctx.db.patch("mentorships", mentorshipId, {
    status: "cancelled",
    endDate: now,
    updatedAt: now,
  });

  await writeAdminAuditLog(ctx, {
    actorId: admin._id,
    action: "mentorship.ended_by_admin",
    targetType: "mentorship",
    targetId: String(mentorshipId),
    reason: cleanReason,
  });

  const notifyMessage = cleanReason
    ? `An administrator has ended this mentorship: ${cleanReason}`
    : "An administrator has ended this mentorship immediately.";

  await Promise.all([
    createNotification(ctx, {
      userId: mentorship.mentorId,
      type: "mentorship_ended_by_admin",
      title: "Mentorship ended by an administrator",
      message: notifyMessage,
    }),
    createNotification(ctx, {
      userId: mentorship.menteeId,
      type: "mentorship_ended_by_admin",
      title: "Mentorship ended by an administrator",
      message: notifyMessage,
    }),
  ]);

  return mentorshipId;
}
