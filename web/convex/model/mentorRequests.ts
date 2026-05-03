import { Infer } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { getInitials } from "../helper";
import { getAuthenticatedUser, requireMenteeProfile, requireMentorProfile } from "./auth";
import { usersTableFields } from "./users/fields";
import { mentorshipRequestsTableFields } from "./mentorRequests/fields";

/**
 * Builds mentor-facing request view data.
 */
function buildMentorRequestView(
  request: Doc<"mentorshipRequests">,
  mentee: Doc<"users"> | null
) {
  const name = mentee?.name?.trim() || "Unknown user";
  return {
    ...request,
    menteeName: name,
    menteeInitials: getInitials(name),
    menteeTitle: mentee?.title?.trim() || "Community member",
    interests: mentee?.menteeProfile?.interests ?? [],
  };
}

/**
 * Builds mentee-facing request view data.
 */
function buildMenteeRequestView(
  request: Doc<"mentorshipRequests">,
  mentor: Doc<"users"> | null
) {
  const name = mentor?.name?.trim() || "Unknown user";
  return {
    ...request,
    mentorName: name,
    mentorInitials: getInitials(name),
    mentorTitle: mentor?.title?.trim() || "Community member",
    mentorUsername: mentor?.username ?? null,
    expertise: mentor?.mentorProfile?.expertise ?? [],
  };
}

/**
 * Loads a set of users by ID.
 */
async function fetchUsersById(
  ctx: QueryCtx | MutationCtx,
  ids: Id<"users">[]
): Promise<Map<Id<"users">, Doc<"users"> | null>> {
  const unique = [...new Set(ids)];
  const docs = await Promise.all(unique.map((id) => ctx.db.get("users", id)));
  return new Map(unique.map((id, i) => [id, docs[i] ?? null]));
}

/**
 * Returns mentorship requests for a mentor, newest first.
 */
export async function requestsByMentor(
  ctx: QueryCtx,
  { mentorId }: { mentorId: Id<"users"> }
) {
  const currentUser = requireMentorProfile(await getAuthenticatedUser(ctx));

  if (currentUser._id !== mentorId) {
    throw new Error("Unauthorized to view this mentor's requests");
  }

  const requests = await ctx.db
    .query("mentorshipRequests")
    .withIndex("by_mentorId", (q) => q.eq("mentorId", mentorId))
    .order("desc")
    .collect();

  const menteeById = await fetchUsersById(ctx, requests.map((r) => r.menteeId));
  return requests.map((request) =>
    buildMentorRequestView(request, menteeById.get(request.menteeId) ?? null)
  );
}

/**
 * Returns mentorship requests for a mentee, newest first.
 */
export async function requestsByMentee(
  ctx: QueryCtx,
  { menteeId }: { menteeId: Id<"users"> }
) {
  const currentUser = requireMenteeProfile(await getAuthenticatedUser(ctx));

  if (currentUser._id !== menteeId) {
    throw new Error("Unauthorized to view this mentee's requests");
  }

  const requests = await ctx.db
    .query("mentorshipRequests")
    .withIndex("by_menteeId", (q) => q.eq("menteeId", menteeId))
    .order("desc")
    .collect();

  const mentorById = await fetchUsersById(ctx, requests.map((r) => r.mentorId));
  return requests.map((request) =>
    buildMenteeRequestView(request, mentorById.get(request.mentorId) ?? null)
  );
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
  const currentUser = requireMenteeProfile(await getAuthenticatedUser(ctx));
  const trimmedMessage = message.trim();

  const mentor = await ctx.db
    .query("users")
    .withIndex("by_username", (q) => q.eq("username", mentorUsername))
    .unique();

  if (!mentor) {
    throw new Error("Mentor not found");
  }

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
  const existingPending = pendingRequestsForMentor.find((r) => r.menteeId === menteeId);
  if (existingPending) {
    throw new Error("You already have a pending request for this mentor");
  }

  const acceptedRequestsForMentor = await ctx.db
    .query("mentorshipRequests")
    .withIndex("by_mentorId_status", (q) =>
      q.eq("mentorId", mentorId).eq("status", "accepted")
    )
    .collect();
  const existingAccepted = acceptedRequestsForMentor.find((r) => r.menteeId === menteeId);
  if (existingAccepted) {
    throw new Error("You are already connected with this mentor");
  }

  const now = Date.now();
  return ctx.db.insert("mentorshipRequests", {
    mentorId,
    menteeId,
    status: "pending",
    message: trimmedMessage,
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
  const currentUser = requireMentorProfile(await getAuthenticatedUser(ctx));
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

  await ctx.db.patch("mentorshipRequests", requestId, {
    status: "accepted",
    updatedAt: Date.now(),
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
  const currentUser = requireMentorProfile(await getAuthenticatedUser(ctx));
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

  await ctx.db.patch("mentorshipRequests", requestId, {
    status: "rejected",
    updatedAt: Date.now(),
  });
  return requestId;
}
