import { v } from "convex/values";

/**
 * FR18 — Volunteering.
 *
 * "All users to be able to indicate interest in the app to offer their
 * time beyond mentoring ... Admin to be able to update the list of
 * Volunteering activities from time to time and for this list to be
 * somewhere on the user's dashboard so they can just check or uncheck
 * the box to indicate that they would like to volunteer."
 */

export const volunteerActivitiesTableFields = {
  name: v.string(),
  description: v.optional(v.string()),
  isActive: v.boolean(),
  createdBy: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.number(),
};

export const volunteerSignupsTableFields = {
  activityId: v.id("volunteerActivities"),
  userId: v.id("users"),
  createdAt: v.number(),
};
