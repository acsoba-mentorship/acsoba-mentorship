import type { Doc, Id } from "../../convex/_generated/dataModel";

export type ViewMode = "grid" | "list";

export type UserRole = "mentee" | "mentor";

/** Full user document — only available to the authenticated user themselves
 *  (via getCurrentUser). Never expose this shape to other clients. */
export type User = Doc<"users">;

/** Id for a user document. */
export type UserId = Id<"users">;

/** Privacy-safe public profile returned by getUserByUsername/getUserById.
 *  Excludes internal fields (_id, tokenIdentifier, dateOfBirth, onboardingStatus,
 *  createdAt, etc.). Sensitive contact fields are present but nullable, and are
 *  null while a mentor's identity is hidden by programme policy. */
export type PublicUserProfile = {
  userId: Id<"users">;
  username: string | null;
  name: string;
  title: string;
  bio: string;
  location: string;
  profilePictureUrl: string;
  email: string | null;
  phoneNumber: string | null;
  education: Doc<"users">["education"];
  experience: Doc<"users">["experience"];
  interests: string[];
  industries: string[];
  menteeProfile?: Doc<"users">["menteeProfile"];
  mentorProfile?: Doc<"users">["mentorProfile"];
};

/** Reduced DTO returned by listMentors — safe to expose to any authenticated
 *  client. Contains only the fields needed by mentor cards and search. */
export type PublicMentorProfile = {
  mentorId: Id<"users">;
  username: string | null;
  name: string;
  title: string;
  bio: string;
  location: string;
  ageGroup: string;
  company: string;
  profilePictureUrl: string;
  email: string | null;
  phoneNumber: string | null;
  industries: string[];
  mentorProfile: Doc<"users">["mentorProfile"];
  matchScore: number;
  matchedInterests: string[];
  badges: string[];
};

/** Converts a backend match score into a display-safe percentage. */
export function getMentorMatchPercentage(matchScore: number): number {
  if (!Number.isFinite(matchScore)) {
    return 0;
  }

  return Math.round(Math.min(100, Math.max(0, matchScore)));
}

/** Maps a public user profile to the mentor list/card DTO when they have a mentor profile. */
export function publicUserToMentorProfileDto(
  user: PublicUserProfile
): PublicMentorProfile | null {
  if (!user.mentorProfile) {
    return null;
  }

  return {
    mentorId: user.userId,
    username: user.username,
    name: user.name,
    title: user.title,
    bio: user.bio,
    location: user.location,
    ageGroup: "",
    company: "",
    profilePictureUrl: user.profilePictureUrl,
    email: user.email,
    phoneNumber: user.phoneNumber,
    industries: user.industries,
    mentorProfile: user.mentorProfile,
    matchScore: 0,
    matchedInterests: [],
    badges: [],
  };
}
