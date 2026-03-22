import { mutation, query, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";

const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 20;
const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9_]*[a-z0-9])?$/;
const USERNAME_CHANGE_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function isValidUsername(username: string): boolean {
  if (
    username.length < USERNAME_MIN_LENGTH ||
    username.length > USERNAME_MAX_LENGTH
  ) {
    return false;
  }
  return USERNAME_PATTERN.test(username);
}

function slugifyForUsername(input: string): string {
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");

  if (!slug) {
    return "user";
  }

  if (slug.length < USERNAME_MIN_LENGTH) {
    return `${slug}${"x".repeat(USERNAME_MIN_LENGTH - slug.length)}`;
  }

  return slug.slice(0, USERNAME_MAX_LENGTH);
}

function makeTemporaryCandidate(base: string): string {
  const suffix = Math.random().toString(36).slice(2, 8);
  const normalizedBase = slugifyForUsername(base);
  const maxBaseLength = USERNAME_MAX_LENGTH - suffix.length - 1;
  const trimmedBase = normalizedBase.slice(0, Math.max(maxBaseLength, 1));
  return `${trimmedBase}_${suffix}`;
}

async function ensureUniqueTemporaryUsername(
  ctx: MutationCtx,
  base: string
): Promise<string> {
  for (let i = 0; i < 10; i += 1) {
    const candidate = makeTemporaryCandidate(base);
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", candidate))
      .unique();
    if (!existing) {
      return candidate;
    }
  }
  throw new Error("Failed to generate a unique temporary username");
}

function buildUsernameStatus(user: {
  usernameUpdatedAt: number;
  isTemporaryUsername: boolean;
}) {
  if (user.isTemporaryUsername) {
    return {
      canChangeUsername: true,
      nextUsernameChangeAt: null as number | null,
      isTemporaryUsername: true,
    };
  }

  const now = Date.now();
  const nextAllowedAt = user.usernameUpdatedAt + USERNAME_CHANGE_COOLDOWN_MS;
  const canChange = now >= nextAllowedAt;

  return {
    canChangeUsername: canChange,
    nextUsernameChangeAt: canChange ? null : nextAllowedAt,
    isTemporaryUsername: false,
  };
}

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
    const temporaryUsername = await ensureUniqueTemporaryUsername(
      ctx,
      identity.name ?? "user"
    );

    return await ctx.db.insert("users", {
      name: identity.name ?? "",
      username: temporaryUsername,
      usernameUpdatedAt: Date.now(),
      isTemporaryUsername: true,
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

export const getUserByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const normalized = normalizeUsername(username);
    if (!isValidUsername(normalized)) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", normalized))
      .unique();

    if (!user) return null;

    return {
      username: user.username,
      name: user.name,
      title: user.title,
      bio: user.bio,
      location: user.location,
      profilePictureUrl: user.profilePictureUrl,
      education: user.education,
      experience: user.experience,
      menteeProfile: user.menteeProfile,
      mentorProfile: user.mentorProfile,
    };
  },
});

/** Check whether a username is already taken. Used by the profile edit form
 *  to validate uniqueness without leaking any user data to the caller. */
export const checkUsernameAvailable = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const normalized = normalizeUsername(username);
    if (!isValidUsername(normalized)) {
      return { available: false };
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", normalized))
      .unique();

    return { available: existing === null };
  },
});

const MENTOR_LIST_MAX = 100;

function toPublicMentorDTO(user: {
  username: string;
  name: string;
  title: string;
  bio: string;
  location: string;
  profilePictureUrl: string;
  mentorProfile?: {
    yearsOfExperience: number;
    industries: string[];
    expertise: string[];
    maxMentees: number;
    isAvailable: boolean;
  };
}) {
  return {
    username: user.username,
    name: user.name,
    title: user.title,
    bio: user.bio,
    location: user.location,
    profilePictureUrl: user.profilePictureUrl,
    mentorProfile: user.mentorProfile,
  };
}

export const listMentors = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const effectiveLimit = Math.min(
      Math.max(limit ?? MENTOR_LIST_MAX, 1),
      MENTOR_LIST_MAX
    );

    // Fetch available mentors first up to the limit
    const available = await ctx.db
      .query("users")
      .withIndex("by_mentor_availability", (q) =>
        q.eq("mentorProfile.isAvailable", true)
      )
      .take(effectiveLimit);

    const remaining = effectiveLimit - available.length;

    // Fill remaining slots with unavailable mentors only if needed
    const unavailable =
      remaining > 0
        ? await ctx.db
            .query("users")
            .withIndex("by_mentor_availability", (q) =>
              q.eq("mentorProfile.isAvailable", false)
            )
            .take(remaining)
        : [];

    return [...available, ...unavailable].map(toPublicMentorDTO);
  },
});

export const getUsernameChangeStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new Error("User not found");

    return buildUsernameStatus(user);
  },
});

export const updateUsername = mutation({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const normalized = normalizeUsername(username);
    if (!isValidUsername(normalized)) {
      throw new Error(
        "Invalid username. Use 3-20 lowercase letters, numbers, or underscores."
      );
    }

    const user = await ctx.db      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) throw new Error("User not found");
    if (user.username === normalized) {
      return {
        userId: user._id,
        username: user.username,
        ...buildUsernameStatus(user),
      };
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", normalized))
      .unique();
    if (existing) {
      throw new Error("Username already taken");
    }

    const now = Date.now();
    const nextAllowedAt = user.usernameUpdatedAt + USERNAME_CHANGE_COOLDOWN_MS;
    const canBypassCooldown = user.isTemporaryUsername;
    if (!canBypassCooldown && now < nextAllowedAt) {
      throw new Error(
        `Username can be changed again on ${new Date(nextAllowedAt).toISOString()}`
      );
    }

    await ctx.db.patch(user._id, {
      username: normalized,
      usernameUpdatedAt: now,
      isTemporaryUsername: false,
    });

    return {
      userId: user._id,
      username: normalized,
      canChangeUsername: false,
      nextUsernameChangeAt: now + USERNAME_CHANGE_COOLDOWN_MS,
      isTemporaryUsername: false,
    };
  },
});

// Ensures// Ensures that users can only transition to the next status in the onboarding process
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
