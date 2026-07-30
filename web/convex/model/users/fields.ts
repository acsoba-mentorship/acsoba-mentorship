import { v } from "convex/values";

export const ONBOARDING_STATUS = {
  INCOMPLETE: "incomplete",
  COMPLETE: "complete",
} as const;

export const membershipVerificationStatusValidator = v.union(
  v.literal("acsoba_verified"),
  v.literal("auth0_fallback")
);

export const CAREER_STAGE = {
  STUDENT: "student",
  PROFESSIONAL: "professional",
  BETWEEN_STUDY_AND_WORK: "between_study_and_work",
} as const;

export const COMMITMENT_LEVEL = {
  WEEKLY: "Weekly",
  TWICE_A_WEEK: "Twice a week",
  BIWEEKLY: "Biweekly",
  MONTHLY: "Monthly",
} as const;

export const COMMITMENT_LEVEL_OPTIONS = [
  COMMITMENT_LEVEL.WEEKLY,
  COMMITMENT_LEVEL.TWICE_A_WEEK,
  COMMITMENT_LEVEL.BIWEEKLY,
  COMMITMENT_LEVEL.MONTHLY,
] as const;

export const PREFERRED_COMMUNICATION_MODE = {
  VIDEO_CALL: "Video call",
  VOICE_CALL: "Voice call",
  EMAIL: "Email",
  MEETUP: "Meetup",
  CHAT: "Chat",
} as const;

export const PREFERRED_COMMUNICATION_MODE_OPTIONS = [
  PREFERRED_COMMUNICATION_MODE.VIDEO_CALL,
  PREFERRED_COMMUNICATION_MODE.VOICE_CALL,
  PREFERRED_COMMUNICATION_MODE.EMAIL,
  PREFERRED_COMMUNICATION_MODE.MEETUP,
  PREFERRED_COMMUNICATION_MODE.CHAT,
] as const;

export const onboardingStatusValidator = v.union(
  v.literal(ONBOARDING_STATUS.INCOMPLETE),
  v.literal(ONBOARDING_STATUS.COMPLETE)
);

export const careerStageValidator = v.union(
  v.literal(CAREER_STAGE.STUDENT),
  v.literal(CAREER_STAGE.PROFESSIONAL),
  v.literal(CAREER_STAGE.BETWEEN_STUDY_AND_WORK)
);

export const commitmentLevelValidator = v.union(
  v.literal(COMMITMENT_LEVEL.WEEKLY),
  v.literal(COMMITMENT_LEVEL.TWICE_A_WEEK),
  v.literal(COMMITMENT_LEVEL.BIWEEKLY),
  v.literal(COMMITMENT_LEVEL.MONTHLY)
);

export const preferredCommunicationModeValidator = v.union(
  v.literal(PREFERRED_COMMUNICATION_MODE.VIDEO_CALL),
  v.literal(PREFERRED_COMMUNICATION_MODE.VOICE_CALL),
  v.literal(PREFERRED_COMMUNICATION_MODE.EMAIL),
  v.literal(PREFERRED_COMMUNICATION_MODE.MEETUP),
  v.literal(PREFERRED_COMMUNICATION_MODE.CHAT)
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
  commitmentLevel: commitmentLevelValidator,
  preferredCommunicationModes: v.array(preferredCommunicationModeValidator)
});

export const mentorProfileValidator = v.object({
  yearsOfExperience: v.number(),
  expertise: v.array(v.string()),
  maxMentees: v.number(),
  isAvailable: v.boolean(),
  isVisible: v.optional(v.boolean()),
});

export const mentorPrivacyOverridesValidator = v.object({
  name: v.optional(v.boolean()),
  email: v.optional(v.boolean()),
  phoneNumber: v.optional(v.boolean()),
});

export const mentorPrivacySettingsValidator = v.object({
  masterIdentityDisclosure: v.boolean(),
  overrides: v.optional(mentorPrivacyOverridesValidator),
});

export const mentorSettingsValidator = v.object({
  privacy: mentorPrivacySettingsValidator,
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
  authEmailNormalized: v.optional(v.string()),
  authEmailVerified: v.optional(v.boolean()),
  membershipVerificationStatus: v.optional(
    membershipVerificationStatusValidator
  ),
  membershipVerifiedAt: v.optional(v.number()),
  membershipVerifiedEmail: v.optional(v.string()),
  profilePictureUrl: v.string(),
  title: v.string(),
  bio: v.string(),
  location: v.string(),
  email: v.string(),
  phoneNumber: v.string(),
  careerStage: v.optional(careerStageValidator),
  interests: v.optional(v.array(v.string())),
  industries: v.optional(v.array(v.string())),
  education: v.array(educationEntryValidator),
  experience: v.array(experienceEntryValidator),
  menteeProfile: v.optional(menteeProfileValidator),
  mentorProfile: v.optional(mentorProfileValidator),
  mentorSettings: v.optional(mentorSettingsValidator),
  onboardingStatus: onboardingStatusValidator,
  createdAt: v.number(),
};
