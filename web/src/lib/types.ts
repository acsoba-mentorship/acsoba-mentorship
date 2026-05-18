export type ViewMode = "grid" | "list";

export type UserRole = "mentee" | "mentor";

// Convex user types — single source of truth for user/profile data
import type { Doc, Id } from "../../convex/_generated/dataModel";

/** Full user document — only available to the authenticated user themselves
 *  (via getCurrentUser). Never expose this shape to other clients. */
export type User = Doc<"users">;

/** Id for a user document. */
export type UserId = Id<"users">;

/** Privacy-safe public profile returned by getUserByUsername/getUserById.
 *  Excludes internal fields (_id, tokenIdentifier, dateOfBirth, onboardingStatus,
 *  createdAt, etc.). Sensitive contact fields are present but nullable, and are
 *  null when redacted by mentor privacy settings. */
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
  profilePictureUrl: string;
  email: string | null;
  phoneNumber: string | null;
  mentorProfile: Doc<"users">["mentorProfile"];
};
