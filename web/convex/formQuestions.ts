import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import * as FormQuestionsModel from "./model/formQuestions";
import {
  feedbackFormTypeValidator,
  questionResponseTypeValidator,
} from "./model/formQuestions/fields";

export const listForForm = query({
  args: { formType: feedbackFormTypeValidator },
  handler: (ctx, args) => FormQuestionsModel.listForForm(ctx, args),
});

export const listForAdmin = query({
  args: { formType: feedbackFormTypeValidator },
  handler: (ctx, args) => FormQuestionsModel.listForAdmin(ctx, args),
});

export const saveQuestion = mutation({
  args: {
    questionKey: v.optional(v.string()),
    formType: feedbackFormTypeValidator,
    prompt: v.string(),
    responseType: questionResponseTypeValidator,
    options: v.optional(v.array(v.string())),
    required: v.boolean(),
    order: v.number(),
    active: v.boolean(),
  },
  handler: (ctx, args) => FormQuestionsModel.saveQuestion(ctx, args),
});

export const archiveQuestion = mutation({
  args: {
    formType: feedbackFormTypeValidator,
    questionKey: v.string(),
  },
  handler: (ctx, args) => FormQuestionsModel.archiveQuestion(ctx, args),
});
