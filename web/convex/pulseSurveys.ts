import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import * as PulseSurveysModel from "./model/pulseSurveys";

export const listPendingForCurrentUser = query({
  args: {},
  handler: (ctx) => PulseSurveysModel.listPendingForCurrentUser(ctx),
});

export const listPendingByMentorship = query({
  args: {
    mentorshipId: v.id("mentorships"),
  },
  handler: (ctx, args) =>
    PulseSurveysModel.listPendingByMentorship(ctx, args),
});

export const submitPulseSurvey = mutation({
  args: {
    surveyId: v.id("mentorshipPulseSurveys"),
    relationshipRating: v.number(),
    communicationRating: v.number(),
    progressRating: v.number(),
    needsSupport: v.boolean(),
    comments: v.optional(v.string()),
  },
  handler: (ctx, args) => PulseSurveysModel.submitPulseSurvey(ctx, args),
});

export const generateDuePulseSurveys = internalMutation({
  args: {},
  handler: (ctx) => PulseSurveysModel.generateDuePulseSurveys(ctx),
});