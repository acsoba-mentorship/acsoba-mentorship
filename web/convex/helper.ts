import type { Doc } from "./_generated/dataModel";

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;
export const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9_]*[a-z0-9])?$/;
export const USERNAME_CHANGE_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;
export const MENTOR_LIST_MAX = 100;
export const ANONYMOUS_MENTOR_NAME = "Anonymous Mentor";

export const DEFAULT_MENTOR_PRIVACY_SETTINGS = {
  masterIdentityDisclosure: true,
  overrides: {
    name: true,
    email: false,
    phoneNumber: false,
  },
} as const;

type MentorPrivacySettings = NonNullable<Doc<"users">["mentorSettings"]>["privacy"];

type MentorIdentityVisibility = {
  name: boolean;
  username: boolean;
  email: boolean;
  phoneNumber: boolean;
};

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
 * Resolves persisted mentor privacy settings into effective field visibility.
 */
export function resolveMentorIdentityVisibility(
  settings?: MentorPrivacySettings,
  forceReveal = false
): MentorIdentityVisibility {
  if (forceReveal) {
    return {
      name: true,
      username: true,
      email: true,
      phoneNumber: true,
    };
  }

  const masterIdentityDisclosure =
    settings?.masterIdentityDisclosure ??
    DEFAULT_MENTOR_PRIVACY_SETTINGS.masterIdentityDisclosure;

  const name =
    masterIdentityDisclosure &&
    (settings?.overrides?.name ?? DEFAULT_MENTOR_PRIVACY_SETTINGS.overrides.name);

  return {
    name,
    username: name,
    email:
      masterIdentityDisclosure &&
      (settings?.overrides?.email ?? DEFAULT_MENTOR_PRIVACY_SETTINGS.overrides.email),
    phoneNumber:
      masterIdentityDisclosure &&
      (settings?.overrides?.phoneNumber ??
        DEFAULT_MENTOR_PRIVACY_SETTINGS.overrides.phoneNumber),
  };
}

/**
 * Maps a user document into the public mentor list payload.
 */
export function toPublicMentorDTO(
  user: Doc<"users">,
  options: { forceRevealIdentity?: boolean } = {}
) {
  const visibility = resolveMentorIdentityVisibility(
    user.mentorSettings?.privacy,
    options.forceRevealIdentity
  );

  return {
    mentorId: user._id,
    username: visibility.username ? user.username : null,
    name: visibility.name ? user.name : ANONYMOUS_MENTOR_NAME,
    title: user.title,
    bio: user.bio,
    location: user.location,
    profilePictureUrl: user.profilePictureUrl,
    email: visibility.email ? user.email : null,
    phoneNumber: visibility.phoneNumber ? user.phoneNumber : null,
    mentorProfile: user.mentorProfile,
  };
}
