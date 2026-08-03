import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { ConvexError } from "convex/values";
import { getAuthenticatedUser, requireAdmin, requireOnboardingComplete } from "./auth";
import { fetchUsersById } from "./helper";
import { writeAdminAuditLog } from "./admin/audit";
import { createNotification } from "./notifications";

const NAME_MAX = 120;
const DESCRIPTION_MAX = 500;

function normalizeName(name: string) {
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    throw new ConvexError("Activity name must be at least 2 characters");
  }
  if (trimmed.length > NAME_MAX) {
    throw new ConvexError(`Activity name must be ${NAME_MAX} characters or fewer`);
  }
  return trimmed;
}

function normalizeDescription(description?: string) {
  const trimmed = description?.trim();
  if (trimmed && trimmed.length > DESCRIPTION_MAX) {
    throw new ConvexError(
      `Activity description must be ${DESCRIPTION_MAX} characters or fewer`
    );
  }
  return trimmed || undefined;
}

/**
 * FR18: the checkable list of volunteering activities shown on a member's
 * dashboard, alongside whether the current user has already checked it.
 */
export async function listActivitiesForMember(ctx: QueryCtx) {
  const user = requireOnboardingComplete(await getAuthenticatedUser(ctx));

  const activities = await ctx.db
    .query("volunteerActivities")
    .withIndex("by_isActive", (q) => q.eq("isActive", true))
    .collect();

  const mySignups = await ctx.db
    .query("volunteerSignups")
    .withIndex("by_userId", (q) => q.eq("userId", user._id))
    .collect();
  const signedUpActivityIds = new Set(
    mySignups.map((signup) => signup.activityId)
  );

  return activities
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((activity) => ({
      _id: activity._id,
      name: activity.name,
      description: activity.description ?? null,
      isSignedUp: signedUpActivityIds.has(activity._id),
    }));
}

/**
 * FR18: "check or uncheck the box to indicate that they would like to
 * volunteer for an activity or activities". Toggles a single checkbox.
 */
export async function toggleSignup(
  ctx: MutationCtx,
  { activityId }: { activityId: Id<"volunteerActivities"> }
) {
  const user = requireOnboardingComplete(await getAuthenticatedUser(ctx));
  const activity = await ctx.db.get("volunteerActivities", activityId);
  if (!activity || !activity.isActive) {
    throw new ConvexError("Volunteering activity not found");
  }

  const existing = await ctx.db
    .query("volunteerSignups")
    .withIndex("by_activityId_userId", (q) =>
      q.eq("activityId", activityId).eq("userId", user._id)
    )
    .unique();

  if (existing) {
    await ctx.db.delete("volunteerSignups", existing._id);
    return { isSignedUp: false };
  }

  await ctx.db.insert("volunteerSignups", {
    activityId,
    userId: user._id,
    createdAt: Date.now(),
  });
  return { isSignedUp: true };
}

/**
 * FR: "After users click the checkbox for volunteering, there should be
 * [a] save button to lock it in." Reconciles the full desired set of
 * signed-up activity ids in one mutation, rather than toggling on every
 * checkbox click.
 */
export async function setSignups(
  ctx: MutationCtx,
  { activityIds }: { activityIds: Id<"volunteerActivities">[] }
) {
  const user = requireOnboardingComplete(await getAuthenticatedUser(ctx));

  const activeActivities = await ctx.db
    .query("volunteerActivities")
    .withIndex("by_isActive", (q) => q.eq("isActive", true))
    .collect();
  const activeActivityIds = new Set(
    activeActivities.map((activity) => activity._id)
  );

  const desiredIds = new Set(
    activityIds.filter((id) => activeActivityIds.has(id))
  );

  const existingSignups = await ctx.db
    .query("volunteerSignups")
    .withIndex("by_userId", (q) => q.eq("userId", user._id))
    .collect();
  const existingByActivityId = new Map(
    existingSignups.map((signup) => [signup.activityId, signup])
  );

  const now = Date.now();
  await Promise.all([
    ...Array.from(desiredIds)
      .filter((activityId) => !existingByActivityId.has(activityId))
      .map((activityId) =>
        ctx.db.insert("volunteerSignups", {
          activityId,
          userId: user._id,
          createdAt: now,
        })
      ),
    ...existingSignups
      .filter((signup) => !desiredIds.has(signup.activityId))
      .map((signup) => ctx.db.delete("volunteerSignups", signup._id)),
  ]);

  return { signedUpActivityIds: Array.from(desiredIds) };
}

