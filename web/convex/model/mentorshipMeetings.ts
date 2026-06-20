import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import {
  getAuthenticatedUser,
  requireOnboardingComplete,
} from "./auth";
import { fetchUsersById } from "./helper";

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

function assertCanManageMeetings(role: "mentor" | "mentee") {
  if (role !== "mentor") {
    throw new Error("Only mentors can schedule, cancel, complete, or delete meetings.");
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

export async function listForCurrentUser(ctx: QueryCtx) {
  const currentUser = requireOnboardingComplete(await getAuthenticatedUser(ctx));

  const [mentorMentorships, menteeMentorships] = await Promise.all([
    ctx.db
      .query("mentorships")
      .withIndex("by_mentorId_status", (q) =>
        q.eq("mentorId", currentUser._id).eq("status", "active")
      )
      .collect(),

    ctx.db
      .query("mentorships")
      .withIndex("by_menteeId_status", (q) =>
        q.eq("menteeId", currentUser._id).eq("status", "active")
      )
      .collect(),
  ]);

  const mentorshipById = new Map<Id<"mentorships">, Doc<"mentorships">>();

  for (const mentorship of [...mentorMentorships, ...menteeMentorships]) {
    mentorshipById.set(mentorship._id, mentorship);
  }

  const mentorships = [...mentorshipById.values()];

  const counterpartIds = mentorships.map((mentorship) =>
    mentorship.mentorId === currentUser._id
      ? mentorship.menteeId
      : mentorship.mentorId
  );

  const counterpartById = await fetchUsersById(ctx, counterpartIds);

  const meetingsByMentorship = await Promise.all(
    mentorships.map((mentorship) =>
      ctx.db
        .query("mentorshipMeetings")
        .withIndex("by_mentorshipId_startAt", (q) =>
          q.eq("mentorshipId", mentorship._id)
        )
        .collect()
    )
  );

  return mentorships
    .flatMap((mentorship, index) => {
      const viewerRole =
        mentorship.mentorId === currentUser._id
          ? ("mentor" as const)
          : ("mentee" as const);

      const counterpartId =
        viewerRole === "mentor" ? mentorship.menteeId : mentorship.mentorId;

      const counterpart = counterpartById.get(counterpartId) ?? null;
      const counterpartName = counterpart?.name?.trim() || "Unknown user";

      return meetingsByMentorship[index].map((meeting) => ({
        ...meeting,
        viewerRole,
        counterpartId,
        counterpartName,
        counterpartTitle: counterpart?.title?.trim() || "Community member",
      }));
    })
    .sort((a, b) => a.startAt - b.startAt);
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
  const { currentUser, role } = await getAuthorizedMentorship(
    ctx,
    mentorshipId
  );

  assertCanManageMeetings(role);
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
  const { meeting, role } = await getMeetingAndAuthorize(ctx, meetingId);

  assertCanManageMeetings(role);

  if (meeting.status !== "scheduled") {
    throw new Error("Only scheduled meetings can be cancelled.");
  }

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
  const { meeting, role } = await getMeetingAndAuthorize(ctx, meetingId);
  assertCanManageMeetings(role);

  if (meeting.status !== "scheduled") {
    throw new Error("Only scheduled meetings can be completed.");
  }

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
  const { meeting, role } = await getMeetingAndAuthorize(ctx, meetingId);
  assertCanManageMeetings(role);

  await ctx.db.delete(meeting._id);

  return meeting._id;
}