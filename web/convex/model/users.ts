import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Infer } from "convex/values";
import {
  ANONYMOUS_MENTOR_NAME,
  buildUsernameStatus,
  GOALS_MAX_CHARACTERS,
  isValidUsername,
  makeTemporaryCandidate,
  normalizeUsername,
  toPublicMentorDTO,
  USERNAME_CHANGE_COOLDOWN_MS,
} from "../helper";
import {
  enrollAsMenteeArgsValidator,
  enrollAsMentorArgsValidator,
  setUserOnboardingCompleteArgsValidator,
  updateUserProfileArgsValidator,
} from "./users/validators";
import {
  CAREER_STAGE,
  educationEntryValidator,
  experienceEntryValidator,
  menteeProfileValidator,
  mentorProfileValidator,
  ONBOARDING_STATUS,
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

async function hasActiveRelationship(
  ctx: QueryCtx,
  viewerId: Id<"users">,
  profileUserId: Id<"users">
) {
  if (viewerId === profileUserId) {
    return true;
  }

  const [profileAsMentor, viewerAsMentor] = await Promise.all([
    ctx.db
      .query("mentorships")
      .withIndex("by_mentorId_menteeId", (q) =>
        q.eq("mentorId", profileUserId).eq("menteeId", viewerId)
      )
      .collect(),
    ctx.db
      .query("mentorships")
      .withIndex("by_mentorId_menteeId", (q) =>
        q.eq("mentorId", viewerId).eq("menteeId", profileUserId)
      )
      .collect(),
  ]);

  return [...profileAsMentor, ...viewerAsMentor].some(
    (mentorship) => mentorship.status === "active"
  );
}

async function toPublicUserProfile(
  ctx: QueryCtx,
  currentUser: Doc<"users">,
  user: Doc<"users">
) {
  const hasMentorshipAccess = await hasActiveRelationship(
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

  const isMentor = !!user.mentorProfile;
  const revealMentorIdentity = isMentor && hasMentorshipAccess;

  return {
    userId: user._id,
    username: isMentor && !revealMentorIdentity ? null : user.username,
    name:
      isMentor && !revealMentorIdentity
        ? ANONYMOUS_MENTOR_NAME
        : user.name,
    title: user.title,
    bio: user.bio,
    location: user.location,
    profilePictureUrl:
      isMentor && !revealMentorIdentity
        ? ""
        : user.profilePictureUrl,
    email: revealMentorIdentity ? user.email : null,
    phoneNumber: revealMentorIdentity ? user.phoneNumber : null,
    education: user.education,
    experience: user.experience,
    interests: user.interests ?? [],
    industries:
      (user.mentorProfile
        ? user.mentorProfile.industries
        : user.menteeProfile?.industries) ??
      user.industries ??
      [],
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
  if (!user.menteeProfile) {
    throw new Error("Add a mentee profile before editing mentee preferences");
  }

  await ctx.db.patch("users", user._id, {
    menteeProfile: {
      ...args,
      industries: args.industries ?? user.menteeProfile.industries,
    },
  });
  return user._id;
}

function validateCareerBackground(args: {
  careerStage: Infer<typeof usersTableFields.careerStage>;
  education: Infer<typeof usersTableFields.education>;
  experience: Infer<typeof usersTableFields.experience>;
}) {
  if (args.careerStage === CAREER_STAGE.STUDENT && args.education.length === 0) {
    throw new Error("At least one education entry is required for students");
  }

  if (
    args.careerStage === CAREER_STAGE.PROFESSIONAL &&
    args.experience.length === 0
  ) {
    throw new Error("At least one experience entry is required");
  }
}

function validateMenteeProfile(
  profile: Infer<typeof menteeProfileValidator>
) {
  const goals = profile.goals.trim();
  if (!goals) {
    throw new Error("Tell us a little about your goals");
  }
  if (goals.length > GOALS_MAX_CHARACTERS) {
    throw new Error(`Goals must be at most ${GOALS_MAX_CHARACTERS} characters`);
  }
  if (profile.preferredCommunicationModes.length === 0) {
    throw new Error("Select at least one communication mode");
  }
  if (
    new Set(profile.preferredCommunicationModes).size !==
    profile.preferredCommunicationModes.length
  ) {
    throw new Error("Select each communication mode only once");
  }

  return {
    ...profile,
    goals,
    ...(profile.industries
      ? {
          industries: normalizeProfileTags(
            profile.industries,
            "mentee industries"
          ),
        }
      : {}),
  };
}

function normalizeProfileTags(values: string[], label: string) {
  const trimmed = values.map((item) => item.trim()).filter(Boolean);
  if (trimmed.some((item) => item.length > 80)) {
    throw new Error(`Each ${label} entry must be at most 80 characters`);
  }

  const unique = new Map<string, string>();
  trimmed.forEach((item) => {
    const key = item.toLocaleLowerCase("en-SG");
    if (!unique.has(key)) {
      unique.set(key, item);
    }
  });

  const normalized = Array.from(unique.values());
  if (normalized.length > 50) {
    throw new Error(`Add at most 50 ${label} entries`);
  }
  return normalized;
}

function normalizeMentorProfile(
  profile: Infer<typeof mentorProfileValidator>,
  { requireExpertise = false }: { requireExpertise?: boolean } = {}
) {
  if (
    !Number.isInteger(profile.yearsOfExperience) ||
    profile.yearsOfExperience < 0 ||
    profile.yearsOfExperience > 80
  ) {
    throw new Error("Years of experience must be a whole number from 0 to 80");
  }
  if (
    !Number.isInteger(profile.maxMentees) ||
    profile.maxMentees < 1 ||
    profile.maxMentees > 100
  ) {
    throw new Error("Maximum mentees must be a whole number from 1 to 100");
  }

  const expertise = normalizeProfileTags(profile.expertise, "expertise");
  if (requireExpertise && expertise.length === 0) {
    throw new Error("Add at least one area of expertise");
  }
  if (requireExpertise && expertise.length > 20) {
    throw new Error("Add at most 20 areas of expertise");
  }
  if (expertise.length > 50) {
    throw new Error("Add at most 50 areas of expertise");
  }

  return {
    yearsOfExperience: profile.yearsOfExperience,
    expertise,
    ...(profile.industries
      ? {
          industries: normalizeProfileTags(
            profile.industries,
            "mentor industries"
          ),
        }
      : {}),
    maxMentees: profile.maxMentees,
    isAvailable: profile.isAvailable,
    isVisible: profile.isVisible ?? true,
  };
}

async function validateOnboardingSelections(
  ctx: MutationCtx,
  {
    industries,
    interests,
  }: {
    industries?: string[];
    interests?: string[];
  }
) {
  if (interests && (interests.length < 1 || interests.length > 3)) {
    throw new Error("Select between 1 and 3 interests");
  }
  if (industries && (industries.length < 1 || industries.length > 3)) {
    throw new Error("Select between 1 and 3 industries");
  }
  if (
    interests &&
    new Set(
      interests.map((interest) => interest.toLocaleLowerCase("en-SG"))
    ).size !== interests.length
  ) {
    throw new Error("Select each interest only once");
  }
  if (
    industries &&
    new Set(
      industries.map((industry) => industry.toLocaleLowerCase("en-SG"))
    ).size !== industries.length
  ) {
    throw new Error("Select each industry only once");
  }

  const options = await getEffectiveProgramSettings(ctx);
  const availableInterests: readonly string[] =
    options.onboardingInterests;
  const availableIndustries: readonly string[] =
    options.onboardingIndustries;
  if (
    interests &&
    !interests.every((interest) =>
      availableInterests.includes(interest)
    )
  ) {
    throw new Error("Select interests from the available onboarding options");
  }
  if (
    industries &&
    !industries.every((industry) =>
      availableIndustries.includes(industry)
    )
  ) {
    throw new Error("Select industries from the available onboarding options");
  }
}

/**
 * Writes the selected role's initial onboarding profile and marks onboarding complete.
 */
export async function setUserOnboardingComplete(
  ctx: MutationCtx,
  args: Infer<typeof setUserOnboardingCompleteArgsValidator>
) {
  const user = await getAuthenticatedUser(ctx);
  if (user.onboardingStatus === ONBOARDING_STATUS.COMPLETE) {
    throw new Error("Onboarding is already complete");
  }
  const identity = await ctx.auth.getUserIdentity();
  const authenticatedEmail = identity?.email?.trim();
  const verifiedEmail =
    identity?.emailVerified === true && authenticatedEmail
      ? authenticatedEmail.toLowerCase()
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
  if (args.personalDetails.email.trim().toLowerCase() !== verifiedEmail) {
    throw new Error("Use the verified email from your signed-in account");
  }

  validateCareerBackground(args);

  const profileBasics = {
    name: args.personalDetails.name,
    email: verifiedEmail,
    gender: args.personalDetails.gender,
    nationality: args.personalDetails.nationality,
    phoneNumber: args.personalDetails.phoneNumber,
    dateOfBirth: args.personalDetails.dateOfBirth,
    careerStage: args.careerStage,
    education: args.education,
    experience: args.experience,
    onboardingStatus: ONBOARDING_STATUS.COMPLETE,
  } as const;

  if (args.profile.role === "mentee") {
    await validateOnboardingSelections(ctx, {
      interests: args.profile.interests,
      industries: args.profile.industries,
    });
    await ctx.db.patch("users", user._id, {
      ...profileBasics,
      interests: args.profile.interests,
      industries: args.profile.industries,
      menteeProfile: {
        ...validateMenteeProfile(args.profile.menteeProfile),
        industries: args.profile.industries,
      },
    });
  } else {
    await validateOnboardingSelections(ctx, {
      industries: args.profile.industries,
    });
    await ctx.db.patch("users", user._id, {
      ...profileBasics,
      industries: args.profile.industries,
      mentorProfile: {
        ...normalizeMentorProfile(args.profile.mentorProfile, {
          requireExpertise: true,
        }),
        industries: args.profile.industries,
      },
    });
  }

  return user._id;
}

export async function enrollAsMentee(
  ctx: MutationCtx,
  args: Infer<typeof enrollAsMenteeArgsValidator>
) {
  const user = requireOnboardingComplete(await getAuthenticatedUser(ctx));
  if (user.menteeProfile) {
    throw new Error("Your account already has a mentee profile");
  }

  await validateOnboardingSelections(ctx, {
    interests: args.interests,
    industries: args.industries,
  });
  await ctx.db.patch("users", user._id, {
    interests: args.interests,
    menteeProfile: {
      ...validateMenteeProfile(args.menteeProfile),
      industries: args.industries,
    },
  });
  return user._id;
}

export async function enrollAsMentor(
  ctx: MutationCtx,
  args: Infer<typeof enrollAsMentorArgsValidator>
) {
  const user = requireOnboardingComplete(await getAuthenticatedUser(ctx));
  if (user.mentorProfile) {
    throw new Error("Your account already has a mentor profile");
  }

  await validateOnboardingSelections(ctx, { industries: args.industries });
  await ctx.db.patch("users", user._id, {
    mentorProfile: {
      ...normalizeMentorProfile(args.mentorProfile, {
        requireExpertise: true,
      }),
      industries: args.industries,
    },
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
  if (!user.menteeProfile) {
    throw new Error("Add a mentee profile before editing mentee preferences");
  }
  const previous = user.menteeProfile;

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
    industries: previous.industries,
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
  args: { industries: string[] }
) {
  const user = requireOnboardingComplete(await getAuthenticatedUser(ctx));
  const industries = normalizeProfileTags(args.industries, "industries");

  if (user.mentorProfile && user.menteeProfile) {
    throw new Error(
      "Update industries from the relevant mentor or mentee profile"
    );
  }

  await ctx.db.patch("users", user._id, {
    industries,
    ...(user.mentorProfile
      ? {
          mentorProfile: {
            ...user.mentorProfile,
            industries,
          },
        }
      : {}),
    ...(user.menteeProfile
      ? {
          menteeProfile: {
            ...user.menteeProfile,
            industries,
          },
        }
      : {}),
  });
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
  if (!user.mentorProfile) {
    throw new Error("Add a mentor profile before editing mentor details");
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

  await ctx.db.patch("users", user._id, {
    mentorProfile: {
      ...normalizeMentorProfile(args),
      industries: args.industries ?? user.mentorProfile.industries,
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
