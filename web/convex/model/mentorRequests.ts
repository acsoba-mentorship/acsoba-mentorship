import { Infer } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { getInitials, toPublicMentorDTO } from "../helper";
import {
  getAuthenticatedUser,
  requireMenteeProfile,
  requireMentorProfile,
  requireOnboardingComplete,
} from "./auth";
import { usersTableFields } from "./users/fields";
import { mentorshipRequestsTableFields } from "./mentorRequests/fields";
import { createMentorshipFromAcceptedRequest } from "./mentorships";
import { fetchUsersById } from "./helper";
import {
  DEFAULT_PROGRAM_SETTINGS,
  getEffectiveProgramSettings,
} from "./programSettings";
import { createNotification } from "./notifications";

export const MENTORSHIP_REQUEST_EXPIRY_DAYS =
  DEFAULT_PROGRAM_SETTINGS.requestExpiryDays;
export const DEFAULT_MENTORSHIP_DURATION_MONTHS = 3;

type MentorshipRequestWithExpiresAt = Doc<"mentorshipRequests"> & {
  expiresAt: number;
};

/**
 * Returns the expiry timestamp after the configured number of complete
 * 24-hour periods have elapsed.
 */
function getMentorshipRequestExpiresAt(
  createdAt: number,
  expiryDays: number = MENTORSHIP_REQUEST_EXPIRY_DAYS
) {
  return createdAt + expiryDays * 24 * 60 * 60 * 1000;
}

function getRequestExpiresAt(
  request: Pick<Doc<"mentorshipRequests">, "createdAt" | "expiresAt">
) {
  return request.expiresAt ?? getMentorshipRequestExpiresAt(request.createdAt);
}

function normalizeDurationMonths(durationMonths: number) {
  if (
    !Number.isInteger(durationMonths) ||
    durationMonths < 1 ||
    durationMonths > 24
  ) {
    throw new Error(
      "Proposed mentorship length must be a whole number from 1 to 24 months"
    );
  }

  return durationMonths;
}

function isRequestExpired(
  request: Pick<
    Doc<"mentorshipRequests">,
    "status" | "createdAt" | "expiresAt"
  >,
  now = Date.now()
) {
  return request.status === "pending" && getRequestExpiresAt(request) <= now;
}

async function expireRequestIfNeeded(
  ctx: MutationCtx,
  request: Doc<"mentorshipRequests">,
  now = Date.now()
) {
  if (!isRequestExpired(request, now)) {
    return false;
  }

  await ctx.db.patch("mentorshipRequests", request._id, {
    status: "expired",
    expiresAt: getRequestExpiresAt(request),
    updatedAt: now,
  });

  await createNotification(ctx, {
    userId: request.menteeId,
    type: "request_expired",
    title: "Mentorship request expired",
    message:
      "A mentor did not respond before the request deadline. You can continue your search and contact another mentor.",
    href: "/requests",
  });

  return true;
}
/**
 * Builds mentor-facing request view data.
 */
function buildMentorRequestView(
  request: MentorshipRequestWithExpiresAt,
  mentee: Doc<"users"> | null
) {
  const name = mentee?.name?.trim() || "Unknown user";
  return {
    ...request,
    menteeName: name,
    menteeInitials: getInitials(name),
    menteeTitle: mentee?.title?.trim() || "Community member",
    interests: mentee?.interests ?? [],
  };
}

/**
 * Builds mentee-facing request view data.
 */
function buildMenteeRequestView(
  request: MentorshipRequestWithExpiresAt,
  mentor: Doc<"users"> | null,
  connectionActive: boolean
) {
  const mentorView = mentor
    ? toPublicMentorDTO(mentor, { forceRevealIdentity: connectionActive })
    : null;
  const name = mentorView?.name?.trim() || "Unknown user";
  return {
    ...request,
    mentorName: name,
    mentorInitials: getInitials(name),
    mentorTitle: mentorView?.title?.trim() || "Community member",
    mentorUsername: mentorView?.username ?? null,
    mentorEmail: mentorView?.email ?? null,
    mentorPhoneNumber: mentorView?.phoneNumber ?? null,
    expertise: mentorView?.mentorProfile?.expertise ?? [],
    connectionActive,
  };
}

