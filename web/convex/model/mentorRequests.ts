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

export const MENTORSHIP_REQUEST_EXPIRY_DAYS = 7;

/**
 * App expiry timezone.
 *
 * Requests expire at 23:59 Singapore time.
 * Singapore does not use daylight saving time, so UTC+8 is safe here.
 */
const APP_TIME_ZONE_OFFSET_MS = 8 * 60 * 60 * 1000;

type MentorshipRequestWithExpiresAt = Doc<"mentorshipRequests"> & {
  expiresAt: number;
};

/**
 * Returns the expiry timestamp for a request.
 *
 * The request date counts as day 1.
 *
 * Example:
 * - Request created on Saturday, any time
 * - Expiry is Friday 23:59:59.999 Singapore time
 */
function getMentorshipRequestExpiresAt(createdAt: number) {
  const appLocalDate = new Date(createdAt + APP_TIME_ZONE_OFFSET_MS);

  const expiryAsUtcDate = Date.UTC(
    appLocalDate.getUTCFullYear(),
    appLocalDate.getUTCMonth(),
    appLocalDate.getUTCDate() + MENTORSHIP_REQUEST_EXPIRY_DAYS - 1,
    23,
    59,
    59,
    999
  );

  return expiryAsUtcDate - APP_TIME_ZONE_OFFSET_MS;
}

function getRequestExpiresAt(
  request: Pick<Doc<"mentorshipRequests">, "createdAt" | "expiresAt">
) {
  return request.expiresAt ?? getMentorshipRequestExpiresAt(request.createdAt);
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
  mentor: Doc<"users"> | null
) {
  const mentorView = mentor
    ? toPublicMentorDTO(mentor, { forceRevealIdentity: request.status === "accepted" })
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
  const now = Date.now();

  return requests.map((request) => {
    const requestForView: MentorshipRequestWithExpiresAt = {
      ...request,
      status: isRequestExpired(request, now) ? "expired" : request.status,
      expiresAt: getRequestExpiresAt(request),
    };

    return buildMenteeRequestView(
      requestForView,
      mentorById.get(request.mentorId) ?? null
    );
  });
}

/**
 * Creates a new mentorship request from the current mentee to a mentor.
 */
export async function createRequest(
  ctx: MutationCtx,
  { mentorUsername, message }: { 
    mentorUsername: Infer<typeof usersTableFields.username>;
    message: Infer<typeof mentorshipRequestsTableFields.message>;
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
  }: {
    mentorId: Id<"users">;
    message: Infer<typeof mentorshipRequestsTableFields.message>;
  }
) {
  const mentor = await ctx.db.get("users", mentorId);

  if (!mentor) {
    throw new Error("Mentor not found");
  }

  return createRequestForMentor(ctx, {
    mentor,
    message,
  });
}

async function createRequestForMentor(
  ctx: MutationCtx,
  {
    mentor,
    message,
  }: {
    mentor: Doc<"users">;
    message: Infer<typeof mentorshipRequestsTableFields.message>;
  }
) {
  const currentUser = requireMenteeProfile(
    requireOnboardingComplete(await getAuthenticatedUser(ctx))
  );
  const trimmedMessage = message.trim();
  const mentorId = mentor._id;
  const menteeId = currentUser._id;

  if (mentorId === menteeId) {
    throw new Error("You cannot request mentorship from yourself");
  }

  if (!mentor.mentorProfile || !mentor.mentorProfile.isAvailable) {
    throw new Error("Selected mentor is not available for mentorship");
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

  const existingPending = pendingRequestsForMentor.find(
    (r) => r.menteeId === menteeId && !isRequestExpired(r, now)
  );

  if (existingPending) {
    throw new Error("You already have a pending request for this mentor");
  }

  const acceptedRequestsForMentor = await ctx.db
    .query("mentorshipRequests")
    .withIndex("by_mentorId_status", (q) =>
      q.eq("mentorId", mentorId).eq("status", "accepted")
    )
    .collect();

  const existingAccepted = acceptedRequestsForMentor.find(
    (r) => r.menteeId === menteeId
  );

  if (existingAccepted) {
    throw new Error("You are already connected with this mentor");
  }

  return ctx.db.insert("mentorshipRequests", {
    mentorId,
    menteeId,
    status: "pending",
    message: trimmedMessage,
    expiresAt: getMentorshipRequestExpiresAt(now),
    createdAt: now,
    updatedAt: now,
  });
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

  await ctx.db.patch("mentorshipRequests", requestId, {
    status: "accepted",
    expiresAt: getRequestExpiresAt(request),
    updatedAt: now,
  });

  await createMentorshipFromAcceptedRequest(ctx, { requestId });

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