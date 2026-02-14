import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const onboardingStatusValidator = v.union(
  v.literal("new"),
  v.literal("verification_pending"),
  v.literal("verified"),
  v.literal("user_profile_complete"),
  v.literal("mentee_profile_setup_complete")
);

export const storeUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // 1. Look up the user by their unique Auth0 identifier
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    // 2. If they exist, return their internal Convex ID
    if (user !== null) {
      return user._id;
    }

    // 3. If new, create the bridge record with onboardingStatus: "new"
    return await ctx.db.insert("users", {
      name: identity.name ?? "",
      dateOfBirth: 0,
      gender: "",
      nationality: "",
      tokenIdentifier: identity.tokenIdentifier, // THE LINK
      profilePictureUrl: "",
      bio: "",
      location: "",
      email: identity.email ?? "",
      phoneNumber: "",
      education: [],
      experience: [],
      onboardingStatus: "new",
      // Mentee/Mentor profiles stay empty until they set them up
      // so we omit menteeProfile and mentorProfile here on purpose.
      createdAt: Date.now(),
    });
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
  },
});

// Ensures that users can only transition to the next status in the onboarding process
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  new: ["verification_pending"],
  verification_pending: ["verified"],
  verified: ["user_profile_complete"],
  user_profile_complete: ["mentee_profile_setup_complete"],
  mentee_profile_setup_complete: ["mentee_profile_setup_complete"], // idempotent
};

export const setOnboardingStatus = mutation({
  args: { status: onboardingStatusValidator },
  handler: async (ctx, { status }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) throw new Error("User not found");

    const current = user.onboardingStatus ?? "new";
    // Updates the user's onboarding status to the next valid status in the onboarding process
    const allowed = ALLOWED_TRANSITIONS[current];
    if (!allowed?.includes(status)) {
      throw new Error(`Invalid transition from ${current} to ${status}`);
    }

    await ctx.db.patch(user._id, { onboardingStatus: status });
    return user._id;
  },
});

// User profile fields collected during onboarding (after verification)
const updateUserProfileArgs = v.object({
  name: v.string(),
  gender: v.string(),
  nationality: v.string(),
  phoneNumber: v.string(),
  dateOfBirth: v.optional(v.number()),
  bio: v.optional(v.string()),
  location: v.optional(v.string()),
});

export const updateUserProfile = mutation({
  args: updateUserProfileArgs,
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) throw new Error("User not found");

    const current = user.onboardingStatus ?? "new";
    const allowed = ALLOWED_TRANSITIONS[current];
    if (!allowed?.includes("user_profile_complete")) {
      throw new Error(
        `Cannot complete user profile from status ${current}; complete verification first.`
      );
    }

    await ctx.db.patch(user._id, {
      name: args.name,
      gender: args.gender,
      nationality: args.nationality,
      phoneNumber: args.phoneNumber,
      ...(args.dateOfBirth !== undefined && { dateOfBirth: args.dateOfBirth }),
      ...(args.bio !== undefined && { bio: args.bio }),
      ...(args.location !== undefined && { location: args.location }),
      onboardingStatus: "user_profile_complete",
    });
    return user._id;
  },
});

const menteeProfileArgs = v.object({
  goals: v.string(),
  interests: v.array(v.string()),
});

export const updateMenteeProfile = mutation({
  args: menteeProfileArgs,
  handler: async (ctx, { goals, interests }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) throw new Error("User not found");

    const current = user.onboardingStatus ?? "new";
    const allowed = ALLOWED_TRANSITIONS[current];
    if (!allowed?.includes("mentee_profile_setup_complete")) {
      throw new Error(
        `Cannot complete mentee profile from status ${current}; complete user profile first.`
      );
    }

    const menteeProfile = { goals, interests };
    await ctx.db.patch(user._id, {
      menteeProfile,
      onboardingStatus: "mentee_profile_setup_complete",
    });
    return user._id;
  },
});