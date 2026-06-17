import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import * as MentorRequestsModel from "./model/mentorRequests";
import { mentorshipRequestsTableFields } from "./model/mentorRequests/fields";
import { usersTableFields } from "./model/users/fields";

/**
 * Lists mentorship requests received by a mentor.
 */
export const requestsByMentor = query({
  args: { mentorId: mentorshipRequestsTableFields.mentorId },
  handler: (ctx, args) => MentorRequestsModel.requestsByMentor(ctx, args),
});

/**
 * Lists mentorship requests created by a mentee.
 */
export const requestsByMentee = query({
  args: { menteeId: mentorshipRequestsTableFields.menteeId },
  handler: (ctx, args) => MentorRequestsModel.requestsByMentee(ctx, args),
});

/**
 * Creates a new mentorship request from the current mentee to a mentor.
 */
export const createRequest = mutation({
  args: {
    mentorUsername: usersTableFields.username,
    message: mentorshipRequestsTableFields.message,
  },
  handler: (ctx, args) => MentorRequestsModel.createRequest(ctx, args),
});

/**
 * Creates a new mentorship request from the current mentee to a mentor by user ID.
 */
export const createRequestByMentorId = mutation({
  args: {
    mentorId: v.id("users"),
    message: mentorshipRequestsTableFields.message,
  },
  handler: (ctx, args) => MentorRequestsModel.createRequestByMentorId(ctx, args),
});

/**
 * Accepts a pending mentorship request as the targeted mentor.
 */
export const acceptRequest = mutation({
  args: { requestId: v.id("mentorshipRequests") },
  handler: (ctx, args) => MentorRequestsModel.acceptRequest(ctx, args),
});

/**
 * Rejects a pending mentorship request as the targeted mentor.
 */
export const rejectRequest = mutation({
  args: { requestId: v.id("mentorshipRequests") },
  handler: (ctx, args) => MentorRequestsModel.rejectRequest(ctx, args),
});

/**
 * Expires pending requests whose response window has elapsed.
 * This is called by the Convex cron job.
 */
export const expireStalePendingRequests = internalMutation({
  args: {},
  handler: (ctx) => MentorRequestsModel.expireStalePendingRequests(ctx),
});
