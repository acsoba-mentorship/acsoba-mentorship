import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation } from "./_generated/server";

type VerificationResult = {
  success: boolean;
  skipped?: boolean;
  message?: string;
};

function isVerificationRequired() {
  return process.env.ACSOBA_VERIFICATION_REQUIRED?.trim().toLowerCase() === "true";
}

export const recordMembershipVerification = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    email: v.string(),
    method: v.union(
      v.literal("acsoba_verified"),
      v.literal("auth0_fallback")
    ),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", args.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new Error("Authenticated user record not found");
    }

    await ctx.db.patch("users", user._id, {
      membershipVerificationStatus: args.method,
      membershipVerifiedAt: Date.now(),
      membershipVerifiedEmail: args.email,
    });

    return user._id;
  },
});

/**
 * Verifies that the given email is an ACSOBA member by calling the external
 * ACSOBA API. Set Convex env vars ACSOBA_VERIFY_URL and ACSOBA_API_KEY.
 * Set ACSOBA_VERIFICATION_REQUIRED=true to block onboarding when that service
 * is unavailable; otherwise Auth0 authentication is sufficient.
 * Verification should be right after authentication before onboarding
 */
export const verifyAcsobaMember = action({
  args: {},
  handler: async (ctx): Promise<VerificationResult> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        success: false,
        message: "You must be signed in before verifying your membership.",
      };
    }

    const authenticatedEmail = identity.email?.trim().toLowerCase() ?? "";

    if (!authenticatedEmail) {
      return {
        success: false,
        message: "Your signed-in account does not include an email address.",
      };
    }

    if (identity.emailVerified !== true) {
      return {
        success: false,
        message:
          "Your identity provider has not marked this email address as verified.",
      };
    }

    const url = process.env.ACSOBA_VERIFY_URL;
    const apiKey = process.env.ACSOBA_API_KEY;

    if (!url || !apiKey) {
      if (!isVerificationRequired()) {
        await ctx.runMutation(
          internal.verification.recordMembershipVerification,
          {
            tokenIdentifier: identity.tokenIdentifier,
            email: authenticatedEmail,
            method: "auth0_fallback",
          }
        );
        return {
          success: true,
          skipped: true,
          message:
            "Your Auth0 sign-in is sufficient; additional membership verification is not required.",
        };
      }

      return {
        success: false,
        message:
          "Membership verification is required, but the verification service is not configured. Contact an administrator.",
      };
    }

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ email: authenticatedEmail }),
      });

      if (!res.ok) {
        return {
          success: false,
          message:
            "The membership verification service is temporarily unavailable. Please try again or contact an administrator.",
        };
      }

      const data = (await res.json()) as { verified?: boolean };
      if (data.verified === true) {
        await ctx.runMutation(
          internal.verification.recordMembershipVerification,
          {
            tokenIdentifier: identity.tokenIdentifier,
            email: authenticatedEmail,
            method: "acsoba_verified",
          }
        );
        return { success: true };
      }
      return {
        success: false,
        message:
          "This signed-in email could not be verified as an ACSOBA member.",
      };
    } catch {
      return {
        success: false,
        message:
          "The membership verification service is temporarily unavailable. Please try again or contact an administrator.",
      };
    }
  },
});
