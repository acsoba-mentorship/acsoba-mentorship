import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { getInitials, toPublicMentorDTO } from "../helper";
import {
  getAuthenticatedUser,
  requireAdmin,
  requireMenteeProfile,
  requireMentorProfile,
  requireOnboardingComplete,
} from "./auth";
import { fetchUsersById } from "./helper";

const DEFAULT_MENTORSHIP_DURATION_MONTHS = 3;

function addUtcMonths(timestamp: number, months: number) {
  const result = new Date(timestamp);
  const originalDay = result.getUTCDate();

  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDayOfTargetMonth = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)
  ).getUTCDate();
  result.setUTCDate(Math.min(originalDay, lastDayOfTargetMonth));

  return result.getTime();
}

function getAgreedDurationMonths(value: number | undefined) {
  return value &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 24
    ? value
    : DEFAULT_MENTORSHIP_DURATION_MONTHS;
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
    industries:
      mentee?.menteeProfile?.industries ?? mentee?.industries ?? [],
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
    industries:
      mentorView?.mentorProfile?.industries ?? mentorView?.industries ?? [],
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
    throw new ConvexError("Request not found");
  }

  if (request.status !== "accepted") {
    throw new ConvexError("Only accepted requests can create mentorships");
  }

  const now = Date.now();
  const agreedDurationMonths = getAgreedDurationMonths(
    request.proposedDurationMonths
  );

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
    throw new ConvexError(
      "An active mentorship already exists between this mentor and mentee"
    );
  }

  return ctx.db.insert("mentorships", {
    mentorId: request.mentorId,
    menteeId: request.menteeId,
    requestId,
    startDate: now,
    plannedEndDate: addUtcMonths(now, agreedDurationMonths),
    agreedDurationMonths,
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
    throw new ConvexError("Unauthorized to view this mentor's mentorships");
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
    throw new ConvexError("Unauthorized to view this mentee's mentorships");
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

/**
 * Returns non-active (completed/cancelled) mentorships for the current
 * mentor, most recent first. This powers the "History" tab.
 */
export async function historyByMentor(
  ctx: QueryCtx,
  { mentorId }: { mentorId: Id<"users"> }
) {
  const currentUser = requireMentorProfile(
    requireOnboardingComplete(await getAuthenticatedUser(ctx))
  );

  if (currentUser._id !== mentorId) {
    throw new ConvexError("Unauthorized to view this mentor's mentorships");
  }

  const mentorships = await ctx.db
    .query("mentorships")
    .withIndex("by_mentorId", (q) => q.eq("mentorId", mentorId))
    .order("desc")
    .collect();

  const history = mentorships.filter(
    (mentorship) => mentorship.status !== "active"
  );

  const menteeById = await fetchUsersById(
    ctx,
    history.map((mentorship) => mentorship.menteeId)
  );

  return history.map((mentorship) =>
    buildMentorMentorshipView(
      mentorship,
      menteeById.get(mentorship.menteeId) ?? null
    )
  );
}

/**
 * Returns non-active (completed/cancelled) mentorships for the current
 * mentee, most recent first. This powers the "History" tab.
 */
export async function historyByMentee(
  ctx: QueryCtx,
  { menteeId }: { menteeId: Id<"users"> }
) {
  const currentUser = requireMenteeProfile(
    requireOnboardingComplete(await getAuthenticatedUser(ctx))
  );

  if (currentUser._id !== menteeId) {
    throw new ConvexError("Unauthorized to view this mentee's mentorships");
  }

  const mentorships = await ctx.db
    .query("mentorships")
    .withIndex("by_menteeId", (q) => q.eq("menteeId", menteeId))
    .order("desc")
    .collect();

  const history = mentorships.filter(
    (mentorship) => mentorship.status !== "active"
  );

  const mentorById = await fetchUsersById(
    ctx,
    history.map((mentorship) => mentorship.mentorId)
  );

  return history.map((mentorship) =>
    buildMenteeMentorshipView(
      mentorship,
      mentorById.get(mentorship.mentorId) ?? null
    )
  );
}

/**
 * Admin view of every active mentorship, used by the "end a mentorship
 * immediately" workflow.
 */
export async function listActiveForAdmin(
  ctx: QueryCtx,
  { search }: { search?: string } = {}
) {
  await requireAdmin(ctx);

  const mentorships = await ctx.db
    .query("mentorships")
    .withIndex("by_status", (q) => q.eq("status", "active"))
    .order("desc")
    .collect();

  const userIds = mentorships.flatMap((mentorship) => [
    mentorship.mentorId,
    mentorship.menteeId,
  ]);
  const userById = await fetchUsersById(ctx, userIds);
  const normalizedSearch = (search ?? "").trim().toLowerCase();

  return mentorships
    .map((mentorship) => ({
      _id: mentorship._id,
      startDate: mentorship.startDate,
      plannedEndDate: mentorship.plannedEndDate ?? null,
      mentorName: userById.get(mentorship.mentorId)?.name ?? "Unknown user",
      menteeName: userById.get(mentorship.menteeId)?.name ?? "Unknown user",
    }))
    .filter((mentorship) => {
      if (!normalizedSearch) return true;
      const haystack = `${mentorship.mentorName} ${mentorship.menteeName}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    });
}
