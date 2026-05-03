import { v } from "convex/values";

export const onboardingStatusValidator = v.union(
  v.literal("new"),
  v.literal("verified"),
  v.literal("user_profile_complete"),
  v.literal("mentee_profile_setup_complete")
);

export const educationEntryValidator = v.object({
  institution: v.string(),
  degree: v.optional(v.string()),
  fieldOfStudy: v.optional(v.string()),
  startDate: v.number(),
  endDate: v.optional(v.number()),
  description: v.optional(v.string()),
});

export const experienceEntryValidator = v.object({
  company: v.string(),
  title: v.string(),
  startDate: v.number(),
  endDate: v.optional(v.number()),
  description: v.optional(v.string()),
});

export const menteeProfileValidator = v.object({
  goals: v.string(),
  interests: v.array(v.string()),
});

export const mentorProfileValidator = v.object({
  yearsOfExperience: v.number(),
  industries: v.array(v.string()),
  expertise: v.array(v.string()),
  maxMentees: v.number(),
  isAvailable: v.boolean(),
});

export const usersTableFields = {
  name: v.string(),
  username: v.string(),
  usernameUpdatedAt: v.number(),
  isTemporaryUsername: v.boolean(),
  dateOfBirth: v.number(),
  gender: v.string(),
  nationality: v.string(),
  tokenIdentifier: v.string(),
  profilePictureUrl: v.string(),
  title: v.string(),
  bio: v.string(),
  location: v.string(),
  email: v.string(),
  phoneNumber: v.string(),
  education: v.array(educationEntryValidator),
  experience: v.array(experienceEntryValidator),
  menteeProfile: v.optional(menteeProfileValidator),
  mentorProfile: v.optional(mentorProfileValidator),
  onboardingStatus: onboardingStatusValidator,
  createdAt: v.number(),
};
