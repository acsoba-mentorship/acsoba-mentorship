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
  onboardingIndustries: [
    "Technology",
    "Finance",
    "Healthcare",
    "Education",
    "Consulting",
    "Marketing",
    "Engineering",
    "Legal",
  ],
  onboardingInterests: [
    "Leadership",
    "Career growth",
    "Networking",
    "Public speaking",
    "Entrepreneurship",
    "Work-life balance",
    "Technical skills",
    "Interview prep",
  ],
} as const;

const CATALOG_MAX_ENTRIES = 50;
const CATALOG_ITEM_MAX_CHARACTERS = 80;

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

function normalizeCatalog(values: string[], label: string) {
  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const rawValue of values) {
    const value = rawValue.trim().replace(/\s+/g, " ");
    if (!value) continue;
    if (value.length > CATALOG_ITEM_MAX_CHARACTERS) {
      throw new Error(
        `${label} entries must be ${CATALOG_ITEM_MAX_CHARACTERS} characters or fewer`
      );
    }

    const key = value.toLocaleLowerCase("en-SG");
    if (!seen.has(key)) {
      seen.add(key);
      normalized.push(value);
    }
  }

  if (normalized.length === 0) {
    throw new Error(`${label} must include at least one entry`);
  }
  if (normalized.length > CATALOG_MAX_ENTRIES) {
    throw new Error(
      `${label} must include at most ${CATALOG_MAX_ENTRIES} entries`
    );
  }

  return normalized;
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
          onboardingIndustries:
            stored.onboardingIndustries ??
            [...DEFAULT_PROGRAM_SETTINGS.onboardingIndustries],
          onboardingInterests:
            stored.onboardingInterests ??
            [...DEFAULT_PROGRAM_SETTINGS.onboardingInterests],
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

export async function getOnboardingOptions(ctx: QueryCtx) {
  const settings = await getEffectiveProgramSettings(ctx);
  return {
    industries: settings.onboardingIndustries,
    interests: settings.onboardingInterests,
  };
}

export async function updateForAdmin(
  ctx: MutationCtx,
  args: {
    maxActiveMentorsPerMentee: number;
    requestExpiryDays: number;
    pulseSurveyIntervalDays: number;
    exitSurveyDueDays: number;
    onboardingIndustries: string[];
    onboardingInterests: string[];
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
    onboardingIndustries: normalizeCatalog(
      args.onboardingIndustries,
      "Onboarding industries"
    ),
    onboardingInterests: normalizeCatalog(
      args.onboardingInterests,
      "Onboarding interests"
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
