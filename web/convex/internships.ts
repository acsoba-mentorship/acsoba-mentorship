import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import * as InternshipsModel from "./model/internships";
import { internshipStatusValidator } from "./model/internships/fields";

export const offer = mutation({
  args: {
    companyName: v.string(),
    role: v.string(),
    description: v.string(),
    startPeriod: v.string(),
    duration: v.string(),
    isPaid: v.boolean(),
    closingDate: v.number(),
    confirmedAuthority: v.boolean(),
  },
  handler: (ctx, args) => InternshipsModel.offer(ctx, args),
});

export const listOpen = query({
  args: { limit: v.optional(v.number()) },
  handler: (ctx, args) => InternshipsModel.listOpen(ctx, args),
});

export const getPosting = query({
  args: { internshipId: v.id("internships") },
  handler: (ctx, args) => InternshipsModel.getPosting(ctx, args),
});

export const myOffered = query({
  args: {},
  handler: (ctx) => InternshipsModel.myOffered(ctx),
});

export const updateStatus = mutation({
  args: {
    internshipId: v.id("internships"),
    status: internshipStatusValidator,
  },
  handler: (ctx, args) => InternshipsModel.updateStatus(ctx, args),
});

export const expressInterest = mutation({
  args: {
    internshipId: v.id("internships"),
    note: v.optional(v.string()),
  },
  handler: (ctx, args) => InternshipsModel.expressInterest(ctx, args),
});

export const listInterestsForPosting = query({
  args: { internshipId: v.id("internships") },
  handler: (ctx, args) => InternshipsModel.listInterestsForPosting(ctx, args),
});

export const acknowledgeInterest = mutation({
  args: { interestId: v.id("internshipInterests") },
  handler: (ctx, args) => InternshipsModel.acknowledgeInterest(ctx, args),
});

export const myInterests = query({
  args: {},
  handler: (ctx) => InternshipsModel.myInterests(ctx),
});
