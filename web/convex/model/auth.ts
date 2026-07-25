import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { ONBOARDING_STATUS } from "./users/fields";

type AuthCtx = QueryCtx | MutationCtx;

/**
 * Loads the currently authenticated user document.
 */
export async function getAuthenticatedUser(ctx: AuthCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  const currentUser = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();

  if (!currentUser) {
    throw new Error("User not found");
  }

  return currentUser;
}

/**
 * Ensures that the authenticated user has a mentor profile.
 */
export function requireMentorProfile(user: Doc<"users">): Doc<"users"> {
  if (!user.mentorProfile) {
    throw new Error("Only mentors can perform this action");
  }
  return user;
}

/**
 * Ensures the authenticated user has completed onboarding before accessing app data.
 */
export function requireOnboardingComplete(user: Doc<"users">): Doc<"users"> {
  if (user.onboardingStatus !== ONBOARDING_STATUS.COMPLETE) {
    throw new Error("Onboarding is not complete");
  }
  return user;
}

/**
 * Ensures that the authenticated user has a mentee profile.
 */
export function requireMenteeProfile(user: Doc<"users">): Doc<"users"> {
  if (!user.menteeProfile) {
    throw new Error("Only mentees can perform this action");
  }
  return user;
}

/**
 * Ensures the caller has operational administrator access.
 */
export async function requireAdmin(ctx: AuthCtx) {
  const user = await getAuthenticatedUser(ctx);
  const membership = await ctx.db
    .query("adminMemberships")
    .withIndex("by_user", (q) => q.eq("userId", user._id))
    .unique();

  if (!membership || membership.status !== "active") {
    throw new Error("Administrator access required");
  }

  return { user, membership };
}

/**
 * Ensures the caller is the environment-seeded head administrator.
 */
export async function requireHeadAdmin(ctx: AuthCtx) {
  const principal = await requireAdmin(ctx);
  if (principal.membership.role !== "head_admin") {
    throw new Error("Head administrator access required");
  }
  return principal;
}
