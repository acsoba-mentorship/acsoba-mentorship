import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import {
  getAuthenticatedUser,
  requireOnboardingComplete,
} from "./auth";
import { fetchUsersById } from "./helper";
import {
  DEFAULT_PROGRAM_SETTINGS,
  getEffectiveProgramSettings,
} from "./programSettings";
import { createNotification } from "./notifications";

type Ctx = QueryCtx | MutationCtx;

export const PULSE_SURVEY_INTERVAL_DAYS =
  DEFAULT_PROGRAM_SETTINGS.pulseSurveyIntervalDays;

type RespondentRole = "mentor" | "mentee";

function getRespondentRole(
  mentorship: Doc<"mentorships">,
  userId: Id<"users">
): RespondentRole | null {
  if (mentorship.mentorId === userId) {
    return "mentor";
  }

  if (mentorship.menteeId === userId) {
    return "mentee";
  }

  return null;
}

function getCounterpartId(
  mentorship: Doc<"mentorships">,
  role: RespondentRole
) {
  return role === "mentor" ? mentorship.menteeId : mentorship.mentorId;
}

async function getAuthorizedMentorship(
  ctx: Ctx,
  mentorshipId: Id<"mentorships">
): Promise<{
  currentUser: Doc<"users">;
  mentorship: Doc<"mentorships">;
  role: RespondentRole;
}> {
  const currentUser = requireOnboardingComplete(await getAuthenticatedUser(ctx));

  const mentorship = await ctx.db.get("mentorships", mentorshipId);

  if (!mentorship) {
    throw new Error("Mentorship not found");
  }

  if (mentorship.status !== "active") {
    throw new Error("Only active mentorships can have pulse surveys");
  }

  const role = getRespondentRole(mentorship, currentUser._id);

  if (!role) {
    throw new Error("Unauthorized to access this mentorship");
  }

  return { currentUser, mentorship, role };
}

function normalizeRating(value: number, fieldName: string) {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new Error(`${fieldName} must be a whole number from 1 to 5`);
  }

  return value;
}

function normalizeOptionalComments(comments?: string) {
  const trimmed = comments?.trim();

  if (!trimmed) {
    return undefined;
  }

  if (trimmed.length > 1000) {
    throw new Error("Comments must be 1000 characters or fewer");
  }

  return trimmed;
}

function buildPulseSurveyView({
  survey,
  mentorship,
  counterpart,
}: {
  survey: Doc<"mentorshipPulseSurveys">;
  mentorship: Doc<"mentorships">;
  counterpart: Doc<"users"> | null;
}) {
  return {
    ...survey,
    mentorshipStatus: mentorship.status,
    counterpartName: counterpart?.name?.trim() || "Unknown user",
    counterpartTitle: counterpart?.title?.trim() || "Community member",
    counterpartUsername: counterpart?.username ?? null,
  };
}

/**
 * Lists pending pulse surveys for the current user across all active mentorships.
 *
 * Used by dashboard reminders.
 */
export async function listPendingForCurrentUser(ctx: QueryCtx) {
  const currentUser = requireOnboardingComplete(await getAuthenticatedUser(ctx));

  const pendingSurveys = await ctx.db
    .query("mentorshipPulseSurveys")
    .withIndex("by_respondentId_status", (q) =>
      q.eq("respondentId", currentUser._id).eq("status", "pending")
    )
    .collect();

  const surveyMentorshipPairs = await Promise.all(
    pendingSurveys.map(async (survey) => ({
      survey,
      mentorship: await ctx.db.get("mentorships", survey.mentorshipId),
    }))
  );

  const activePairs = surveyMentorshipPairs.filter(
    (
      pair
    ): pair is {
      survey: Doc<"mentorshipPulseSurveys">;
      mentorship: Doc<"mentorships">;
    } => Boolean(pair.mentorship && pair.mentorship.status === "active")
  );

  const counterpartIds = activePairs.map(({ survey, mentorship }) =>
    getCounterpartId(mentorship, survey.respondentRole)
  );

  const counterpartById = await fetchUsersById(ctx, counterpartIds);

  return activePairs
    .map(({ survey, mentorship }) =>
      buildPulseSurveyView({
        survey,
        mentorship,
        counterpart:
          counterpartById.get(
            getCounterpartId(mentorship, survey.respondentRole)
          ) ?? null,
      })
    )
    .sort((a, b) => a.dueAt - b.dueAt);
}

/**
 * Lists pending pulse surveys for the current user inside one mentorship workspace.
 */
export async function listPendingByMentorship(
  ctx: QueryCtx,
  { mentorshipId }: { mentorshipId: Id<"mentorships"> }
) {
  const { currentUser, mentorship, role } = await getAuthorizedMentorship(
    ctx,
    mentorshipId
  );

  const pendingSurveys = await ctx.db
    .query("mentorshipPulseSurveys")
    .withIndex("by_mentorshipId_respondentId_status", (q) =>
      q
        .eq("mentorshipId", mentorshipId)
        .eq("respondentId", currentUser._id)
        .eq("status", "pending")
    )
    .collect();

  const counterpart = await ctx.db.get(
    "users",
    getCounterpartId(mentorship, role)
  );

  return pendingSurveys
    .map((survey) =>
      buildPulseSurveyView({
        survey,
        mentorship,
        counterpart,
      })
    )
    .sort((a, b) => a.dueAt - b.dueAt);
}

/**
 * Submits one pending pulse survey.
 */
