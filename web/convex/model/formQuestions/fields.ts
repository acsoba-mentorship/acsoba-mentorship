import { v } from "convex/values";

export const feedbackFormTypeValidator = v.union(
  v.literal("exit_feedback"),
  v.literal("pulse_survey"),
  v.literal("incident_report")
);

export const questionResponseTypeValidator = v.union(
  v.literal("single_choice"),
  v.literal("multiple_choice"),
  v.literal("short_text"),
  v.literal("long_text")
);

export const formAnswerInputValidator = v.object({
  questionKey: v.string(),
  value: v.union(v.string(), v.array(v.string())),
});

export const formAnswerValidator = v.object({
  questionKey: v.string(),
  prompt: v.string(),
  responseType: questionResponseTypeValidator,
  value: v.union(v.string(), v.array(v.string())),
});

export const formQuestionsTableFields = {
  questionKey: v.string(),
  formType: feedbackFormTypeValidator,
  prompt: v.string(),
  responseType: questionResponseTypeValidator,
  options: v.optional(v.array(v.string())),
  required: v.boolean(),
  order: v.number(),
  active: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
};
