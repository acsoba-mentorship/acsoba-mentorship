import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import * as ExitFeedbackModel from "./model/exitFeedback";

export const getMineForMentorship = query({
  args: { mentorshipId: v.id("mentorships") },
  handler: (ctx, args) => ExitFeedbackModel.getMineForMentorship(ctx, args),
});

export const listPendingMine = query({
  args: {},
  handler: (ctx) => ExitFeedbackModel.listPendingMine(ctx),
});

export const initiate = mutation({
  args: { mentorshipId: v.id("mentorships") },
  handler: (ctx, args) => ExitFeedbackModel.initiate(ctx, args),
});

export const submit = mutation({
  args: {
    feedbackId: v.id("exitFeedback"),
    reason: v.string(),
    overallRating: v.number(),
    goalsAchieved: v.boolean(),
    wouldRecommend: v.boolean(),
    highlights: v.optional(v.string()),
    improvements: v.optional(v.string()),
    additionalComments: v.optional(v.string()),
  },
  handler: (ctx, args) => ExitFeedbackModel.submit(ctx, args),
});

export const listForAdmin = query({
  args: {},
  handler: (ctx) => ExitFeedbackModel.listForAdmin(ctx),
});
