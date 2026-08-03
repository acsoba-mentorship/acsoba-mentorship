import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import * as IncidentReportsModel from "./model/incidentReports";
import {
  incidentReporterRoleValidator,
  incidentStatusValidator,
} from "./model/incidentReports/fields";
import { formAnswerInputValidator } from "./model/formQuestions/fields";

export const submit = mutation({
  args: {
    reporterRole: incidentReporterRoleValidator,
    mentorshipId: v.optional(v.id("mentorships")),
    answers: v.array(formAnswerInputValidator),
  },
  handler: (ctx, args) => IncidentReportsModel.submit(ctx, args),
});

export const listReportTargets = query({
  args: { role: incidentReporterRoleValidator },
  handler: (ctx, args) => IncidentReportsModel.listReportTargets(ctx, args),
});

export const listMine = query({
  args: { limit: v.optional(v.number()) },
  handler: (ctx, args) => IncidentReportsModel.listMine(ctx, args),
});

export const listForAdmin = query({
  args: {
    status: v.optional(incidentStatusValidator),
  },
  handler: (ctx, args) => IncidentReportsModel.listForAdmin(ctx, args),
});

export const updateForAdmin = mutation({
  args: {
    reportId: v.id("incidentReports"),
    status: incidentStatusValidator,
    adminNotes: v.optional(v.string()),
  },
  handler: (ctx, args) => IncidentReportsModel.updateForAdmin(ctx, args),
});
