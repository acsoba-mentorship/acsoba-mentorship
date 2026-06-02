import { v } from "convex/values";
import {
  careerStageValidator,
  educationEntryValidator,
  experienceEntryValidator,
  menteeProfileValidator,
  mentorPrivacySettingsValidator,
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
export const updateMentorPrivacySettingsArgsValidator =
  mentorPrivacySettingsValidator.partial();

export const setUserOnboardingCompleteArgsValidator = v.object({
  personalDetails: v.object({
    name: usersTableFields.name,
    gender: usersTableFields.gender,
    nationality: usersTableFields.nationality,
    phoneNumber: usersTableFields.phoneNumber,
    dateOfBirth: usersTableFields.dateOfBirth,
    email: usersTableFields.email,
  }),
  careerStage: careerStageValidator,
  education: v.array(educationEntryValidator),
  experience: v.array(experienceEntryValidator),
  interests: v.array(v.string()),
  industries: v.array(v.string()),
  menteeProfile: menteeProfileValidator,
});

export const updateUserInterestsArgsValidator = v.object({
  interests: v.array(v.string()),
});

export const updateUserIndustriesArgsValidator = v.object({
  industries: v.array(v.string()),
});
