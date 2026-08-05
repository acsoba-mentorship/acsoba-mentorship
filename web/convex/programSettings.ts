import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import * as ProgramSettingsModel from "./model/programSettings";

export const getForAdmin = query({
  args: {},
  handler: (ctx) => ProgramSettingsModel.getForAdmin(ctx),
});

export const getOnboardingOptions = query({
  args: {},
  handler: (ctx) => ProgramSettingsModel.getOnboardingOptions(ctx),
});

export const updateForAdmin = mutation({
  args: {
    maxActiveMentorsPerMentee: v.number(),
    requestExpiryDays: v.number(),
    pulseSurveyIntervalDays: v.number(),
    exitSurveyDueDays: v.number(),
    onboardingIndustries: v.array(v.string()),
    onboardingInterests: v.array(v.string()),
  },
  handler: (ctx, args) => ProgramSettingsModel.updateForAdmin(ctx, args),
});