/**
 * Returns mentorship requests for a mentor, newest first.
 */
export async function requestsByMentor(
  ctx: QueryCtx,
  { mentorId }: { mentorId: Id<"users"> }
) {
  const currentUser = requireMentorProfile(
    requireOnboardingComplete(await getAuthenticatedUser(ctx))
  );

  if (currentUser._id !== mentorId) {
    throw new Error("Unauthorized to view this mentor's requests");
  }

  const requests = await ctx.db
    .query("mentorshipRequests")
    .withIndex("by_mentorId", (q) => q.eq("mentorId", mentorId))
    .order("desc")
    .collect();

  const menteeById = await fetchUsersById(ctx, requests.map((r) => r.menteeId));
  const now = Date.now();

  return requests.map((request) => {
    const requestForView: MentorshipRequestWithExpiresAt = {
      ...request,
      status: isRequestExpired(request, now) ? "expired" : request.status,
      expiresAt: getRequestExpiresAt(request),
    };

    return buildMentorRequestView(
      requestForView,
      menteeById.get(request.menteeId) ?? null
    );
  });
}

/**
 * Returns mentorship requests for a mentee, newest first.
 */
export async function requestsByMentee(
  ctx: QueryCtx,
  { menteeId }: { menteeId: Id<"users"> }
) {
  const currentUser = requireMenteeProfile(
    requireOnboardingComplete(await getAuthenticatedUser(ctx))
  );

  if (currentUser._id !== menteeId) {
    throw new Error("Unauthorized to view this mentee's requests");
  }

  const requests = await ctx.db
    .query("mentorshipRequests")
    .withIndex("by_menteeId", (q) => q.eq("menteeId", menteeId))
    .order("desc")
    .collect();

  const mentorById = await fetchUsersById(ctx, requests.map((r) => r.mentorId));
  const activeMentorships = await ctx.db
    .query("mentorships")
    .withIndex("by_menteeId_status", (q) =>
      q.eq("menteeId", menteeId).eq("status", "active")
    )
    .collect();
  const activeMentorIds = new Set(
    activeMentorships.map((mentorship) => mentorship.mentorId)
  );
  const now = Date.now();

  return requests.map((request) => {
    const requestForView: MentorshipRequestWithExpiresAt = {
      ...request,
      status: isRequestExpired(request, now) ? "expired" : request.status,
      expiresAt: getRequestExpiresAt(request),
    };

    return buildMenteeRequestView(
      requestForView,
      mentorById.get(request.mentorId) ?? null,
      activeMentorIds.has(request.mentorId)
    );
  });
}

/**
 * Creates a new mentorship request from the current mentee to a mentor.
 */
export async function createRequest(
  ctx: MutationCtx,
  {
    mentorUsername,
    message,
    proposedDurationMonths,
  }: {
    mentorUsername: Infer<typeof usersTableFields.username>;
    message: Infer<typeof mentorshipRequestsTableFields.message>;
    proposedDurationMonths: number;
  }
) {
  const mentor = await ctx.db
    .query("users")
    .withIndex("by_username", (q) => q.eq("username", mentorUsername))
    .unique();

  if (!mentor) {
    throw new Error("Mentor not found");
  }

  return createRequestForMentor(ctx, {
    mentor,
    message,
    proposedDurationMonths,
  });
}

/**
 * Creates a new mentorship request from the current mentee to a mentor by user ID.
 */
export async function createRequestByMentorId(
  ctx: MutationCtx,
  {
    mentorId,
    message,
    proposedDurationMonths,
  }: {
    mentorId: Id<"users">;
    message: Infer<typeof mentorshipRequestsTableFields.message>;
    proposedDurationMonths: number;
  }
) {
  const mentor = await ctx.db.get("users", mentorId);

  if (!mentor) {
    throw new Error("Mentor not found");
  }

  return createRequestForMentor(ctx, {
    mentor,
    message,
    proposedDurationMonths,
  });
}