export async function listActivitiesForAdmin(ctx: QueryCtx) {
  await requireAdmin(ctx);
  const activities = await ctx.db.query("volunteerActivities").collect();

  const counts = await Promise.all(
    activities.map((activity) =>
      ctx.db
        .query("volunteerSignups")
        .withIndex("by_activityId", (q) => q.eq("activityId", activity._id))
        .collect()
    )
  );

  return activities
    .map((activity, index) => ({
      ...activity,
      signupCount: counts[index].length,
    }))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function createActivity(
  ctx: MutationCtx,
  { name, description }: { name: string; description?: string }
) {
  const { user: admin } = await requireAdmin(ctx);
  const now = Date.now();

  const activityId = await ctx.db.insert("volunteerActivities", {
    name: normalizeName(name),
    description: normalizeDescription(description),
    isActive: true,
    createdBy: admin._id,
    createdAt: now,
    updatedAt: now,
  });

  await writeAdminAuditLog(ctx, {
    actorId: admin._id,
    action: "volunteer_activity.created",
    targetType: "volunteer_activity",
    targetId: String(activityId),
    metadata: { name },
  });

  return activityId;
}

export async function updateActivity(
  ctx: MutationCtx,
  {
    activityId,
    name,
    description,
    isActive,
  }: {
    activityId: Id<"volunteerActivities">;
    name?: string;
    description?: string;
    isActive?: boolean;
  }
) {
  const { user: admin } = await requireAdmin(ctx);
  const activity = await ctx.db.get("volunteerActivities", activityId);
  if (!activity) {
    throw new ConvexError("Volunteering activity not found");
  }

  const isBeingTakenDown = isActive === false && activity.isActive === true;

  const patch: {
    name?: string;
    description?: string;
    isActive?: boolean;
    updatedAt: number;
  } = { updatedAt: Date.now() };
  if (name !== undefined) {
    patch.name = normalizeName(name);
  }
  if (description !== undefined) {
    patch.description = normalizeDescription(description);
  }
  if (isActive !== undefined) {
    patch.isActive = isActive;
  }

  await ctx.db.patch("volunteerActivities", activityId, patch);

  await writeAdminAuditLog(ctx, {
    actorId: admin._id,
    action: "volunteer_activity.updated",
    targetType: "volunteer_activity",
    targetId: String(activityId),
    metadata: { name, isActive },
  });

  if (isBeingTakenDown) {
    const signups = await ctx.db
      .query("volunteerSignups")
      .withIndex("by_activityId", (q) => q.eq("activityId", activityId))
      .collect();

    await Promise.all(
      signups.map((signup) =>
        createNotification(ctx, {
          userId: signup.userId,
          type: "volunteer_activity_taken_down",
          title: "Volunteering activity taken down",
          message: `An administrator has taken down the "${activity.name}" volunteering activity. You no longer need to worry about it.`,
        })
      )
    );
  }

  return activityId;
}

/**
 * Admins can permanently delete a retired (taken down) activity, e.g. once
 * it is no longer relevant and doesn't need to stay in the list. Active
 * activities must be retired first so members aren't surprised by an
 * activity disappearing without the "taken down" notification.
 */
export async function deleteActivity(
  ctx: MutationCtx,
  { activityId }: { activityId: Id<"volunteerActivities"> }
) {
  const { user: admin } = await requireAdmin(ctx);
  const activity = await ctx.db.get("volunteerActivities", activityId);
  if (!activity) {
    throw new ConvexError("Volunteering activity not found");
  }
  if (activity.isActive) {
    throw new ConvexError(
      "Retire the activity before deleting it so members are notified."
    );
  }

  const signups = await ctx.db
    .query("volunteerSignups")
    .withIndex("by_activityId", (q) => q.eq("activityId", activityId))
    .collect();
  await Promise.all(
    signups.map((signup) => ctx.db.delete("volunteerSignups", signup._id))
  );

  await ctx.db.delete("volunteerActivities", activityId);

  await writeAdminAuditLog(ctx, {
    actorId: admin._id,
    action: "volunteer_activity.deleted",
    targetType: "volunteer_activity",
    targetId: String(activityId),
    metadata: { name: activity.name },
  });

  return { deleted: true };
}

export async function listSignupsForActivity(
  ctx: QueryCtx,
  { activityId }: { activityId: Id<"volunteerActivities"> }
) {
  await requireAdmin(ctx);
  const activity = await ctx.db.get("volunteerActivities", activityId);
  if (!activity) {
    throw new ConvexError("Volunteering activity not found");
  }

  const signups = await ctx.db
    .query("volunteerSignups")
    .withIndex("by_activityId", (q) => q.eq("activityId", activityId))
    .order("desc")
    .collect();

  const userById = await fetchUsersById(
    ctx,
    signups.map((signup) => signup.userId)
  );

  return signups.map((signup) => {
    const user = userById.get(signup.userId);
    return {
      _id: signup._id,
      userName: user?.name ?? "Unknown member",
      userEmail: user?.email ?? null,
      createdAt: signup.createdAt,
    };
  });
}