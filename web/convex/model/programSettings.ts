import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { requireAdmin } from "./auth";
import { writeAdminAuditLog } from "./admin/audit";

type Ctx = QueryCtx | MutationCtx;

export const PROGRAM_SETTINGS_KEY = "default";

export const DEFAULT_PROGRAM_SETTINGS = {
  maxActiveMentorsPerMentee: 3,
  requestExpiryDays: 7,
  pulseSurveyIntervalDays: 30,
  exitSurveyDueDays: 14,
} as const;

function validateInteger(
  value: number,
  label: string,
  minimum: number,
  maximum: number
) {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${label} must be a whole number from ${minimum} to ${maximum}`);
  }
  return value;
}

export async function getEffectiveProgramSettings(ctx: Ctx) {
  const stored = await ctx.db
    .query("programSettings")
    .withIndex("by_key", (q) => q.eq("key", PROGRAM_SETTINGS_KEY))
    .unique();

  return {
    ...DEFAULT_PROGRAM_SETTINGS,
    ...(stored
      ? {
          maxActiveMentorsPerMentee: stored.maxActiveMentorsPerMentee,
          requestExpiryDays: stored.requestExpiryDays,
          pulseSurveyIntervalDays: stored.pulseSurveyIntervalDays,
          exitSurveyDueDays: stored.exitSurveyDueDays,
        }
      : {}),
    updatedAt: stored?.updatedAt ?? null,
    updatedBy: stored?.updatedBy ?? null,
  };
}

export async function getForAdmin(ctx: QueryCtx) {
  await requireAdmin(ctx);
  return getEffectiveProgramSettings(ctx);
}

export async function updateForAdmin(
  ctx: MutationCtx,
  args: {
    maxActiveMentorsPerMentee: number;
    requestExpiryDays: number;
    pulseSurveyIntervalDays: number;
    exitSurveyDueDays: number;
  }
) {
  const { user: admin } = await requireAdmin(ctx);
  const now = Date.now();
  const values = {
    maxActiveMentorsPerMentee: validateInteger(
      args.maxActiveMentorsPerMentee,
      "Maximum active mentors per mentee",
      1,
      20
    ),
    requestExpiryDays: validateInteger(
      args.requestExpiryDays,
      "Request expiry days",
      1,
      60
    ),
    pulseSurveyIntervalDays: validateInteger(
      args.pulseSurveyIntervalDays,
      "Pulse survey interval",
      7,
      365
    ),
    exitSurveyDueDays: validateInteger(
      args.exitSurveyDueDays,
      "Exit survey due days",
      1,
      90
    ),
  };

  const existing = await ctx.db
    .query("programSettings")
    .withIndex("by_key", (q) => q.eq("key", PROGRAM_SETTINGS_KEY))
    .unique();

  const patch: Omit<Doc<"programSettings">, "_id" | "_creationTime"> = {
    key: PROGRAM_SETTINGS_KEY,
    ...values,
    updatedBy: admin._id,
    updatedAt: now,
  };

  if (existing) {
    await ctx.db.patch("programSettings", existing._id, patch);
  } else {
    await ctx.db.insert("programSettings", patch);
  }

  await writeAdminAuditLog(ctx, {
    actorId: admin._id,
    action: "program_settings.updated",
    metadata: values,
  });

  return { ...values, updatedAt: now, updatedBy: admin._id };
}
