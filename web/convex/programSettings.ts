import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import * as ProgramSettingsModel from "./model/programSettings";

export const getForAdmin = query({
  args: {},
  handler: (ctx) => ProgramSettingsModel.getForAdmin(ctx),
});

export const updateForAdmin = mutation({
  args: {
    maxActiveMentorsPerMentee: v.number(),
    requestExpiryDays: v.number(),
    pulseSurveyIntervalDays: v.number(),
    exitSurveyDueDays: v.number(),
  },
  handler: (ctx, args) => ProgramSettingsModel.updateForAdmin(ctx, args),
});