async function createRequestForMentor(
  ctx: MutationCtx,
  {
    mentor,
    message,
    proposedDurationMonths,
  }: {
    mentor: Doc<"users">;
    message: Infer<typeof mentorshipRequestsTableFields.message>;
    proposedDurationMonths: number;
  }
) {
  const currentUser = requireMenteeProfile(
    requireOnboardingComplete(await getAuthenticatedUser(ctx))
  );
  const trimmedMessage = message.trim();
  const durationMonths = normalizeDurationMonths(proposedDurationMonths);
  const mentorId = mentor._id;
  const menteeId = currentUser._id;

  if (mentorId === menteeId) {
    throw new Error("You cannot request mentorship from yourself");
  }

  if (
    !mentor.mentorProfile ||
    !mentor.mentorProfile.isAvailable ||
    mentor.mentorProfile.isVisible === false
  ) {
    throw new Error("Selected mentor is not available for mentorship");
  }

  const [mentorActiveMentorships, settings] = await Promise.all([
    ctx.db
      .query("mentorships")
      .withIndex("by_mentorId_status", (q) =>
        q.eq("mentorId", mentorId).eq("status", "active")
      )
      .collect(),
    getEffectiveProgramSettings(ctx),
  ]);

  if (mentorActiveMentorships.length >= mentor.mentorProfile.maxMentees) {
    throw new Error("Selected mentor has reached their active mentee limit");
  }

  if (!trimmedMessage) {
    throw new Error("A request message is required");
  }

  if (trimmedMessage.length > 1000) {
    throw new Error("Request message must be 1000 characters or fewer");
  }

  const pendingRequestsForMentor = await ctx.db
    .query("mentorshipRequests")
    .withIndex("by_mentorId_status", (q) =>
      q.eq("mentorId", mentorId).eq("status", "pending")
    )
    .collect();

  const now = Date.now();

  for (const request of pendingRequestsForMentor) {
    await expireRequestIfNeeded(ctx, request, now);
  }

  const pendingRequestsForMentee = await ctx.db
    .query("mentorshipRequests")
    .withIndex("by_menteeId_status", (q) =>
      q.eq("menteeId", menteeId).eq("status", "pending")
    )
    .collect();

  for (const request of pendingRequestsForMentee) {
    await expireRequestIfNeeded(ctx, request, now);
  }

  const activeMentorshipsForMentee = await ctx.db
    .query("mentorships")
    .withIndex("by_menteeId_status", (q) =>
      q.eq("menteeId", menteeId).eq("status", "active")
    )
    .collect();
  const livePendingCount = pendingRequestsForMentee.filter(
    (request) => !isRequestExpired(request, now)
  ).length;

  if (
    activeMentorshipsForMentee.length + livePendingCount >=
    settings.maxActiveMentorsPerMentee
  ) {
    throw new Error(
      `You can have at most ${settings.maxActiveMentorsPerMentee} active or pending mentors at a time`
    );
  }

  const existingPending = pendingRequestsForMentor.find(
    (r) => r.menteeId === menteeId && !isRequestExpired(r, now)
  );

  if (existingPending) {
    throw new Error("You already have a pending request for this mentor");
  }

  const mentorshipsBetweenPair = await ctx.db
    .query("mentorships")
    .withIndex("by_mentorId_menteeId", (q) =>
      q.eq("mentorId", mentorId).eq("menteeId", menteeId)
    )
    .collect();

  const existingActive = mentorshipsBetweenPair.find(
    (mentorship) => mentorship.status === "active"
  );

  if (existingActive) {
    throw new Error("You are already connected with this mentor");
  }

  const requestId = await ctx.db.insert("mentorshipRequests", {
    mentorId,
    menteeId,
    status: "pending",
    message: trimmedMessage,
    proposedDurationMonths: durationMonths,
    expiresAt: getMentorshipRequestExpiresAt(now, settings.requestExpiryDays),
    createdAt: now,
    updatedAt: now,
  });

  await createNotification(ctx, {
    userId: mentorId,
    type: "request_received",
    title: "New mentorship request",
    message: `${currentUser.name || "A programme member"} sent you a mentorship request.`,
    href: "/mentor/requests",
  });

  return requestId;
}

