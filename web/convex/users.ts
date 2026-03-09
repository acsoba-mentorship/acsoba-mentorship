import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const onboardingStatusValidator = v.union(
  v.literal("new"),
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
      title: "",
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
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    return currentUser;
  },
});

// Ensures that users can only transition to the next status in the onboarding process
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  new: ["verified"],
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

// Post-onboarding profile editing (owner-only, derived from auth identity)

const updateUserProfileBasicsArgs = v.object({
  bio: v.optional(v.string()),
  location: v.optional(v.string()),
  title: v.optional(v.string()),
});

export const updateUserProfileBasics = mutation({
  args: updateUserProfileBasicsArgs,
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) throw new Error("User not found");

    const patch: Record<string, unknown> = {};
    if (args.bio !== undefined) patch.bio = args.bio;
    if (args.location !== undefined) patch.location = args.location;
    if (args.title !== undefined) patch.title = args.title;

    if (Object.keys(patch).length === 0) {
      return user._id;
    }

    await ctx.db.patch(user._id, patch);
    return user._id;
  },
});

const updateMenteeProfileDetailsArgs = v.object({
  goals: v.optional(v.string()),
  interests: v.optional(v.array(v.string())),
});

export const updateMenteeProfileDetails = mutation({
  args: updateMenteeProfileDetailsArgs,
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) throw new Error("User not found");

    const previous = user.menteeProfile ?? { goals: "", interests: [] as string[] };

    const menteeProfile = {
      goals: args.goals ?? previous.goals,
      interests: args.interests ?? previous.interests,
    };

    await ctx.db.patch(user._id, { menteeProfile });
    return user._id;
  },
});

const mentorProfileArgs = v.object({
  yearsOfExperience: v.number(),
  industries: v.array(v.string()),
  expertise: v.array(v.string()),
  maxMentees: v.number(),
  isAvailable: v.boolean(),
});

export const updateMentorProfile = mutation({
  args: mentorProfileArgs,
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) throw new Error("User not found");

    const mentorProfile = {
      yearsOfExperience: args.yearsOfExperience,
      industries: args.industries,
      expertise: args.expertise,
      maxMentees: args.maxMentees,
      isAvailable: args.isAvailable,
    };

    await ctx.db.patch(user._id, { mentorProfile });
    return user._id;
  },
});

const educationEntry = v.object({
  institution: v.string(),
  degree: v.optional(v.string()),
  fieldOfStudy: v.optional(v.string()),
  startDate: v.number(),
  endDate: v.optional(v.number()),
  description: v.optional(v.string()),
});

export const addEducation = mutation({
  args: { entry: educationEntry },
  handler: async (ctx, { entry }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) throw new Error("User not found");

    const education = [...user.education, entry];
    await ctx.db.patch(user._id, { education });
    return user._id;
  },
});

export const updateEducation = mutation({
  args: { index: v.number(), entry: educationEntry },
  handler: async (ctx, { index, entry }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) throw new Error("User not found");

    if (index < 0 || index >= user.education.length) {
      throw new Error("Invalid education index");
    }

    const education = user.education.map((item, idx) =>
      idx === index ? entry : item
    );

    await ctx.db.patch(user._id, { education });
    return user._id;
  },
});

export const deleteEducation = mutation({
  args: { index: v.number() },
  handler: async (ctx, { index }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) throw new Error("User not found");

    if (index < 0 || index >= user.education.length) {
      throw new Error("Invalid education index");
    }

    const education = user.education.filter((_, idx) => idx !== index);
    await ctx.db.patch(user._id, { education });
    return user._id;
  },
});

const experienceEntry = v.object({
  company: v.string(),
  title: v.string(),
  startDate: v.number(),
  endDate: v.optional(v.number()),
  description: v.optional(v.string()),
});

export const addExperience = mutation({
  args: { entry: experienceEntry },
  handler: async (ctx, { entry }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) throw new Error("User not found");

    const experience = [...user.experience, entry];
    await ctx.db.patch(user._id, { experience });
    return user._id;
  },
});

export const updateExperience = mutation({
  args: { index: v.number(), entry: experienceEntry },
  handler: async (ctx, { index, entry }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) throw new Error("User not found");

    if (index < 0 || index >= user.experience.length) {
      throw new Error("Invalid experience index");
    }

    const experience = user.experience.map((item, idx) =>
      idx === index ? entry : item
    );

    await ctx.db.patch(user._id, { experience });
    return user._id;
  },
});

export const deleteExperience = mutation({
  args: { index: v.number() },
  handler: async (ctx, { index }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) throw new Error("User not found");

    if (index < 0 || index >= user.experience.length) {
      throw new Error("Invalid experience index");
    }

    const experience = user.experience.filter((_, idx) => idx !== index);
    await ctx.db.patch(user._id, { experience });
    return user._id;
  },
});