export async function submitPulseSurvey(
  ctx: MutationCtx,
  {
    surveyId,
    relationshipRating,
    communicationRating,
    progressRating,
    needsSupport,
    comments,
  }: {
    surveyId: Id<"mentorshipPulseSurveys">;
    relationshipRating: number;
    communicationRating: number;
    progressRating: number;
    needsSupport: boolean;
    comments?: string;
  }
) {
  const currentUser = requireOnboardingComplete(await getAuthenticatedUser(ctx));

  const survey = await ctx.db.get("mentorshipPulseSurveys", surveyId);

  if (!survey) {
    throw new Error("Pulse survey not found");
  }

  if (survey.respondentId !== currentUser._id) {
    throw new Error("Unauthorized to submit this pulse survey");
  }

  if (survey.status !== "pending") {
    throw new Error("This pulse survey has already been submitted");
  }

  const mentorship = await ctx.db.get("mentorships", survey.mentorshipId);

  if (!mentorship || mentorship.status !== "active") {
    throw new Error("Only active mentorships can receive pulse survey responses");
  }

  const now = Date.now();

  await ctx.db.patch("mentorshipPulseSurveys", survey._id, {
    status: "submitted",
    relationshipRating: normalizeRating(
      relationshipRating,
      "Relationship rating"
    ),
    communicationRating: normalizeRating(
      communicationRating,
      "Communication rating"
    ),
    progressRating: normalizeRating(progressRating, "Progress rating"),
    needsSupport,
    comments: normalizeOptionalComments(comments),
    submittedAt: now,
    updatedAt: now,
  });

  return survey._id;
}

async function createPulseSurveyIfMissing(
  ctx: MutationCtx,
  {
    mentorship,
    respondentRole,
    cycleNumber,
    dueAt,
    now,
  }: {
    mentorship: Doc<"mentorships">;
    respondentRole: RespondentRole;
    cycleNumber: number;
    dueAt: number;
    now: number;
  }
) {
  const existingSurvey = await ctx.db
    .query("mentorshipPulseSurveys")
    .withIndex("by_mentorshipId_cycleNumber_respondentRole", (q) =>
      q
        .eq("mentorshipId", mentorship._id)
        .eq("cycleNumber", cycleNumber)
        .eq("respondentRole", respondentRole)
    )
    .unique();

  if (existingSurvey) {
    return false;
  }

  const respondentId =
    respondentRole === "mentor" ? mentorship.mentorId : mentorship.menteeId;

  await ctx.db.insert("mentorshipPulseSurveys", {
    mentorshipId: mentorship._id,
    mentorId: mentorship.mentorId,
    menteeId: mentorship.menteeId,
    respondentId,
    respondentRole,
    cycleNumber,
    dueAt,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });

  await createNotification(ctx, {
    userId: respondentId,
    type: "pulse_survey_due",
    title: "Pulse survey due",
    message:
      "A periodic mentorship health check is ready. Your answers are visible to programme administrators, not your counterpart.",
    href:
      respondentRole === "mentor"
        ? `/mentor/mentorships/${mentorship._id}`
        : `/mentorships/${mentorship._id}`,
  });

  return true;
}

/**
 * Generates due pulse surveys for active mentorships.
 *
 * This creates one survey for the mentor and one survey for the mentee at the
 * configured interval. After the first cycle, cadence advances from the latest
 * assigned survey so changing the interval cannot collide with an old cycle
 * number.
 */
export async function generateDuePulseSurveys(ctx: MutationCtx) {
  const now = Date.now();
  const settings = await getEffectiveProgramSettings(ctx);
  const pulseSurveyIntervalMs =
    settings.pulseSurveyIntervalDays * 24 * 60 * 60 * 1000;

  const activeMentorships = await ctx.db
    .query("mentorships")
    .withIndex("by_status", (q) => q.eq("status", "active"))
    .collect();

  let createdCount = 0;

  for (const mentorship of activeMentorships) {
    const existingSurveys = await ctx.db
      .query("mentorshipPulseSurveys")
      .withIndex("by_mentorshipId", (q) =>
        q.eq("mentorshipId", mentorship._id)
      )
      .collect();

    let cycleNumber: number;
    let dueAt: number;

    if (existingSurveys.length === 0) {
      const elapsedMs = now - mentorship.startDate;
      if (elapsedMs < pulseSurveyIntervalMs) {
        continue;
      }

      cycleNumber = Math.max(1, Math.floor(elapsedMs / pulseSurveyIntervalMs));
      dueAt = mentorship.startDate + cycleNumber * pulseSurveyIntervalMs;
    } else {
      const latestCycleNumber = Math.max(
        ...existingSurveys.map((survey) => survey.cycleNumber)
      );
      const latestCycleSurveys = existingSurveys.filter(
        (survey) => survey.cycleNumber === latestCycleNumber
      );
      const latestDueAt = Math.max(
        ...latestCycleSurveys.map((survey) => survey.dueAt)
      );
      const hasMentorSurvey = latestCycleSurveys.some(
        (survey) => survey.respondentRole === "mentor"
      );
      const hasMenteeSurvey = latestCycleSurveys.some(
        (survey) => survey.respondentRole === "mentee"
      );

      if (!hasMentorSurvey || !hasMenteeSurvey) {
        cycleNumber = latestCycleNumber;
        dueAt = latestDueAt;
      } else {
        cycleNumber = latestCycleNumber + 1;
        dueAt = latestDueAt + pulseSurveyIntervalMs;
        if (now < dueAt) {
          continue;
        }
      }
    }

    const createdMentorSurvey = await createPulseSurveyIfMissing(ctx, {
      mentorship,
      respondentRole: "mentor",
      cycleNumber,
      dueAt,
      now,
    });

    const createdMenteeSurvey = await createPulseSurveyIfMissing(ctx, {
      mentorship,
      respondentRole: "mentee",
      cycleNumber,
      dueAt,
      now,
    });

    if (createdMentorSurvey) {
      createdCount += 1;
    }

    if (createdMenteeSurvey) {
      createdCount += 1;
    }
  }

  return { createdCount };
}
