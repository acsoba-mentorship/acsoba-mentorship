export type ViewMode = "grid" | "list";

export type UserRole = "mentee" | "mentor";

// Convex user types — single source of truth for user/profile data
import type { Doc, Id } from "../../convex/_generated/dataModel";

/** Full user document — only available to the authenticated user themselves
 *  (via getCurrentUser). Never expose this shape to other clients. */
export type User = Doc<"users">;

/** Id for a user document. */
export type UserId = Id<"users">;

/** Sanitized public profile returned by getUserByUsername.
 *  Excludes all sensitive/internal fields (_id, tokenIdentifier, email,
 *  phoneNumber, dateOfBirth, onboardingStatus, createdAt, etc.). */
export type PublicUserProfile = {
  username: string;
  name: string;
  title: string;
  bio: string;
  location: string;
  profilePictureUrl: string;
  education: Doc<"users">["education"];
  experience: Doc<"users">["experience"];
  menteeProfile: Doc<"users">["menteeProfile"];
  mentorProfile: Doc<"users">["mentorProfile"];
};
