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
  args: {},
  handler: (ctx) => AdminModel.listAuditLog(ctx),
});
