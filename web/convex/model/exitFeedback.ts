import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import {
  getAuthenticatedUser,
  requireAdmin,
  requireOnboardingComplete,
} from "./auth";
import { getEffectiveProgramSettings } from "./programSettings";
import { createNotification } from "./notifications";

type RespondentRole = "mentor" | "mentee";

function getRole(
  mentorship: Doc<"mentorships">,
  userId: Id<"users">
): RespondentRole | null {
  if (mentorship.mentorId === userId) return "mentor";
  if (mentorship.menteeId === userId) return "mentee";
  return null;
}

function normalizeRating(rating: number) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Overall rating must be a whole number from 1 to 5");
  }
  return rating;
}

function normalizeRequiredText(value: string, label: string, maximum: number) {
  const clean = value.trim();
  if (!clean) throw new Error(`${label} is required`);
  if (clean.length > maximum) {
    throw new Error(`${label} must be ${maximum} characters or fewer`);
  }
  return clean;
}

function normalizeOptionalText(value: string | undefined, maximum: number) {
  const clean = value?.trim();
  if (!clean) return undefined;
  if (clean.length > maximum) {
    throw new Error(`Feedback must be ${maximum} characters or fewer`);
  }
  return clean;
}

async function getAuthorizedMentorship(
  ctx: QueryCtx | MutationCtx,
  mentorshipId: Id<"mentorships">
) {
  const user = requireOnboardingComplete(await getAuthenticatedUser(ctx));
  const mentorship = await ctx.db.get("mentorships", mentorshipId);
  if (!mentorship) throw new Error("Mentorship not found");
  const role = getRole(mentorship, user._id);
  if (!role) throw new Error("Unauthorized to access this mentorship");
  return { user, mentorship, role };
}

async function createFeedbackIfMissing(
  ctx: MutationCtx,
  {
    mentorship,
    respondentRole,
    dueAt,
    now,
  }: {
    mentorship: Doc<"mentorships">;
    respondentRole: RespondentRole;
    dueAt: number;
    now: number;
  }
) {
  const respondentId =
    respondentRole === "mentor" ? mentorship.mentorId : mentorship.menteeId;
  const existing = await ctx.db
    .query("exitFeedback")
    .withIndex("by_mentorshipId_respondentId", (q) =>
      q.eq("mentorshipId", mentorship._id).eq("respondentId", respondentId)
    )
    .unique();
  if (existing) return existing._id;

  const feedbackId = await ctx.db.insert("exitFeedback", {
    mentorshipId: mentorship._id,
    mentorId: mentorship.mentorId,
    menteeId: mentorship.menteeId,
    respondentId,
    respondentRole,
    status: "pending",
    dueAt,
    createdAt: now,
    updatedAt: now,
  });

  await createNotification(ctx, {
    userId: respondentId,
    type: "exit_feedback_due",
    title: "Exit feedback requested",
    message:
      "Please complete your independent exit survey so the programme team can learn from this mentorship.",
    href:
      respondentRole === "mentor"
        ? `/mentor/mentorships/${mentorship._id}`
        : `/mentorships/${mentorship._id}`,
  });

  return feedbackId;
}

export async function getMineForMentorship(
  ctx: QueryCtx,
  { mentorshipId }: { mentorshipId: Id<"mentorships"> }
) {
  const { user, mentorship } = await getAuthorizedMentorship(ctx, mentorshipId);
  const feedback = await ctx.db
    .query("exitFeedback")
    .withIndex("by_mentorshipId_respondentId", (q) =>
      q.eq("mentorshipId", mentorshipId).eq("respondentId", user._id)
    )
    .unique();

  return {
    exitInitiatedAt: mentorship.exitInitiatedAt ?? null,
    mentorshipStatus: mentorship.status,
    feedback: feedback
      ? {
          _id: feedback._id,
          respondentRole: feedback.respondentRole,
          status: feedback.status,
          dueAt: feedback.dueAt,
          submittedAt: feedback.submittedAt ?? null,
        }
      : null,
  };
}

export async function listPendingMine(ctx: QueryCtx) {
  const user = await getAuthenticatedUser(ctx);
  return ctx.db
    .query("exitFeedback")
    .withIndex("by_respondentId_status", (q) =>
      q.eq("respondentId", user._id).eq("status", "pending")
    )
    .order("desc")
    .collect();
}

