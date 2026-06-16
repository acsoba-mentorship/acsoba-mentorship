import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import {
  getAuthenticatedUser,
  requireOnboardingComplete,
} from "./auth";

type Ctx = QueryCtx | MutationCtx;

function normalizeTitle(title: string) {
  const trimmed = title.trim();

  if (!trimmed) {
    throw new Error("Meeting title is required");
  }

  if (trimmed.length > 120) {
    throw new Error("Meeting title must be 120 characters or fewer");
  }

  return trimmed;
}

function normalizeOptionalText(value?: string) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  if (trimmed.length > 1000) {
    throw new Error("Meeting details must be 1000 characters or fewer");
  }

  return trimmed;
}

function assertValidMeetingTime(startAt: number, endAt: number) {
  if (!Number.isFinite(startAt) || !Number.isFinite(endAt)) {
    throw new Error("Meeting start and end times are required");
  }

  if (endAt <= startAt) {
    throw new Error("Meeting end time must be after the start time");
  }

  const durationInHours = (endAt - startAt) / (1000 * 60 * 60);

  if (durationInHours > 8) {
    throw new Error("Meeting duration must be 8 hours or fewer");
  }
}

async function getAuthorizedMentorship(
  ctx: Ctx,
  mentorshipId: Id<"mentorships">
): Promise<{
  currentUser: Doc<"users">;
  mentorship: Doc<"mentorships">;
  role: "mentor" | "mentee";
}> {
  const currentUser = requireOnboardingComplete(await getAuthenticatedUser(ctx));

  const mentorship = await ctx.db.get("mentorships", mentorshipId);

  if (!mentorship) {
    throw new Error("Mentorship not found");
  }

  if (mentorship.status !== "active") {
    throw new Error("Only active mentorships can have meetings");
  }

  if (mentorship.mentorId === currentUser._id) {
    return { currentUser, mentorship, role: "mentor" };
  }

  if (mentorship.menteeId === currentUser._id) {
    return { currentUser, mentorship, role: "mentee" };
  }

  throw new Error("Unauthorized to access this mentorship");
}

async function getMeetingAndAuthorize(
  ctx: Ctx,
  meetingId: Id<"mentorshipMeetings">
) {
  const meeting = await ctx.db.get("mentorshipMeetings", meetingId);

  if (!meeting) {
    throw new Error("Meeting not found");
  }

  const auth = await getAuthorizedMentorship(ctx, meeting.mentorshipId);

  return { meeting, ...auth };
}

export async function listByMentorship(
  ctx: QueryCtx,
  { mentorshipId }: { mentorshipId: Id<"mentorships"> }
) {
  await getAuthorizedMentorship(ctx, mentorshipId);

  return ctx.db
    .query("mentorshipMeetings")
    .withIndex("by_mentorshipId_startAt", (q) => q.eq("mentorshipId", mentorshipId))
    .order("desc")
    .collect();
}

export async function createMeeting(
  ctx: MutationCtx,
  {
    mentorshipId,
    title,
    description,
    location,
    startAt,
    endAt,
  }: {
    mentorshipId: Id<"mentorships">;
    title: string;
    description?: string;
    location?: string;
    startAt: number;
    endAt: number;
  }
) {
  const { currentUser } = await getAuthorizedMentorship(ctx, mentorshipId);

  assertValidMeetingTime(startAt, endAt);

  const now = Date.now();

  return ctx.db.insert("mentorshipMeetings", {
    mentorshipId,
    title: normalizeTitle(title),
    description: normalizeOptionalText(description),
    location: normalizeOptionalText(location),
    startAt,
    endAt,
    status: "scheduled",
    createdBy: currentUser._id,
    createdAt: now,
    updatedAt: now,
  });
}

export async function cancelMeeting(
  ctx: MutationCtx,
  { meetingId }: { meetingId: Id<"mentorshipMeetings"> }
) {
  const { meeting } = await getMeetingAndAuthorize(ctx, meetingId);

  await ctx.db.patch(meeting._id, {
    status: "cancelled",
    updatedAt: Date.now(),
  });

  return meeting._id;
}

export async function completeMeeting(
  ctx: MutationCtx,
  { meetingId }: { meetingId: Id<"mentorshipMeetings"> }
) {
  const { meeting } = await getMeetingAndAuthorize(ctx, meetingId);

  await ctx.db.patch(meeting._id, {
    status: "completed",
    updatedAt: Date.now(),
  });

  return meeting._id;
}

export async function deleteMeeting(
  ctx: MutationCtx,
  { meetingId }: { meetingId: Id<"mentorshipMeetings"> }
) {
  const { meeting } = await getMeetingAndAuthorize(ctx, meetingId);

  await ctx.db.delete(meeting._id);

  return meeting._id;
}