/**
 * Accepts a pending mentorship request.
 */
export async function acceptRequest(
  ctx: MutationCtx,
  { requestId }: { requestId: Id<"mentorshipRequests"> }
) {
  const currentUser = requireMentorProfile(
    requireOnboardingComplete(await getAuthenticatedUser(ctx))
  );
  const request = await ctx.db.get("mentorshipRequests", requestId);

  if (!request) {
    throw new Error("Request not found");
  }

  if (request.mentorId !== currentUser._id) {
    throw new Error("Unauthorized to accept this request");
  }

  if (request.status !== "pending") {
    throw new Error("Only pending requests can be accepted");
  }

  const now = Date.now();

  if (await expireRequestIfNeeded(ctx, request, now)) {
    throw new Error("This mentorship request has expired");
  }

  const [activeMentorshipsForMentor, activeMentorshipsForMentee, settings] =
    await Promise.all([
      ctx.db
        .query("mentorships")
        .withIndex("by_mentorId_status", (q) =>
          q.eq("mentorId", request.mentorId).eq("status", "active")
        )
        .collect(),
      ctx.db
        .query("mentorships")
        .withIndex("by_menteeId_status", (q) =>
          q.eq("menteeId", request.menteeId).eq("status", "active")
        )
        .collect(),
      getEffectiveProgramSettings(ctx),
    ]);

  if (
    activeMentorshipsForMentor.length >= currentUser.mentorProfile!.maxMentees
  ) {
    throw new Error("You have reached your active mentee limit");
  }

  if (
    activeMentorshipsForMentee.length >=
    settings.maxActiveMentorsPerMentee
  ) {
    throw new Error(
      "This mentee has reached the programme's active mentor limit"
    );
  }

  await ctx.db.patch("mentorshipRequests", requestId, {
    status: "accepted",
    expiresAt: getRequestExpiresAt(request),
    updatedAt: now,
  });

  await createMentorshipFromAcceptedRequest(ctx, { requestId });

  await createNotification(ctx, {
    userId: request.menteeId,
    type: "request_accepted",
    title: "Mentorship request accepted",
    message: `${currentUser.name || "Your mentor"} accepted your request. Your mentorship workspace is ready.`,
    href: "/mentorships",
  });

  return requestId;
}

/**
 * Rejects a pending mentorship request.
 */
export async function rejectRequest(
  ctx: MutationCtx,
  { requestId }: { requestId: Id<"mentorshipRequests"> }
) {
  const currentUser = requireMentorProfile(
    requireOnboardingComplete(await getAuthenticatedUser(ctx))
  );
  const request = await ctx.db.get("mentorshipRequests", requestId);

  if (!request) {
    throw new Error("Request not found");
  }

  if (request.mentorId !== currentUser._id) {
    throw new Error("Unauthorized to reject this request");
  }

  if (request.status !== "pending") {
    throw new Error("Only pending requests can be rejected");
  }

  const now = Date.now();

  if (await expireRequestIfNeeded(ctx, request, now)) {
    throw new Error("This mentorship request has expired");
  }

  await ctx.db.patch("mentorshipRequests", requestId, {
    status: "rejected",
    expiresAt: getRequestExpiresAt(request),
    updatedAt: now,
  });

  await createNotification(ctx, {
    userId: request.menteeId,
    type: "request_rejected",
    title: "Mentorship request update",
    message:
      "A mentor was unable to accept your request. You can continue searching for another match.",
    href: "/requests",
  });

  return requestId;
}

/**
 * Expires pending mentorship requests whose response window has elapsed.
 */
export async function expireStalePendingRequests(ctx: MutationCtx) {
  const now = Date.now();

  const pendingRequests = await ctx.db
    .query("mentorshipRequests")
    .withIndex("by_status_expiresAt", (q) => q.eq("status", "pending"))
    .collect();

  let expiredCount = 0;

  for (const request of pendingRequests) {
    if (await expireRequestIfNeeded(ctx, request, now)) {
      expiredCount += 1;
    }
  }

  return { expiredCount };
}
