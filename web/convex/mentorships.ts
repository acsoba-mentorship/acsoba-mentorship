import { query } from "./_generated/server";
import { v } from "convex/values";
import * as MentorshipsModel from "./model/mentorships";
import { mentorshipsTableFields } from "./model/mentorships/fields";

/**
 * Lists active mentorships for the current mentor.
 */
export const activeByMentor = query({
  args: { mentorId: mentorshipsTableFields.mentorId },
  handler: (ctx, args) => MentorshipsModel.activeByMentor(ctx, args),
});

/**
 * Lists active mentorships for the current mentee.
 */
export const activeByMentee = query({
  args: { menteeId: mentorshipsTableFields.menteeId },
  handler: (ctx, args) => MentorshipsModel.activeByMentee(ctx, args),
});

/**
 * Lists completed/cancelled ("history") mentorships for the current mentor.
 */
export const historyByMentor = query({
  args: { mentorId: mentorshipsTableFields.mentorId },
  handler: (ctx, args) => MentorshipsModel.historyByMentor(ctx, args),
});

/**
 * Lists completed/cancelled ("history") mentorships for the current mentee.
 */
export const historyByMentee = query({
  args: { menteeId: mentorshipsTableFields.menteeId },
  handler: (ctx, args) => MentorshipsModel.historyByMentee(ctx, args),
});

export const listActiveForAdmin = query({
  args: { search: v.optional(v.string()) },
  handler: (ctx, args) => MentorshipsModel.listActiveForAdmin(ctx, args),
});