export async function initiate(
  ctx: MutationCtx,
  { mentorshipId }: { mentorshipId: Id<"mentorships"> }
) {
  const { user, mentorship } = await getAuthorizedMentorship(ctx, mentorshipId);
  if (mentorship.status !== "active") {
    throw new Error("Only an active mentorship can enter the exit process");
  }

  const now = Date.now();
  const settings = await getEffectiveProgramSettings(ctx);
  const dueAt =
    now + settings.exitSurveyDueDays * 24 * 60 * 60 * 1000;

  if (!mentorship.exitInitiatedAt) {
    await ctx.db.patch("mentorships", mentorship._id, {
      exitInitiatedAt: now,
      exitInitiatedBy: user._id,
      updatedAt: now,
    });
  }

  await createFeedbackIfMissing(ctx, {
    mentorship,
    respondentRole: "mentor",
    dueAt,
    now,
  });
  await createFeedbackIfMissing(ctx, {
    mentorship,
    respondentRole: "mentee",
    dueAt,
    now,
  });

  return mentorship._id;
}

export async function submit(
  ctx: MutationCtx,
  {
    feedbackId,
    reason,
    overallRating,
    goalsAchieved,
    wouldRecommend,
    highlights,
    improvements,
    additionalComments,
  }: {
    feedbackId: Id<"exitFeedback">;
    reason: string;
    overallRating: number;
    goalsAchieved: boolean;
    wouldRecommend: boolean;
    highlights?: string;
    improvements?: string;
    additionalComments?: string;
  }
) {
  const user = requireOnboardingComplete(await getAuthenticatedUser(ctx));
  const feedback = await ctx.db.get("exitFeedback", feedbackId);
  if (!feedback || feedback.respondentId !== user._id) {
    throw new Error("Exit feedback form not found");
  }
  if (feedback.status !== "pending") {
    throw new Error("This exit feedback form has already been submitted");
  }

  const now = Date.now();
  await ctx.db.patch("exitFeedback", feedback._id, {
    status: "submitted",
    reason: normalizeRequiredText(reason, "Reason for ending", 1000),
    overallRating: normalizeRating(overallRating),
    goalsAchieved,
    wouldRecommend,
    highlights: normalizeOptionalText(highlights, 2000),
    improvements: normalizeOptionalText(improvements, 2000),
    additionalComments: normalizeOptionalText(additionalComments, 2000),
    submittedAt: now,
    updatedAt: now,
  });

  const allFeedback = await ctx.db
    .query("exitFeedback")
    .withIndex("by_mentorshipId", (q) =>
      q.eq("mentorshipId", feedback.mentorshipId)
    )
    .collect();
  const mentorshipCompleted =
    allFeedback.length >= 2 &&
    allFeedback.every(
      (item) => item._id === feedback._id || item.status === "submitted"
    );

  if (mentorshipCompleted) {
    const mentorship = await ctx.db.get("mentorships", feedback.mentorshipId);
    if (mentorship?.status === "active") {
      await ctx.db.patch("mentorships", mentorship._id, {
        status: "completed",
        endDate: now,
        updatedAt: now,
      });
    }
  }

  return { feedbackId: feedback._id, mentorshipCompleted };
}

export async function listForAdmin(ctx: QueryCtx) {
  await requireAdmin(ctx);
  const feedback = await ctx.db
    .query("exitFeedback")
    .withIndex("by_status_dueAt", (q) => q.eq("status", "submitted"))
    .order("desc")
    .collect();
  const respondents = await Promise.all(
    feedback.map((item) => ctx.db.get("users", item.respondentId))
  );

  return feedback.map((item, index) => ({
    _id: item._id,
    mentorshipId: item.mentorshipId,
    respondentName: respondents[index]?.name ?? "Unknown user",
    respondentRole: item.respondentRole,
    reason: item.reason ?? null,
    overallRating: item.overallRating ?? null,
    goalsAchieved: item.goalsAchieved ?? null,
    wouldRecommend: item.wouldRecommend ?? null,
    highlights: item.highlights ?? null,
    improvements: item.improvements ?? null,
    additionalComments: item.additionalComments ?? null,
    submittedAt: item.submittedAt ?? null,
  }));
}
