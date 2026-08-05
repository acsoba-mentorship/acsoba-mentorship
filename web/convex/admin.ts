import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import * as AdminModel from "./model/admin";

export const getMyAccess = query({
  args: {},
  handler: (ctx) => AdminModel.getMyAccess(ctx),
});

export const claimMyAccess = mutation({
  args: {},
  handler: (ctx) => AdminModel.claimMyAccess(ctx),
});

export const listMemberships = query({
  args: {},
  handler: (ctx) => AdminModel.listMemberships(ctx),
});

export const inviteAdmin = mutation({
  args: { email: v.string() },
  handler: (ctx, args) => AdminModel.inviteAdmin(ctx, args),
});

export const revokeAdmin = mutation({
  args: {
    membershipId: v.id("adminMemberships"),
    reason: v.optional(v.string()),
  },
  handler: (ctx, args) => AdminModel.revokeAdmin(ctx, args),
});

export const getOverview = query({
  args: {},
  handler: (ctx) => AdminModel.getOverview(ctx),
});

export const listOutstandingForms = query({
  args: {},
  handler: (ctx) => AdminModel.listOutstandingForms(ctx),
});

export const listPulseSurveys = query({
  args: {},
  handler: (ctx) => AdminModel.listPulseSurveys(ctx),
});

export const listAuditLog = query({
  args: { search: v.optional(v.string()) },
  handler: (ctx, args) => AdminModel.listAuditLog(ctx, args),
});

export const listUsers = query({
  args: { search: v.optional(v.string()) },
  handler: (ctx, args) => AdminModel.listUsers(ctx, args),
});

export const suspendUser = mutation({
  args: {
    userId: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: (ctx, args) => AdminModel.suspendUser(ctx, args),
});

export const reactivateUser = mutation({
  args: { userId: v.id("users") },
  handler: (ctx, args) => AdminModel.reactivateUser(ctx, args),
});

export const sendUserMessage = mutation({
  args: {
    userId: v.id("users"),
    subject: v.string(),
    message: v.string(),
  },
  handler: (ctx, args) => AdminModel.sendUserMessage(ctx, args),
});

export const endMentorshipImmediately = mutation({
  args: {
    mentorshipId: v.id("mentorships"),
    reason: v.optional(v.string()),
  },
  handler: (ctx, args) => AdminModel.endMentorshipImmediately(ctx, args),
});
