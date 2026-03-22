import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
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

async function buildMentorRequestView(
  ctx: QueryCtx | MutationCtx,
  request: Doc<"mentorshipRequests">
) {
  const mentee = await ctx.db.get(request.menteeId);

  return {
    ...request,
    menteeName: mentee?.name?.trim() || "Unknown user",
    menteeInitials: getInitials(mentee?.name?.trim() || "Unknown user"),
    menteeTitle: mentee?.title?.trim() || "Community member",
    interests: mentee?.menteeProfile?.interests ?? [],
  };
}

async function buildMenteeRequestView(
  ctx: QueryCtx | MutationCtx,
  request: Doc<"mentorshipRequests">
) {
  const mentor = await ctx.db.get(request.mentorId);

  return {
    ...request,
    mentorName: mentor?.name?.trim() || "Unknown user",
    mentorInitials: getInitials(mentor?.name?.trim() || "Unknown user"),
    mentorTitle: mentor?.title?.trim() || "Community member",
    expertise: mentor?.mentorProfile?.expertise ?? [],
  };
}

export const requestsByMentor = query({
  args: { mentorId: v.id("users") },
  handler: async (ctx, { mentorId }) => {
    const currentUser = await getAuthenticatedUser(ctx);

    if (currentUser._id !== mentorId) {
      throw new Error("Unauthorized to view this mentor's requests");
    }

    const requests = await ctx.db
      .query("mentorshipRequests")
      .withIndex("by_mentorId", (q) => q.eq("mentorId", mentorId))
      .order("desc")
      .collect();

    return Promise.all(
      requests.map((request) => buildMentorRequestView(ctx, request))
    );
  },
});

export const requestsByMentee = query({
  args: { menteeId: v.id("users") },
  handler: async (ctx, { menteeId }) => {
    const currentUser = await getAuthenticatedUser(ctx);

    if (currentUser._id !== menteeId) {
      throw new Error("Unauthorized to view this mentee's requests");
    }

    const requests = await ctx.db
      .query("mentorshipRequests")
      .withIndex("by_menteeId", (q) => q.eq("menteeId", menteeId))
      .order("desc")
      .collect();

    return Promise.all(
      requests.map((request) => buildMenteeRequestView(ctx, request))
    );
  },
});

export const createRequest = mutation({
  args: {
    mentorId: v.id("users"),
    menteeId: v.id("users"),
    message: v.string(),
  },
  handler: async (ctx, { mentorId, menteeId, message }) => {
    const currentUser = await getAuthenticatedUser(ctx);
    const trimmedMessage = message.trim();

    if (currentUser._id !== menteeId) {
      throw new Error("Unauthorized to create this request");
    }

    if (mentorId === menteeId) {
      throw new Error("You cannot request mentorship from yourself");
    }

    const mentor = await ctx.db.get(mentorId);
    if (!mentor?.mentorProfile || !mentor.mentorProfile.isAvailable) {
      throw new Error("Selected mentor is not available for mentorship");
    }

    if (!trimmedMessage) {
      throw new Error("A request message is required");
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
    const currentUser = await getAuthenticatedUser(ctx);
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
    const currentUser = await getAuthenticatedUser(ctx);
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
