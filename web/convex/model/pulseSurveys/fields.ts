import { v } from "convex/values";
import { formAnswerValidator } from "../formQuestions/fields";

export const pulseSurveyRespondentRoleValidator = v.union(
  v.literal("mentor"),
  v.literal("mentee")
);

export const pulseSurveyStatusValidator = v.union(
  v.literal("pending"),
  v.literal("submitted")
);

export const mentorshipPulseSurveysTableFields = {
  mentorshipId: v.id("mentorships"),
  mentorId: v.id("users"),
  menteeId: v.id("users"),
  respondentId: v.id("users"),
  respondentRole: pulseSurveyRespondentRoleValidator,
  cycleNumber: v.number(),
  dueAt: v.number(),
  status: pulseSurveyStatusValidator,

  relationshipRating: v.optional(v.number()),
  communicationRating: v.optional(v.number()),
  progressRating: v.optional(v.number()),
  needsSupport: v.optional(v.boolean()),
  comments: v.optional(v.string()),
  answers: v.optional(v.array(formAnswerValidator)),
  submittedAt: v.optional(v.number()),

  createdAt: v.number(),
  updatedAt: v.number(),
};
