import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import * as ExitFeedbackModel from "./model/exitFeedback";
import { formAnswerInputValidator } from "./model/formQuestions/fields";

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
    answers: v.array(formAnswerInputValidator),
  },
  handler: (ctx, args) => ExitFeedbackModel.submit(ctx, args),
});

export const listForAdmin = query({
  args: {},
  handler: (ctx) => ExitFeedbackModel.listForAdmin(ctx),
});
