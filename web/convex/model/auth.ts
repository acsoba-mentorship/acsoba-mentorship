import { ConvexError } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { ACCOUNT_STATUS, ONBOARDING_STATUS } from "./users/fields";

type AuthCtx = QueryCtx | MutationCtx;

/**
 * Loads the currently authenticated user document.
 */
export async function getAuthenticatedUser(ctx: AuthCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("Not authenticated");
  }

  const currentUser = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();

  if (!currentUser) {
    throw new ConvexError("User not found");
  }

  return currentUser;
}

/**
 * Ensures that the authenticated user has a mentor profile.
 */
export function requireMentorProfile(user: Doc<"users">): Doc<"users"> {
  if (!user.mentorProfile) {
    throw new ConvexError("Only mentors can perform this action");
  }
  return user;
}

/**
 * Blocks suspended accounts from taking any action. Admins suspend accounts
 * temporarily (see convex/model/admin.ts); a suspended user should not be
 * able to apply for internships, message anyone, sign up for volunteering,
 * etc. while suspended, even though they can still sign in to see the
 * suspension notice.
 */
export function requireActiveAccount(user: Doc<"users">): Doc<"users"> {
  if (user.accountStatus === ACCOUNT_STATUS.SUSPENDED) {
    throw new ConvexError(
      "Your account has been temporarily suspended by an administrator. Contact ACSOBA support if you believe this is a mistake."
    );
  }
  return user;
}

/**
 * Ensures the authenticated user has completed onboarding and is not
 * suspended before accessing app data.
 */
export function requireOnboardingComplete(user: Doc<"users">): Doc<"users"> {
  if (user.onboardingStatus !== ONBOARDING_STATUS.COMPLETE) {
    throw new ConvexError("Onboarding is not complete");
  }
  return requireActiveAccount(user);
}

/**
 * Ensures that the authenticated user has a mentee profile.
 */
export function requireMenteeProfile(user: Doc<"users">): Doc<"users"> {
  if (!user.menteeProfile) {
    throw new ConvexError("Only mentees can perform this action");
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
    throw new ConvexError("Administrator access required");
  }

  return { user, membership };
}

/**
 * Ensures the caller is the environment-seeded head administrator.
 */
export async function requireHeadAdmin(ctx: AuthCtx) {
  const principal = await requireAdmin(ctx);
  if (principal.membership.role !== "head_admin") {
    throw new ConvexError("Head administrator access required");
  }
  return principal;
}
