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

// Default endpoint for the ACSOBA Member Email Validation API.
// GET {url}?e={email} -> 200 { "exists": 1 | 0 }, 401 if the API key is
// missing/invalid. Override with the ACSOBA_MEMBERS_API_URL env var if the
// service is ever hosted elsewhere (e.g. a staging environment).
const DEFAULT_ACSOBA_MEMBERS_API_URL = "https://members.acsoba.org/api/check";

/**
 * Verifies that the given email is an ACSOBA member by calling the external
 * ACSOBA Member Email Validation API. Set Convex env vars ACSOBA_API_KEY
 * (sent as the X-API-KEY header) and optionally ACSOBA_MEMBERS_API_URL to
 * override the default endpoint.
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

    const baseUrl =
      process.env.ACSOBA_MEMBERS_API_URL?.trim() ||
      DEFAULT_ACSOBA_MEMBERS_API_URL;
    const apiKey = process.env.ACSOBA_API_KEY;

    if (!apiKey) {
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

    let url: URL;
    try {
      url = new URL(baseUrl);
    } catch {
      return {
        success: false,
        message:
          "Membership verification is misconfigured (invalid service URL). Contact an administrator.",
      };
    }
    url.searchParams.set("e", authenticatedEmail);

    try {
      const res = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "X-API-KEY": apiKey,
        },
      });

      if (res.status === 401) {
        return {
          success: false,
          message:
            "Membership verification is misconfigured (the service rejected our API key). Contact an administrator.",
        };
      }

      if (!res.ok) {
        return {
          success: false,
          message:
            "The membership verification service is temporarily unavailable. Please try again or contact an administrator.",
        };
      }

      const data = (await res.json()) as { exists?: 0 | 1 };
      if (data.exists === 1) {
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
