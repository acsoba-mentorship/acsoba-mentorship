import { v } from "convex/values";
import {
  careerStageValidator,
  educationEntryValidator,
  experienceEntryValidator,
  menteeProfileValidator,
  mentorProfileValidator,
  usersTableFields,
} from "./fields";

const userProfileFieldsValidator = v.object({
  name: usersTableFields.name,
  gender: usersTableFields.gender,
  nationality: usersTableFields.nationality,
  phoneNumber: usersTableFields.phoneNumber,
  dateOfBirth: v.optional(usersTableFields.dateOfBirth),
  bio: v.optional(usersTableFields.bio),
  location: v.optional(usersTableFields.location),
  title: v.optional(usersTableFields.title),
});

// Keep `users.gender` as a string for old records, but narrow new onboarding.
const onboardingGenderValidator = v.union(
  v.literal("male"),
  v.literal("female")
);

export const updateUserProfileArgsValidator = userProfileFieldsValidator.pick(
  "name",
  "gender",
  "nationality",
  "phoneNumber",
  "dateOfBirth",
  "bio",
  "location"
);
export const updateMentorProfileArgsValidator = mentorProfileValidator;

const onboardingPersonalDetailsValidator = v.object({
  name: usersTableFields.name,
  gender: onboardingGenderValidator,
  nationality: usersTableFields.nationality,
  phoneNumber: usersTableFields.phoneNumber,
  dateOfBirth: usersTableFields.dateOfBirth,
  email: usersTableFields.email,
});

const onboardingBackgroundValidators = {
  personalDetails: onboardingPersonalDetailsValidator,
  careerStage: careerStageValidator,
  education: v.array(educationEntryValidator),
  experience: v.array(experienceEntryValidator),
};

const onboardingMenteeProfileValidator = v.object({
  role: v.literal("mentee"),
  interests: v.array(v.string()),
  industries: v.array(v.string()),
  menteeProfile: menteeProfileValidator,
});

const onboardingMentorProfileValidator = v.object({
  role: v.literal("mentor"),
  industries: v.array(v.string()),
  mentorProfile: mentorProfileValidator,
});

export const setUserOnboardingCompleteArgsValidator = v.object({
  ...onboardingBackgroundValidators,
  profile: v.union(
    onboardingMenteeProfileValidator,
    onboardingMentorProfileValidator
  ),
});

export const enrollAsMenteeArgsValidator = v.object({
  interests: v.array(v.string()),
  industries: v.array(v.string()),
  menteeProfile: menteeProfileValidator,
});

export const enrollAsMentorArgsValidator = v.object({
  industries: v.array(v.string()),
  mentorProfile: mentorProfileValidator,
});

export const updateUserInterestsArgsValidator = v.object({
  interests: v.array(v.string()),
});

export const updateUserIndustriesArgsValidator = v.object({
  industries: v.array(v.string()),
});