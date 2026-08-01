import { query } from "./_generated/server";
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

export const listActiveForAdmin = query({
  args: {},
  handler: (ctx) => MentorshipsModel.listActiveForAdmin(ctx),
});