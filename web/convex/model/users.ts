import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Infer } from "convex/values";
import {
  ANONYMOUS_MENTOR_NAME,
  buildUsernameStatus,
  DEFAULT_MENTOR_PRIVACY_SETTINGS,
  GOALS_MAX_CHARACTERS,
  isValidUsername,
  makeTemporaryCandidate,
  MENTOR_LIST_MAX,
  normalizeUsername,
  resolveMentorIdentityVisibility,
  toPublicMentorDTO,
  USERNAME_CHANGE_COOLDOWN_MS,
} from "../helper";
import {
  setUserOnboardingCompleteArgsValidator,
  updateMentorPrivacySettingsArgsValidator,
  updateUserProfileArgsValidator,
} from "./users/validators";
import {
  CAREER_STAGE,
  COMMITMENT_LEVEL,
  educationEntryValidator,
  experienceEntryValidator,
  menteeProfileValidator,
  mentorProfileValidator,
  ONBOARDING_STATUS,
  mentorPrivacySettingsValidator,
  usersTableFields,
} from "./users/fields";
import { getAuthenticatedUser, requireOnboardingComplete } from "./auth";

const CONVEX_ID_PATTERN = /^[a-z0-9]{16,64}$/i;

async function hasAcceptedMentorship(
  ctx: QueryCtx,
  viewerId: Id<"users">,
  mentorId: Id<"users">
) {
  if (viewerId === mentorId) {
    return true;
  }

  const requests = await ctx.db
    .query("mentorshipRequests")
    .withIndex("by_mentorId_menteeId", (q) =>
      q.eq("mentorId", mentorId).eq("menteeId", viewerId)
    )
    .collect();

  return requests.some((request) => request.status === "accepted");
}

async function getAcceptedMentorIdsForMentee(ctx: QueryCtx, menteeId: Id<"users">) {
  const requests = await ctx.db
    .query("mentorshipRequests")
    .withIndex("by_menteeId_status", (q) =>
      q.eq("menteeId", menteeId).eq("status", "accepted")
    )
    .collect();

  return new Set(requests.map((request) => request.mentorId));
}

async function toPublicUserProfile(
  ctx: QueryCtx,
  currentUser: Doc<"users">,
  user: Doc<"users">
) {
  const forceRevealIdentity =
    !!user.mentorProfile && (await hasAcceptedMentorship(ctx, currentUser._id, user._id));
  const mentorVisibility = resolveMentorIdentityVisibility(
    user.mentorSettings?.privacy,
    forceRevealIdentity
  );
  const shouldApplyMentorPrivacy = !!user.mentorProfile;

  return {
    userId: user._id,
    username: shouldApplyMentorPrivacy && !mentorVisibility.username ? null : user.username,
    name:
      shouldApplyMentorPrivacy && !mentorVisibility.name
        ? ANONYMOUS_MENTOR_NAME
        : user.name,
    title: user.title,
    bio: user.bio,
    location: user.location,
    profilePictureUrl: user.profilePictureUrl,
    email: shouldApplyMentorPrivacy && mentorVisibility.email ? user.email : null,
    phoneNumber:
      shouldApplyMentorPrivacy && mentorVisibility.phoneNumber ? user.phoneNumber : null,
    education: user.education,
    experience: user.experience,
    interests: user.interests ?? [],
    industries: user.industries ?? [],
    menteeProfile: user.menteeProfile,
    mentorProfile: user.mentorProfile,
  };
}

/**
 * Generates a unique temporary username for newly created users.
 */
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

/**
 * Creates the initial user record for a first-time authenticated user.
 */
