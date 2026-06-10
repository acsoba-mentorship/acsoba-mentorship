import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import * as MentorshipMeetingsModel from "./model/mentorshipMeetings";

export const listByMentorship = query({
  args: {
    mentorshipId: v.id("mentorships"),
  },
  handler: (ctx, args) => MentorshipMeetingsModel.listByMentorship(ctx, args),
});

export const createMeeting = mutation({
  args: {
    mentorshipId: v.id("mentorships"),
    title: v.string(),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    startAt: v.number(),
    endAt: v.number(),
  },
  handler: (ctx, args) => MentorshipMeetingsModel.createMeeting(ctx, args),
});

export const cancelMeeting = mutation({
  args: {
    meetingId: v.id("mentorshipMeetings"),
  },
  handler: (ctx, args) => MentorshipMeetingsModel.cancelMeeting(ctx, args),
});

export const completeMeeting = mutation({
  args: {
    meetingId: v.id("mentorshipMeetings"),
  },
  handler: (ctx, args) => MentorshipMeetingsModel.completeMeeting(ctx, args),
});
