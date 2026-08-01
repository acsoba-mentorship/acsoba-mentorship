import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import * as VolunteeringModel from "./model/volunteering";

export const listActivities = query({
  args: {},
  handler: (ctx) => VolunteeringModel.listActivitiesForMember(ctx),
});

export const toggleSignup = mutation({
  args: { activityId: v.id("volunteerActivities") },
  handler: (ctx, args) => VolunteeringModel.toggleSignup(ctx, args),
});

export const setSignups = mutation({
  args: { activityIds: v.array(v.id("volunteerActivities")) },
  handler: (ctx, args) => VolunteeringModel.setSignups(ctx, args),
});

export const listActivitiesForAdmin = query({
  args: {},
  handler: (ctx) => VolunteeringModel.listActivitiesForAdmin(ctx),
});

export const createActivity = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: (ctx, args) => VolunteeringModel.createActivity(ctx, args),
});

export const updateActivity = mutation({
  args: {
    activityId: v.id("volunteerActivities"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: (ctx, args) => VolunteeringModel.updateActivity(ctx, args),
});

export const listSignupsForActivity = query({
  args: { activityId: v.id("volunteerActivities") },
  handler: (ctx, args) => VolunteeringModel.listSignupsForActivity(ctx, args),
});
