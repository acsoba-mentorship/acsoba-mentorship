import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import * as UsersModel from "./model/users";
import {
  setUserOnboardingCompleteArgsValidator,
  updateMentorProfileArgsValidator,
  updateMentorPrivacySettingsArgsValidator,
  updateUserIndustriesArgsValidator,
  updateUserInterestsArgsValidator,
  updateUserProfileArgsValidator,
} from "./model/users/validators";
import {
  educationEntryValidator,
  experienceEntryValidator,
  menteeProfileValidator,
  usersTableFields,
} from "./model/users/fields";

/**
 * Creates the user record for a first-time authenticated user and returns its ID.
 */
export const storeUser = mutation({
  args: {},
  returns: v.id("users"),
  handler: (ctx) => UsersModel.storeUser(ctx),
});

/**
 * Returns the current authenticated user document, or null when signed out.
 */
export const getCurrentUser = query({
  args: {},
  handler: (ctx) => UsersModel.getCurrentUser(ctx),
});

/**
 * Loads a public user profile by username.
 */
export const getUserByUsername = query({
  args: { username: usersTableFields.username },
  handler: (ctx, args) => UsersModel.getUserByUsername(ctx, args),
});

/**
 * Loads a privacy-safe public user profile by user ID.
 */
export const getUserById = query({
  args: { userId: v.string() },
  handler: (ctx, args) => UsersModel.getUserById(ctx, args),
});

/**
 * Checks whether a username is available for registration.
 */
export const checkUsernameAvailable = query({
  args: { username: usersTableFields.username },
  handler: (ctx, args) => UsersModel.checkUsernameAvailable(ctx, args),
});

/**
 * Lists mentors, prioritizing mentors currently marked available.
 */
export const listMentors = query({
  args: { limit: v.optional(v.number()) },
  handler: (ctx, args) => UsersModel.listMentors(ctx, args),
});

/**
 * Returns the caller's mentor privacy settings with defaults applied.
 */
export const getMyMentorPrivacySettings = query({
  args: {},
  handler: (ctx) => UsersModel.getMyMentorPrivacySettings(ctx),
});

/**
 * Updates mentor identity disclosure settings for the caller.
 */
export const updateMyMentorPrivacySettings = mutation({
  args: updateMentorPrivacySettingsArgsValidator,
  handler: (ctx, args) => UsersModel.updateMyMentorPrivacySettings(ctx, args),
});

/**
 * Returns current username change eligibility using client-provided time.
 */
export const getUsernameChangeStatus = query({
  args: { nowMs: v.number() },
  handler: (ctx, args) => UsersModel.getUsernameChangeStatus(ctx, args),
});

/**
 * Updates the caller's username if validation and cooldown checks pass.
 */
export const updateUsername = mutation({
  args: { username: usersTableFields.username },
  handler: (ctx, args) => UsersModel.updateUsername(ctx, args),
});

/**
 * Writes the complete mentee onboarding payload and marks the user complete.
 */
export const setUserOnboardingComplete = mutation({
  args: setUserOnboardingCompleteArgsValidator,
  returns: v.id("users"),
  handler: (ctx, args) => UsersModel.setUserOnboardingComplete(ctx, args),
});

/**
 * Saves required user profile details without changing onboarding status.
 */
export const updateUserProfile = mutation({
  args: updateUserProfileArgsValidator,
  handler: (ctx, args) => UsersModel.updateUserProfile(ctx, args),
});

/**
 * Saves the caller's mentee profile without changing onboarding status.
 */
export const updateMenteeProfile = mutation({
  args: menteeProfileValidator,
  handler: (ctx, args) => UsersModel.updateMenteeProfile(ctx, args),
});

/**
 * Updates post-onboarding profile basics such as bio, title and location.
 */
export const updateUserProfileBasics = mutation({
  args: {
    bio: v.optional(usersTableFields.bio),
    location: v.optional(usersTableFields.location),
    title: v.optional(usersTableFields.title),
  },
  handler: (ctx, args) => UsersModel.updateUserProfileBasics(ctx, args),
});

/**
 * Partially updates mentee profile details.
 */
export const updateMenteeProfileDetails = mutation({
  args: menteeProfileValidator.partial(),
  handler: (ctx, args) => UsersModel.updateMenteeProfileDetails(ctx, args),
});

/**
 * Replaces the caller's interest tags.
 */
export const updateUserInterests = mutation({
  args: updateUserInterestsArgsValidator,
  returns: v.id("users"),
  handler: (ctx, args) => UsersModel.updateUserInterests(ctx, args),
});

/**
 * Replaces the caller's industry tags.
 */
export const updateUserIndustries = mutation({
  args: updateUserIndustriesArgsValidator,
  returns: v.id("users"),
  handler: (ctx, args) => UsersModel.updateUserIndustries(ctx, args),
});

/**
 * Replaces mentor profile fields for the current user.
 */
export const updateMentorProfile = mutation({
  args: updateMentorProfileArgsValidator,
  handler: (ctx, args) => UsersModel.updateMentorProfile(ctx, args),
});

/**
 * Adds an education entry to the caller profile.
 */
export const addEducation = mutation({
  args: { entry: educationEntryValidator },
  handler: (ctx, args) => UsersModel.addEducation(ctx, args),
});

/**
 * Updates one education entry by index.
 */
export const updateEducation = mutation({
  args: { index: v.number(), entry: educationEntryValidator },
  handler: (ctx, args) => UsersModel.updateEducation(ctx, args),
});

/**
 * Removes one education entry by index.
 */
export const deleteEducation = mutation({
  args: { index: v.number() },
  handler: (ctx, args) => UsersModel.deleteEducation(ctx, args),
});

/**
 * Adds an experience entry to the caller profile.
 */
export const addExperience = mutation({
  args: { entry: experienceEntryValidator },
  handler: (ctx, args) => UsersModel.addExperience(ctx, args),
});

/**
 * Updates one experience entry by index.
 */
export const updateExperience = mutation({
  args: { index: v.number(), entry: experienceEntryValidator },
  handler: (ctx, args) => UsersModel.updateExperience(ctx, args),
});

/**
 * Removes one experience entry by index.
 */
export const deleteExperience = mutation({
  args: { index: v.number() },
  handler: (ctx, args) => UsersModel.deleteExperience(ctx, args),
});
