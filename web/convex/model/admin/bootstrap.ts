import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import { writeAdminAuditLog } from "./audit";

export type AdminRole = "admin" | "head_admin";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HEAD_ADMIN_BOOTSTRAP_KEY = "head_admin_v1";

export function normalizeAdminEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getConfiguredHeadAdminEmail() {
  const email = normalizeAdminEmail(process.env.HEAD_ADMIN_EMAIL ?? "");
  return email.length <= 320 && EMAIL_PATTERN.test(email) ? email : null;
}

export function getVerifiedNormalizedAuthEmail(
  authEmail: string | undefined,
  authEmailVerified: boolean
) {
  const normalizedEmail = normalizeAdminEmail(authEmail ?? "");
  return authEmailVerified &&
    normalizedEmail.length <= 320 &&
    EMAIL_PATTERN.test(normalizedEmail)
    ? normalizedEmail
    : undefined;
}

async function getMembershipForUser(
  ctx: MutationCtx,
  userId: Id<"users">
) {
  return ctx.db
    .query("adminMemberships")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
}

async function isUniqueVerifiedUserForEmail(
  ctx: MutationCtx,
  userId: Id<"users">,
  normalizedEmail: string
) {
  const matchingUsers = await ctx.db
    .query("users")
    .withIndex("by_auth_email", (q) =>
      q.eq("authEmailNormalized", normalizedEmail)
    )
    .take(2);

  return (
    matchingUsers.length === 1 &&
    matchingUsers[0]?._id === userId &&
    matchingUsers[0]?.authEmailVerified === true
  );
}

async function activateInvitedMembership(
  ctx: MutationCtx,
  membership: Doc<"adminMemberships">,
  userId: Id<"users">,
  normalizedEmail: string
) {
  if (
    membership.status !== "invited" ||
    membership.normalizedEmail !== normalizedEmail ||
    (membership.userId && membership.userId !== userId) ||
    !(await isUniqueVerifiedUserForEmail(ctx, userId, normalizedEmail))
  ) {
    return null;
  }

  const now = Date.now();
  await ctx.db.patch("adminMemberships", membership._id, {
    status: "active",
    userId,
    activatedAt: now,
    updatedAt: now,
  });

  await writeAdminAuditLog(ctx, {
    actorId: userId,
    action: "admin_membership.claimed",
    targetType: "admin_membership",
    targetId: String(membership._id),
    targetEmail: normalizedEmail,
    targetUserId: userId,
  });

  return {
    ...membership,
    status: "active" as const,
    userId,
    activatedAt: now,
    updatedAt: now,
  };
}

/**
 * Claims a previously invited administrator membership, or performs the
 * one-time head-admin bootstrap. The caller email must come from the verified
 * authentication identity; never pass a profile/contact email here.
 */
export async function claimAdminAccessForUser(
  ctx: MutationCtx,
  {
    userId,
    authEmail,
    authEmailVerified,
  }: {
    userId: Id<"users">;
    authEmail?: string;
    authEmailVerified: boolean;
  }
) {
  const normalizedEmail = getVerifiedNormalizedAuthEmail(
    authEmail,
    authEmailVerified
  );

  if (!normalizedEmail) {
    return null;
  }

  const linkedMembership = await getMembershipForUser(ctx, userId);
  if (linkedMembership) {
    if (linkedMembership.status === "active") {
      return linkedMembership;
    }

    return activateInvitedMembership(
      ctx,
      linkedMembership,
      userId,
      normalizedEmail
    );
  }

  const emailMembership = await ctx.db
    .query("adminMemberships")
    .withIndex("by_normalized_email", (q) =>
      q.eq("normalizedEmail", normalizedEmail)
    )
    .unique();

  if (emailMembership) {
    return activateInvitedMembership(
      ctx,
      emailMembership,
      userId,
      normalizedEmail
    );
  }

  const bootstrapState = await ctx.db
    .query("adminBootstrapState")
    .withIndex("by_key", (q) => q.eq("key", HEAD_ADMIN_BOOTSTRAP_KEY))
    .unique();

  if (
    bootstrapState ||
    normalizedEmail !== getConfiguredHeadAdminEmail() ||
    !(await isUniqueVerifiedUserForEmail(ctx, userId, normalizedEmail))
  ) {
    return null;
  }

  const now = Date.now();
  const membershipId = await ctx.db.insert("adminMemberships", {
    normalizedEmail,
    email: authEmail?.trim() ?? normalizedEmail,
    role: "head_admin",
    status: "active",
    userId,
    invitedAt: now,
    activatedAt: now,
    updatedAt: now,
  });

  await ctx.db.insert("adminBootstrapState", {
    key: HEAD_ADMIN_BOOTSTRAP_KEY,
    membershipId,
    claimedByUserId: userId,
    claimedAt: now,
  });

  await writeAdminAuditLog(ctx, {
    actorId: userId,
    action: "head_admin.bootstrapped",
    targetType: "admin_membership",
    targetId: String(membershipId),
    targetEmail: normalizedEmail,
    targetUserId: userId,
  });

  return ctx.db.get("adminMemberships", membershipId);
}

export async function syncAuthenticatedEmailAndAdminAccess(
  ctx: MutationCtx,
  user: Doc<"users">,
  {
    authEmail,
    authEmailVerified,
  }: {
    authEmail?: string;
    authEmailVerified: boolean;
  }
) {
  const safeNormalizedEmail = getVerifiedNormalizedAuthEmail(
    authEmail,
    authEmailVerified
  );

  if (
    user.authEmailNormalized !== safeNormalizedEmail ||
    user.authEmailVerified !== authEmailVerified
  ) {
    await ctx.db.patch("users", user._id, {
      authEmailNormalized: safeNormalizedEmail,
      authEmailVerified,
    });
  }

  return claimAdminAccessForUser(ctx, {
    userId: user._id,
    authEmail,
    authEmailVerified,
  });
}
