import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { getInitials, toPublicMentorDTO } from "../helper";
import {
  getAuthenticatedUser,
  requireMenteeProfile,
  requireMentorProfile,
  requireOnboardingComplete,
} from "./auth";

/**
 * Loads a set of users by ID.
 *
 * We use this because mentorship documents only store mentorId and menteeId.
 * The UI needs display data too, such as name, title, interests, etc.
 */
async function fetchUsersById(
  ctx: QueryCtx | MutationCtx,
  ids: Id<"users">[]
): Promise<Map<Id<"users">, Doc<"users"> | null>> {
  const unique = [...new Set(ids)];
  const docs = await Promise.all(unique.map((id) => ctx.db.get("users", id)));

  return new Map(unique.map((id, index) => [id, docs[index] ?? null]));
}

/**
 * Builds the mentorship data shown to a mentor.
 *
 * A mentor looking at active mentorships mainly needs to see mentee details.
 */
function buildMentorMentorshipView(
  mentorship: Doc<"mentorships">,
  mentee: Doc<"users"> | null
) {
  const name = mentee?.name?.trim() || "Unknown user";

  return {
    ...mentorship,
    menteeName: name,
    menteeInitials: getInitials(name),
    menteeTitle: mentee?.title?.trim() || "Community member",
    menteeUsername: mentee?.username ?? null,
    menteeEmail: mentee?.email ?? null,
    menteePhoneNumber: mentee?.phoneNumber ?? null,
    menteeProfilePictureUrl: mentee?.profilePictureUrl ?? null,
    interests: mentee?.interests ?? [],
    industries: mentee?.industries ?? [],
    menteeProfile: mentee?.menteeProfile ?? null,
  };
}

/**
 * Builds the mentorship data shown to a mentee.
 *
 * A mentee looking at active mentorships mainly needs to see mentor details.
 * Since the mentorship is active, we force reveal mentor identity/contact details.
 */
function buildMenteeMentorshipView(
  mentorship: Doc<"mentorships">,
  mentor: Doc<"users"> | null
) {
  const mentorView = mentor
    ? toPublicMentorDTO(mentor, { forceRevealIdentity: true })
    : null;

  const name = mentorView?.name?.trim() || "Unknown user";

  return {
    ...mentorship,
    mentorName: name,
    mentorInitials: getInitials(name),
    mentorTitle: mentorView?.title?.trim() || "Community member",
    mentorUsername: mentorView?.username ?? null,
    mentorEmail: mentorView?.email ?? null,
    mentorPhoneNumber: mentorView?.phoneNumber ?? null,
    mentorProfilePictureUrl: mentorView?.profilePictureUrl ?? null,
    expertise: mentorView?.mentorProfile?.expertise ?? [],
    industries: mentorView?.industries ?? [],
    mentorProfile: mentorView?.mentorProfile ?? null,
  };
}

/**
 * Creates an active mentorship from an accepted mentorship request.
 *
 * Important:
 * This function is intentionally idempotent.
 *
 * That means if it gets called twice for the same request, it should not create
 * duplicate mentorships.
 */
export async function createMentorshipFromAcceptedRequest(
  ctx: MutationCtx,
  { requestId }: { requestId: Id<"mentorshipRequests"> }
): Promise<Id<"mentorships">> {
  const request = await ctx.db.get("mentorshipRequests", requestId);

  if (!request) {
    throw new Error("Request not found");
  }

  if (request.status !== "accepted") {
    throw new Error("Only accepted requests can create mentorships");
  }

  const now = Date.now();

  /**
   * First check whether this exact request already created a mentorship.
   *
   * This requires your schema to have:
   * .index("by_requestId", ["requestId"])
   */
  const existingForRequest = await ctx.db
    .query("mentorships")
    .withIndex("by_requestId", (q) => q.eq("requestId", requestId))
    .unique();

  if (existingForRequest) {
    return existingForRequest._id;
  }

  /**
   * Also check whether this mentor/mentee pair already has an active mentorship.
   *
   * This protects against duplicates even if older data does not have requestId.
   */
  const mentorshipsBetweenPair = await ctx.db
    .query("mentorships")
    .withIndex("by_mentorId_menteeId", (q) =>
      q.eq("mentorId", request.mentorId).eq("menteeId", request.menteeId)
    )
    .collect();

  const existingActiveMentorship = mentorshipsBetweenPair.find(
    (mentorship) => mentorship.status === "active"
  );

  if (existingActiveMentorship) {
    /**
     * If the existing active mentorship was created before requestId existed,
     * attach this requestId to it.
     */
    if (!existingActiveMentorship.requestId) {
      await ctx.db.patch(existingActiveMentorship._id, {
        requestId,
        updatedAt: now,
      });
    }

    return existingActiveMentorship._id;
  }

  return ctx.db.insert("mentorships", {
    mentorId: request.mentorId,
    menteeId: request.menteeId,
    requestId,
    startDate: now,
    status: "active",
    createdAt: now,
    updatedAt: now,
  });
}

/**
 * Returns active mentorships for the current mentor.
 */
export async function activeByMentor(
  ctx: QueryCtx,
  { mentorId }: { mentorId: Id<"users"> }
) {
  const currentUser = requireMentorProfile(
    requireOnboardingComplete(await getAuthenticatedUser(ctx))
  );

  if (currentUser._id !== mentorId) {
    throw new Error("Unauthorized to view this mentor's mentorships");
  }

  const mentorships = await ctx.db
    .query("mentorships")
    .withIndex("by_mentorId_status", (q) =>
      q.eq("mentorId", mentorId).eq("status", "active")
    )
    .order("desc")
    .collect();

  const menteeById = await fetchUsersById(
    ctx,
    mentorships.map((mentorship) => mentorship.menteeId)
  );

  return mentorships.map((mentorship) =>
    buildMentorMentorshipView(
      mentorship,
      menteeById.get(mentorship.menteeId) ?? null
    )
  );
}

/**
 * Returns active mentorships for the current mentee.
 */
export async function activeByMentee(
  ctx: QueryCtx,
  { menteeId }: { menteeId: Id<"users"> }
) {
  const currentUser = requireMenteeProfile(
    requireOnboardingComplete(await getAuthenticatedUser(ctx))
  );

  if (currentUser._id !== menteeId) {
    throw new Error("Unauthorized to view this mentee's mentorships");
  }

  const mentorships = await ctx.db
    .query("mentorships")
    .withIndex("by_menteeId_status", (q) =>
      q.eq("menteeId", menteeId).eq("status", "active")
    )
    .order("desc")
    .collect();

  const mentorById = await fetchUsersById(
    ctx,
    mentorships.map((mentorship) => mentorship.mentorId)
  );

  return mentorships.map((mentorship) =>
    buildMenteeMentorshipView(
      mentorship,
      mentorById.get(mentorship.mentorId) ?? null
    )
  );
}