export async function storeUser(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();

  if (user !== null) {
    return user._id;
  }

  const now = Date.now();
  const identityName = identity.name?.trim();
  const identityEmail = identity.email?.trim() ?? "";
  const displayName =
    identityName && !identityName.includes("@")
      ? identityName
      : identityEmail.split("@")[0] || "";
  const temporaryUsername = await ensureUniqueTemporaryUsername(
    ctx,
    displayName || "user"
  );

  return await ctx.db.insert("users", {
    name: displayName,
    username: temporaryUsername,
    usernameUpdatedAt: now,
    isTemporaryUsername: true,
    dateOfBirth: 0,
    gender: "",
    nationality: "",
    tokenIdentifier: identity.tokenIdentifier,
    profilePictureUrl: "",
    title: "",
    bio: "",
    location: "",
    email: identityEmail,
    phoneNumber: "",
    interests: [],
    industries: [],
    education: [],
    experience: [],
    onboardingStatus: ONBOARDING_STATUS.INCOMPLETE,
    createdAt: now,
  });
}

/**
 * Returns the currently authenticated user, or null when not authenticated.
 */
export async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }
  return await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
}

/**
 * Loads a public user profile by username.
 */
export async function getUserByUsername(
  ctx: QueryCtx,
  { username }: { username: Infer<typeof usersTableFields.username> }
) {
  const currentUser = requireOnboardingComplete(await getAuthenticatedUser(ctx));

  const normalized = normalizeUsername(username);
  if (!isValidUsername(normalized)) {
    return null;
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_username", (q) => q.eq("username", normalized))
    .unique();

  if (!user) {
    return null;
  }

  return toPublicUserProfile(ctx, currentUser, user);
}

/**
 * Loads a privacy-safe public user profile by user ID.
 */
export async function getUserById(
  ctx: QueryCtx,
  { userId }: { userId: string }
) {
  const currentUser = requireOnboardingComplete(await getAuthenticatedUser(ctx));
  if (!CONVEX_ID_PATTERN.test(userId)) {
    return null;
  }

  let user: Doc<"users"> | null;
  try {
    user = await ctx.db.get("users", userId as Id<"users">);
  } catch {
    return null;
  }

  if (!user) {
    return null;
  }

  return toPublicUserProfile(ctx, currentUser, user);
}

/**
 * Checks whether a normalized username is available.
 */
export async function checkUsernameAvailable(
  ctx: QueryCtx,
  { username }: { username: Infer<typeof usersTableFields.username> }
) {
  requireOnboardingComplete(await getAuthenticatedUser(ctx));

  const normalized = normalizeUsername(username);
  if (!isValidUsername(normalized)) {
    return { available: false };
  }

  const existing = await ctx.db
    .query("users")
    .withIndex("by_username", (q) => q.eq("username", normalized))
    .unique();

  return { available: existing === null };
}

/**
 * Lists mentors prioritized by availability.
 */
export async function listMentors(
  ctx: QueryCtx,
  { limit }: { limit?: number }
) {
  const currentUser = requireOnboardingComplete(await getAuthenticatedUser(ctx));

  const effectiveLimit = Math.min(Math.max(limit ?? MENTOR_LIST_MAX, 1), MENTOR_LIST_MAX);

  const available = await ctx.db
    .query("users")
    .withIndex("by_mentor_availability", (q) => q.eq("mentorProfile.isAvailable", true))
    .take(effectiveLimit);

  const remaining = effectiveLimit - available.length;
  const unavailable =
    remaining > 0
      ? await ctx.db
          .query("users")
          .withIndex("by_mentor_availability", (q) => q.eq("mentorProfile.isAvailable", false))
          .take(remaining)
      : [];

  const acceptedMentorIds = await getAcceptedMentorIdsForMentee(ctx, currentUser._id);

  return [...available, ...unavailable].map((mentor) =>
    toPublicMentorDTO(mentor, {
      forceRevealIdentity:
        mentor._id === currentUser._id || acceptedMentorIds.has(mentor._id),
    })
  );
}

/**
 * Returns the caller's mentor privacy settings with defaults filled in.
 */
export async function getMyMentorPrivacySettings(ctx: QueryCtx) {
  const user = requireOnboardingComplete(await getAuthenticatedUser(ctx));
  return user.mentorSettings?.privacy ?? DEFAULT_MENTOR_PRIVACY_SETTINGS;
}

/**
 * Updates the caller's mentor privacy settings while preserving omitted fields.
 */
export async function updateMyMentorPrivacySettings(
  ctx: MutationCtx,
  args: Infer<typeof updateMentorPrivacySettingsArgsValidator>
) {
  const user = requireOnboardingComplete(await getAuthenticatedUser(ctx));
  const previous = user.mentorSettings?.privacy ?? DEFAULT_MENTOR_PRIVACY_SETTINGS;

  const privacy: Infer<typeof mentorPrivacySettingsValidator> = {
    masterIdentityDisclosure:
      args.masterIdentityDisclosure ?? previous.masterIdentityDisclosure,
    overrides: {
      name:
        args.overrides?.name ??
        previous.overrides?.name ??
        DEFAULT_MENTOR_PRIVACY_SETTINGS.overrides.name,
      email:
        args.overrides?.email ??
        previous.overrides?.email ??
        DEFAULT_MENTOR_PRIVACY_SETTINGS.overrides.email,
      phoneNumber:
        args.overrides?.phoneNumber ??
        previous.overrides?.phoneNumber ??
        DEFAULT_MENTOR_PRIVACY_SETTINGS.overrides.phoneNumber,
    },
  };

  await ctx.db.patch("users", user._id, {
    mentorSettings: {
      ...(user.mentorSettings ?? {}),
      privacy,
    },
  });

  return privacy;
}

/**
 * Returns username change cooldown status using client-provided current time.
 */
export async function getUsernameChangeStatus(
  ctx: QueryCtx,
  { nowMs }: { nowMs: number }
) {
  const user = await getAuthenticatedUser(ctx);
  return buildUsernameStatus(user, nowMs);
}

/**
 * Updates the username when validation, uniqueness and cooldown checks pass.
 */
export async function updateUsername(
  ctx: MutationCtx,
  { username }: { username: Infer<typeof usersTableFields.username> }
) {
  const user = requireOnboardingComplete(await getAuthenticatedUser(ctx));

  const normalized = normalizeUsername(username);
  if (!isValidUsername(normalized)) {
    throw new Error(
      "Invalid username. Use 3-20 lowercase letters, numbers, or underscores."
    );
  }

  if (user.username === normalized) {
    return {
      userId: user._id,
      username: user.username,
      ...buildUsernameStatus(user, Date.now()),
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

  await ctx.db.patch("users", user._id, {
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
}

/**
 * Saves required user profile details without changing onboarding status.
 */
export async function updateUserProfile(
  ctx: MutationCtx,
  args: Infer<typeof updateUserProfileArgsValidator>
) {
  const user = requireOnboardingComplete(await getAuthenticatedUser(ctx));

  await ctx.db.patch("users", user._id, {
    name: args.name,
    gender: args.gender,
    nationality: args.nationality,
    phoneNumber: args.phoneNumber,
    ...(args.dateOfBirth !== undefined && { dateOfBirth: args.dateOfBirth }),
    ...(args.bio !== undefined && { bio: args.bio }),
    ...(args.location !== undefined && { location: args.location }),
  });
  return user._id;
}

/**
 * Creates or replaces the mentee profile without changing onboarding status.
 */
export async function updateMenteeProfile(
  ctx: MutationCtx,
  args: Infer<typeof menteeProfileValidator>
) {
  const user = requireOnboardingComplete(await getAuthenticatedUser(ctx));

  await ctx.db.patch("users", user._id, {
    menteeProfile: args,
  });
  return user._id;
}

/**
 * Writes the complete mentee onboarding payload and marks onboarding complete.
 */
export async function setUserOnboardingComplete(
  ctx: MutationCtx,
  args: Infer<typeof setUserOnboardingCompleteArgsValidator>
) {
  const user = await getAuthenticatedUser(ctx);

  if (args.careerStage === CAREER_STAGE.STUDENT && args.education.length === 0) {
    throw new Error("At least one education entry is required for students");
  }

  if (
    args.careerStage === CAREER_STAGE.PROFESSIONAL &&
    args.experience.length === 0
  ) {
    throw new Error("At least one experience entry is required");
  }

  if (args.menteeProfile.goals.trim().length > GOALS_MAX_CHARACTERS) {
    throw new Error(`Goals must be at most ${GOALS_MAX_CHARACTERS} characters`);
  }
  if (args.interests.length < 1 || args.interests.length > 3) {
    throw new Error("Select between 1 and 3 interests");
  }
  if (args.industries.length < 1 || args.industries.length > 3) {
    throw new Error("Select between 1 and 3 industries");
  }

  await ctx.db.patch("users", user._id, {
    name: args.personalDetails.name,
    email: args.personalDetails.email,
    gender: args.personalDetails.gender,
    nationality: args.personalDetails.nationality,
    phoneNumber: args.personalDetails.phoneNumber,
    dateOfBirth: args.personalDetails.dateOfBirth,
    careerStage: args.careerStage,
    education: args.education,
    experience: args.experience,
    interests: args.interests,
    industries: args.industries,
    menteeProfile: {
      goals: args.menteeProfile.goals,
      commitmentLevel: args.menteeProfile.commitmentLevel,
      preferredCommunicationModes: args.menteeProfile.preferredCommunicationModes,
    },
    onboardingStatus: ONBOARDING_STATUS.COMPLETE,
  });

  return user._id;
}

/**
 * Applies owner-only updates to basic profile fields.
 */
export async function updateUserProfileBasics(
  ctx: MutationCtx,
  args: {
    bio?: Infer<typeof usersTableFields.bio>;
    location?: Infer<typeof usersTableFields.location>;
    title?: Infer<typeof usersTableFields.title>;
  }
) {
  const user = requireOnboardingComplete(await getAuthenticatedUser(ctx));

  const patch: Partial<Pick<Doc<"users">, "bio" | "location" | "title">> = {};
  if (args.bio !== undefined) {
    patch.bio = args.bio;
  }
  if (args.location !== undefined) {
    patch.location = args.location;
  }
  if (args.title !== undefined) {
    patch.title = args.title;
  }

  if (Object.keys(patch).length === 0) {
    return user._id;
  }

  await ctx.db.patch("users", user._id, patch);
  return user._id;
}

/**
 * Partially updates the mentee profile while preserving unspecified fields.
 */
export async function updateMenteeProfileDetails(
  ctx: MutationCtx,
  args: {
    goals?: Infer<typeof menteeProfileValidator.fields.goals>;
    commitmentLevel?: Infer<typeof menteeProfileValidator.fields.commitmentLevel>;
    preferredCommunicationModes?: Infer<
      typeof menteeProfileValidator.fields.preferredCommunicationModes
    >;
  }
) {
  const user = requireOnboardingComplete(await getAuthenticatedUser(ctx));
  const previous =
    user.menteeProfile ??
    {
      goals: "",
      commitmentLevel: COMMITMENT_LEVEL.MONTHLY,
      preferredCommunicationModes: [] as Infer<
        typeof menteeProfileValidator.fields.preferredCommunicationModes
      >,
    };

  if (
    args.goals !== undefined &&
    args.goals.trim().length > GOALS_MAX_CHARACTERS
  ) {
    throw new Error(`Goals must be at most ${GOALS_MAX_CHARACTERS} characters`);
  }

  const menteeProfile = {
    goals: args.goals ?? previous.goals,
    commitmentLevel: args.commitmentLevel ?? previous.commitmentLevel,
    preferredCommunicationModes:
      args.preferredCommunicationModes ?? previous.preferredCommunicationModes,
  };

  await ctx.db.patch("users", user._id, { menteeProfile });
  return user._id;
}

/**
 * Replaces the caller's interest tags.
 */
export async function updateUserInterests(
  ctx: MutationCtx,
  args: { interests: Infer<typeof usersTableFields.interests> }
) {
  const user = requireOnboardingComplete(await getAuthenticatedUser(ctx));
  await ctx.db.patch("users", user._id, { interests: args.interests });
  return user._id;
}

/**
 * Replaces the caller's industry tags.
 */
export async function updateUserIndustries(
  ctx: MutationCtx,
  args: { industries: Infer<typeof usersTableFields.industries> }
) {
  const user = requireOnboardingComplete(await getAuthenticatedUser(ctx));
  await ctx.db.patch("users", user._id, { industries: args.industries });
  return user._id;
}

/**
 * Replaces the mentor profile fields.
 */
export async function updateMentorProfile(
  ctx: MutationCtx,
  args: Infer<typeof mentorProfileValidator>
) {
  const user = requireOnboardingComplete(await getAuthenticatedUser(ctx));

  await ctx.db.patch("users", user._id, {
    mentorProfile: {
      yearsOfExperience: args.yearsOfExperience,
      expertise: args.expertise,
      maxMentees: args.maxMentees,
      isAvailable: args.isAvailable,
    },
  });
  return user._id;
}

/**
 * Adds one education entry to the user profile.
 */
export async function addEducation(
  ctx: MutationCtx,
  { entry }: { entry: Infer<typeof educationEntryValidator> }
) {
  const user = requireOnboardingComplete(await getAuthenticatedUser(ctx));
  await ctx.db.patch("users", user._id, { education: [...user.education, entry] });
  return user._id;
}

/**
 * Replaces an existing education entry by index.
 */
export async function updateEducation(
  ctx: MutationCtx,
  {
    index,
    entry,
  }: {
    index: number;
    entry: Infer<typeof educationEntryValidator>;
  }
) {
  const user = requireOnboardingComplete(await getAuthenticatedUser(ctx));

  if (index < 0 || index >= user.education.length) {
    throw new Error("Invalid education index");
  }

  await ctx.db.patch("users", user._id, {
    education: user.education.map((item, idx) => (idx === index ? entry : item)),
  });
  return user._id;
}

/**
 * Removes one education entry by index.
 */
export async function deleteEducation(
  ctx: MutationCtx,
  { index }: { index: number }
) {
  const user = requireOnboardingComplete(await getAuthenticatedUser(ctx));

  if (index < 0 || index >= user.education.length) {
    throw new Error("Invalid education index");
  }

  await ctx.db.patch("users", user._id, {
    education: user.education.filter((_, idx) => idx !== index),
  });
  return user._id;
}

/**
 * Adds one experience entry to the user profile.
 */
export async function addExperience(
  ctx: MutationCtx,
  { entry }: { entry: Infer<typeof experienceEntryValidator> }
) {
  const user = requireOnboardingComplete(await getAuthenticatedUser(ctx));
  await ctx.db.patch("users", user._id, { experience: [...user.experience, entry] });
  return user._id;
}

/**
 * Replaces an existing experience entry by index.
 */
export async function updateExperience(
  ctx: MutationCtx,
  {
    index,
    entry,
  }: {
    index: number;
    entry: Infer<typeof experienceEntryValidator>;
  }
) {
  const user = requireOnboardingComplete(await getAuthenticatedUser(ctx));

  if (index < 0 || index >= user.experience.length) {
    throw new Error("Invalid experience index");
  }

  await ctx.db.patch("users", user._id, {
    experience: user.experience.map((item, idx) => (idx === index ? entry : item)),
  });
  return user._id;
}

/**
 * Removes one experience entry by index.
 */
export async function deleteExperience(
  ctx: MutationCtx,
  { index }: { index: number }
) {
  const user = requireOnboardingComplete(await getAuthenticatedUser(ctx));

  if (index < 0 || index >= user.experience.length) {
    throw new Error("Invalid experience index");
  }

  await ctx.db.patch("users", user._id, {
    experience: user.experience.filter((_, idx) => idx !== index),
  });
  return user._id;
}
