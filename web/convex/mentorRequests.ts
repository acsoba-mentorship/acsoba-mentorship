import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

async function getAuthenticatedUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  const currentUser = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();

  if (!currentUser) {
    throw new Error("User not found");
  }

  return currentUser;
}

function requireMentorProfile(user: Doc<"users">) {
  if (!user.mentorProfile) {
    throw new Error("Only mentors can perform this action");
  }

  return user;
}

function requireMenteeProfile(user: Doc<"users">) {
  if (!user.menteeProfile) {
    throw new Error("Only mentees can perform this action");
  }

  return user;
}

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

async function fetchUsersById(
  ctx: QueryCtx | MutationCtx,
  ids: Id<"users">[]
): Promise<Map<Id<"users">, Doc<"users"> | null>> {
  const unique = [...new Set(ids)];
  const docs = await Promise.all(unique.map((id) => ctx.db.get(id)));
  return new Map(unique.map((id, i) => [id, docs[i] ?? null]));
}

export const requestsByMentor = query({
  args: { mentorId: v.id("users") },
  handler: async (ctx, { mentorId }) => {
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
  },
});

export const requestsByMentee = query({
  args: { menteeId: v.id("users") },
  handler: async (ctx, { menteeId }) => {
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
  },
});

export const createRequest = mutation({
  args: {
    mentorUsername: v.string(),
    message: v.string(),
  },
  handler: async (ctx, { mentorUsername, message }) => {
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

    const existingRequest = await ctx.db
      .query("mentorshipRequests")
      .withIndex("by_mentorId_menteeId", (q) =>
        q.eq("mentorId", mentorId).eq("menteeId", menteeId)
      )
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    if (existingRequest) {
      throw new Error("You already have a pending request for this mentor");
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
  },
});

export const acceptRequest = mutation({
  args: { requestId: v.id("mentorshipRequests") },
  handler: async (ctx, { requestId }) => {
    const currentUser = requireMentorProfile(await getAuthenticatedUser(ctx));
    const request = await ctx.db.get(requestId);

    if (!request) {
      throw new Error("Request not found");
    }

    if (request.mentorId !== currentUser._id) {
      throw new Error("Unauthorized to accept this request");
    }

    if (request.status !== "pending") {
      throw new Error("Only pending requests can be accepted");
    }

    await ctx.db.patch(requestId, {
      status: "accepted",
      updatedAt: Date.now(),
    });

    return requestId;
  },
});

export const rejectRequest = mutation({
  args: { requestId: v.id("mentorshipRequests") },
  handler: async (ctx, { requestId }) => {
    const currentUser = requireMentorProfile(await getAuthenticatedUser(ctx));
    const request = await ctx.db.get(requestId);

    if (!request) {
      throw new Error("Request not found");
    }

    if (request.mentorId !== currentUser._id) {
      throw new Error("Unauthorized to reject this request");
    }

    if (request.status !== "pending") {
      throw new Error("Only pending requests can be rejected");
    }

    await ctx.db.patch(requestId, {
      status: "rejected",
      updatedAt: Date.now(),
    });

    return requestId;
  },
});
