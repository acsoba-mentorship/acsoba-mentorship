import type { PublicMentorProfile, PublicUserProfile } from "@/lib/types";

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
    profilePictureUrl: user.profilePictureUrl,
    email: user.email,
    phoneNumber: user.phoneNumber,
    industries: user.industries ?? [],
    mentorProfile: user.mentorProfile,
  };
}
