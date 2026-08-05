import { v } from "convex/values";
import { formAnswerValidator } from "../formQuestions/fields";

export const exitFeedbackRespondentRoleValidator = v.union(
  v.literal("mentor"),
  v.literal("mentee")
);

export const exitFeedbackStatusValidator = v.union(
  v.literal("pending"),
  v.literal("submitted")
);

export const exitFeedbackTableFields = {
  mentorshipId: v.id("mentorships"),
  mentorId: v.id("users"),
  menteeId: v.id("users"),
  respondentId: v.id("users"),
  respondentRole: exitFeedbackRespondentRoleValidator,
  status: exitFeedbackStatusValidator,
  dueAt: v.number(),
  reason: v.optional(v.string()),
  overallRating: v.optional(v.number()),
  goalsAchieved: v.optional(v.boolean()),
  wouldRecommend: v.optional(v.boolean()),
  highlights: v.optional(v.string()),
  improvements: v.optional(v.string()),
  additionalComments: v.optional(v.string()),
  answers: v.optional(v.array(formAnswerValidator)),
  submittedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
};
