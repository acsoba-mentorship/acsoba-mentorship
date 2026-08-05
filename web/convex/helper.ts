import type { Doc } from "./_generated/dataModel";

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;
export const GOALS_MAX_CHARACTERS = 250;
export const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9_]*[a-z0-9])?$/;
export const USERNAME_CHANGE_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;
export const ANONYMOUS_MENTOR_NAME = "Anonymous Mentor";

/**
 * Normalizes a username into canonical lowercase format.
 */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

/**
 * Checks whether a username meets length and character rules.
 */
export function isValidUsername(username: string): boolean {
  if (
    username.length < USERNAME_MIN_LENGTH ||
    username.length > USERNAME_MAX_LENGTH
  ) {
    return false;
  }
  return USERNAME_PATTERN.test(username);
}

/**
 * Converts free-form input into a username-friendly slug.
 */
export function slugifyForUsername(input: string): string {
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

/**
 * Builds a temporary username candidate with a short random suffix.
 */
export function makeTemporaryCandidate(base: string): string {
  const suffix = Math.random().toString(36).slice(2, 8);
  const normalizedBase = slugifyForUsername(base);
  const maxBaseLength = USERNAME_MAX_LENGTH - suffix.length - 1;
  const trimmedBase = normalizedBase.slice(0, Math.max(maxBaseLength, 1));
  return `${trimmedBase}_${suffix}`;
}

/**
 * Computes username update eligibility from persisted timestamps and current time.
 */
export function buildUsernameStatus(
  user: Pick<Doc<"users">, "usernameUpdatedAt" | "isTemporaryUsername">,
  nowMs: number
) {
  if (user.isTemporaryUsername) {
    return {
      canChangeUsername: true,
      nextUsernameChangeAt: null as number | null,
      isTemporaryUsername: true,
    };
  }

  const nextAllowedAt = user.usernameUpdatedAt + USERNAME_CHANGE_COOLDOWN_MS;
  const canChange = nowMs >= nextAllowedAt;

  return {
    canChangeUsername: canChange,
    nextUsernameChangeAt: canChange ? null : nextAllowedAt,
    isTemporaryUsername: false,
  };
}

/**
 * Returns two-letter initials from a display name.
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Maps a user document into the public mentor list payload.
 *
 * Identity disclosure is programme policy, not a mentor preference. Callers
 * may reveal identity only after separately establishing that the viewer is
 * the mentor or is in an active mentorship with them.
 */
export function toPublicMentorDTO(
  user: Doc<"users">,
  options: {
    forceRevealIdentity?: boolean;
    viewerInterests?: string[];
    activeMentorshipCount?: number;
    completedMentorshipCount?: number;
  } = {}
) {
  const revealIdentity = options.forceRevealIdentity === true;

  const activeMentorshipCount = options.activeMentorshipCount ?? 0;
  const completedMentorshipCount = options.completedMentorshipCount ?? 0;
  const mentorProfile = user.mentorProfile
    ? {
        ...user.mentorProfile,
        isAvailable:
          user.mentorProfile.isAvailable &&
          activeMentorshipCount < user.mentorProfile.maxMentees,
      }
    : undefined;
  const currentExperience = [...user.experience]
    .sort((a, b) => {
      if (a.endDate === undefined && b.endDate !== undefined) return -1;
      if (a.endDate !== undefined && b.endDate === undefined) return 1;
      return b.startDate - a.startDate;
    })
    .at(0);
  const company = currentExperience?.company?.trim() ?? "";
  const ageGroup = getAgeGroup(user.dateOfBirth);
  const viewerInterests = (options.viewerInterests ?? [])
    .map((value) => value.trim())
    .filter(Boolean);
  const mentorKeywords = [
    ...(mentorProfile?.expertise ?? []),
    ...(mentorProfile?.industries ?? user.industries ?? []),
    company,
    user.title,
  ]
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const matchedInterests = viewerInterests.filter((interest) => {
    const normalized = interest.toLowerCase();
    return mentorKeywords.some(
      (keyword) => keyword.includes(normalized) || normalized.includes(keyword)
    );
  });
  const matchScore =
    viewerInterests.length > 0
      ? Math.min(
          100,
          Math.round(
            (matchedInterests.length / viewerInterests.length) * 80 +
              (mentorProfile?.isAvailable ? 20 : 0)
          )
        )
      : mentorProfile?.isAvailable
        ? 20
        : 0;
  const badges = [
    ...(completedMentorshipCount >= 10
      ? ["Mentored 10"]
      : completedMentorshipCount >= 5
        ? ["Mentorship Builder"]
        : completedMentorshipCount >= 1
          ? ["First Mentorship"]
          : []),
    ...(activeMentorshipCount >= 3 ? ["Community Guide"] : []),
  ];

  return {
    mentorId: user._id,
    username: revealIdentity ? user.username : null,
    name: revealIdentity ? user.name : ANONYMOUS_MENTOR_NAME,
    title: user.title,
    bio: user.bio,
    location: user.location,
    profilePictureUrl: revealIdentity ? user.profilePictureUrl : "",
    email: revealIdentity ? user.email : null,
    phoneNumber: revealIdentity ? user.phoneNumber : null,
    industries: mentorProfile?.industries ?? user.industries ?? [],
    mentorProfile,
    ageGroup,
    company,
    matchScore,
    matchedInterests,
    badges,
  };
}

/**
 * Returns a coarse age band so discovery can support age-group filtering
 * without disclosing a mentor's date of birth.
 */
export function getAgeGroup(dateOfBirth: number) {
  if (!dateOfBirth || dateOfBirth <= 0) {
    return "Not specified";
  }

  const now = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = now.getUTCFullYear() - birthDate.getUTCFullYear();
  const beforeBirthday =
    now.getUTCMonth() < birthDate.getUTCMonth() ||
    (now.getUTCMonth() === birthDate.getUTCMonth() &&
      now.getUTCDate() < birthDate.getUTCDate());
  if (beforeBirthday) age -= 1;

  if (age < 25) return "Under 25";
  if (age < 35) return "25-34";
  if (age < 45) return "35-44";
  if (age < 55) return "45-54";
  return "55+";
}
