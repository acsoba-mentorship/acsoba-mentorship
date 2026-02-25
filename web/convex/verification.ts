import { action } from "./_generated/server";
import { v } from "convex/values";

/**
 * Verifies that the given email is an ACSOBA member by calling the external
 * ACSOBA API. Set Convex env vars ACSOBA_VERIFY_URL and ACSOBA_API_KEY.
 * Client should call setOnboardingStatus({ status: "verified" }) after success.
 */
export const verifyAcsobaMember = action({
  args: {
    email: v.string(),
  },
  handler: async (_ctx, { email }): Promise<{ success: boolean; message?: string }> => {
    const url = process.env.ACSOBA_VERIFY_URL;
    const apiKey = process.env.ACSOBA_API_KEY;

    if (!url || !apiKey) {
      return {
        success: false,
        message: "Verification service is not configured.",
      };
    }

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const text = await res.text();
        return {
          success: false,
          message: text || `Verification failed (${res.status})`,
        };
      }

      const data = (await res.json()) as { verified?: boolean; message?: string };
      if (data.verified === true) {
        return { success: true };
      }
      return {
        success: false,
        message: data.message ?? "Email is not a verified ACSOBA member.",
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Verification request failed.";
      return { success: false, message };
    }
  },
});
