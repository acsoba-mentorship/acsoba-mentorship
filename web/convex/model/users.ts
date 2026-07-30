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
import {
  claimAdminAccessForUser,
  getVerifiedNormalizedAuthEmail,
  syncAuthenticatedEmailAndAdminAccess,
} from "./admin/bootstrap";
import { getEffectiveProgramSettings } from "./programSettings";

const CONVEX_ID_PATTERN = /^[a-z0-9]{16,64}$/i;

async function hasActiveMentorship(
  ctx: QueryCtx,
  viewerId: Id<"users">,
  mentorId: Id<"users">
) {
  if (viewerId === mentorId) {
    return true;
  }

  const mentorships = await ctx.db
    .query("mentorships")
    .withIndex("by_mentorId_menteeId", (q) =>
      q.eq("mentorId", mentorId).eq("menteeId", viewerId)
    )
    .collect();

  return mentorships.some((mentorship) => mentorship.status === "active");
}

async function toPublicUserProfile(
  ctx: QueryCtx,
  currentUser: Doc<"users">,
  user: Doc<"users">
) {
  const hasMentorshipAccess = await hasActiveMentorship(
    ctx,
    currentUser._id,
    user._id
  );
  if (
    user.mentorProfile?.isVisible === false &&
    !hasMentorshipAccess
  ) {
    return null;
  }

  const forceRevealIdentity =
    !!user.mentorProfile && hasMentorshipAccess;
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
    profilePictureUrl:
      shouldApplyMentorPrivacy && !mentorVisibility.name
        ? ""
        : user.profilePictureUrl,
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

  const identityEmail = identity.email?.trim();
  const identityEmailVerified = identity.emailVerified === true;

  if (user !== null) {
    await syncAuthenticatedEmailAndAdminAccess(ctx, user, {
      authEmail: identityEmail,
      authEmailVerified: identityEmailVerified,
    });
    return user._id;
  }

  const now = Date.now();
  const identityName = identity.name?.trim();
  const contactEmail = identityEmail ?? "";
  const displayName =
    identityName && !identityName.includes("@")
      ? identityName
      : contactEmail.split("@")[0] || "";
  const temporaryUsername = await ensureUniqueTemporaryUsername(
    ctx,
    displayName || "user"
  );

  const userId = await ctx.db.insert("users", {
    name: displayName,
    username: temporaryUsername,
    usernameUpdatedAt: now,
    isTemporaryUsername: true,
    dateOfBirth: 0,
    gender: "",
    nationality: "",
    tokenIdentifier: identity.tokenIdentifier,
    authEmailNormalized: getVerifiedNormalizedAuthEmail(
      identityEmail,
      identityEmailVerified
    ),
    authEmailVerified: identityEmailVerified,
    profilePictureUrl: "",
    title: "",
    bio: "",
    location: "",
    email: contactEmail,
    phoneNumber: "",
    interests: [],
    industries: [],
    education: [],
    experience: [],
    onboardingStatus: ONBOARDING_STATUS.INCOMPLETE,
    createdAt: now,
  });

  await claimAdminAccessForUser(ctx, {
    userId,
    authEmail: identityEmail,
    authEmailVerified: identityEmailVerified,
  });

  return userId;
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
export async function listMentors(ctx: QueryCtx) {
  const currentUser = requireOnboardingComplete(await getAuthenticatedUser(ctx));

  const [available, unavailable, activeMentorships, completedMentorships] =
    await Promise.all([
      ctx.db
        .query("users")
        .withIndex("by_mentor_availability", (q) =>
          q.eq("mentorProfile.isAvailable", true)
        )
        .collect(),
      ctx.db
        .query("users")
        .withIndex("by_mentor_availability", (q) =>
          q.eq("mentorProfile.isAvailable", false)
        )
        .collect(),
      ctx.db
        .query("mentorships")
        .withIndex("by_status", (q) => q.eq("status", "active"))
        .collect(),
      ctx.db
        .query("mentorships")
        .withIndex("by_status", (q) => q.eq("status", "completed"))
        .collect(),
    ]);
  const activeMentorIds = new Set(
    activeMentorships
      .filter((mentorship) => mentorship.menteeId === currentUser._id)
      .map((mentorship) => mentorship.mentorId)
  );

  const mentors = [...available, ...unavailable]
    .filter(
      (mentor) =>
        mentor._id === currentUser._id ||
        mentor.mentorProfile?.isVisible !== false
    );
  const activeCounts = new Map<string, number>();
  const completedCounts = new Map<string, number>();

  activeMentorships.forEach((mentorship) => {
    const key = String(mentorship.mentorId);
    activeCounts.set(key, (activeCounts.get(key) ?? 0) + 1);
  });
  completedMentorships.forEach((mentorship) => {
    const key = String(mentorship.mentorId);
    completedCounts.set(key, (completedCounts.get(key) ?? 0) + 1);
  });

  return mentors.map((mentor) =>
    toPublicMentorDTO(mentor, {
      forceRevealIdentity:
        mentor._id === currentUser._id || activeMentorIds.has(mentor._id),
      viewerInterests: currentUser.interests ?? [],
      activeMentorshipCount: activeCounts.get(String(mentor._id)) ?? 0,
      completedMentorshipCount: completedCounts.get(String(mentor._id)) ?? 0,
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
  const identity = await ctx.auth.getUserIdentity();
  const verifiedEmail =
    identity?.emailVerified === true
      ? identity.email?.trim().toLowerCase()
      : undefined;
  const verificationRequired =
    process.env.ACSOBA_VERIFICATION_REQUIRED?.trim().toLowerCase() === "true";

  if (
    !verifiedEmail ||
    user.membershipVerifiedEmail !== verifiedEmail ||
    !user.membershipVerificationStatus ||
    (verificationRequired &&
      user.membershipVerificationStatus !== "acsoba_verified")
  ) {
    throw new Error(
      "Complete membership verification with your signed-in email before finishing onboarding"
    );
  }

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
  const onboardingOptions = await getEffectiveProgramSettings(ctx);
  const availableInterests = new Set(onboardingOptions.onboardingInterests);
  const availableIndustries = new Set(onboardingOptions.onboardingIndustries);
  if (!args.interests.every((interest) => availableInterests.has(interest))) {
    throw new Error("Select interests from the available onboarding options");
  }
  if (!args.industries.every((industry) => availableIndustries.has(industry))) {
    throw new Error("Select industries from the available onboarding options");
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
  if (
    !Number.isInteger(args.yearsOfExperience) ||
    args.yearsOfExperience < 0 ||
    args.yearsOfExperience > 80
  ) {
    throw new Error("Years of experience must be a whole number from 0 to 80");
  }
  if (
    !Number.isInteger(args.maxMentees) ||
    args.maxMentees < 1 ||
    args.maxMentees > 100
  ) {
    throw new Error("Maximum mentees must be a whole number from 1 to 100");
  }

  const activeMentorships = await ctx.db
    .query("mentorships")
    .withIndex("by_mentorId_status", (q) =>
      q.eq("mentorId", user._id).eq("status", "active")
    )
    .collect();
  if (args.maxMentees < activeMentorships.length) {
    throw new Error(
      `Maximum mentees cannot be lower than your ${activeMentorships.length} active mentorships`
    );
  }

  const expertise = Array.from(
    new Set(args.expertise.map((item) => item.trim()).filter(Boolean))
  ).slice(0, 50);

  await ctx.db.patch("users", user._id, {
    mentorProfile: {
      yearsOfExperience: args.yearsOfExperience,
      expertise,
      maxMentees: args.maxMentees,
      isAvailable: args.isAvailable,
      isVisible: args.isVisible ?? user.mentorProfile?.isVisible ?? true,
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
