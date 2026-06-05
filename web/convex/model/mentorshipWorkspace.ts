import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import {
  getAuthenticatedUser,
  requireOnboardingComplete,
} from "./auth";

type Ctx = QueryCtx | MutationCtx;

function assertNonEmptyTitle(title: string) {
  const trimmed = title.trim();

  if (!trimmed) {
    throw new Error("Title is required");
  }

  if (trimmed.length > 120) {
    throw new Error("Title must be 120 characters or fewer");
  }

  return trimmed;
}

function normalizeOptionalText(value?: string) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  return trimmed;
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
    throw new Error("Only active mentorships can be managed");
  }

  if (mentorship.mentorId === currentUser._id) {
    return { currentUser, mentorship, role: "mentor" };
  }

  if (mentorship.menteeId === currentUser._id) {
    return { currentUser, mentorship, role: "mentee" };
  }

  throw new Error("Unauthorized to access this mentorship");
}

async function getGoalAndAuthorize(
  ctx: Ctx,
  goalId: Id<"mentorshipGoals">
) {
  const goal = await ctx.db.get("mentorshipGoals", goalId);

  if (!goal) {
    throw new Error("Goal not found");
  }

  const auth = await getAuthorizedMentorship(ctx, goal.mentorshipId);

  return { goal, ...auth };
}

async function getTodoAndAuthorize(
  ctx: Ctx,
  todoId: Id<"mentorshipTodos">
) {
  const todo = await ctx.db.get("mentorshipTodos", todoId);

  if (!todo) {
    throw new Error("Todo not found");
  }

  const auth = await getAuthorizedMentorship(ctx, todo.mentorshipId);

  return { todo, ...auth };
}

export async function getWorkspace(
  ctx: QueryCtx,
  { mentorshipId }: { mentorshipId: Id<"mentorships"> }
) {
  const { currentUser, mentorship, role } = await getAuthorizedMentorship(
    ctx,
    mentorshipId
  );

  const [mentor, mentee, goals, todos] = await Promise.all([
    ctx.db.get("users", mentorship.mentorId),
    ctx.db.get("users", mentorship.menteeId),
    ctx.db
      .query("mentorshipGoals")
      .withIndex("by_mentorshipId", (q) =>
        q.eq("mentorshipId", mentorshipId)
      )
      .order("desc")
      .collect(),
    ctx.db
      .query("mentorshipTodos")
      .withIndex("by_mentorshipId", (q) =>
        q.eq("mentorshipId", mentorshipId)
      )
      .order("desc")
      .collect(),
  ]);

  return {
    currentUserId: currentUser._id,
    role,
    mentorship,
    mentor: mentor
      ? {
          _id: mentor._id,
          name: mentor.name,
          username: mentor.username,
          title: mentor.title,
          email: mentor.email,
        }
      : null,
    mentee: mentee
      ? {
          _id: mentee._id,
          name: mentee.name,
          username: mentee.username,
          title: mentee.title,
          email: mentee.email,
        }
      : null,
    goals,
    todos,
  };
}

export async function createGoal(
  ctx: MutationCtx,
  {
    mentorshipId,
    title,
    description,
  }: {
    mentorshipId: Id<"mentorships">;
    title: string;
    description?: string;
  }
) {
  const { currentUser } = await getAuthorizedMentorship(ctx, mentorshipId);

  const now = Date.now();

  return ctx.db.insert("mentorshipGoals", {
    mentorshipId,
    title: assertNonEmptyTitle(title),
    description: normalizeOptionalText(description),
    status: "active",
    createdBy: currentUser._id,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateGoal(
  ctx: MutationCtx,
  {
    goalId,
    title,
    description,
  }: {
    goalId: Id<"mentorshipGoals">;
    title?: string;
    description?: string;
  }
) {
  const { goal } = await getGoalAndAuthorize(ctx, goalId);

  const patch: Partial<Doc<"mentorshipGoals">> = {
    updatedAt: Date.now(),
  };

  if (title !== undefined) {
    patch.title = assertNonEmptyTitle(title);
  }

  if (description !== undefined) {
    patch.description = normalizeOptionalText(description);
  }

  await ctx.db.patch("mentorshipGoals", goal._id, patch);

  return goal._id;
}

export async function toggleGoalComplete(
  ctx: MutationCtx,
  {
    goalId,
    completed,
  }: {
    goalId: Id<"mentorshipGoals">;
    completed: boolean;
  }
) {
  const { goal } = await getGoalAndAuthorize(ctx, goalId);

  const now = Date.now();

  await ctx.db.patch("mentorshipGoals", goal._id, {
    status: completed ? "completed" : "active",
    completedAt: completed ? now : undefined,
    updatedAt: now,
  });

  return goal._id;
}

export async function deleteGoal(
  ctx: MutationCtx,
  { goalId }: { goalId: Id<"mentorshipGoals"> }
) {
  const { goal } = await getGoalAndAuthorize(ctx, goalId);

  const todosForGoal = await ctx.db
    .query("mentorshipTodos")
    .withIndex("by_goalId", (q) => q.eq("goalId", goalId))
    .collect();

  await Promise.all(
    todosForGoal.map((todo) => ctx.db.delete("mentorshipTodos", todo._id))
  );

  await ctx.db.delete("mentorshipGoals", goal._id);

  return goal._id;
}

export async function createTodo(
  ctx: MutationCtx,
  {
    mentorshipId,
    goalId,
    title,
    description,
    assignedTo,
    dueDate,
  }: {
    mentorshipId: Id<"mentorships">;
    goalId?: Id<"mentorshipGoals">;
    title: string;
    description?: string;
    assignedTo?: Id<"users">;
    dueDate?: number;
  }
) {
  const { currentUser, mentorship } = await getAuthorizedMentorship(
    ctx,
    mentorshipId
  );

  if (goalId) {
    const goal = await ctx.db.get("mentorshipGoals", goalId);

    if (!goal || goal.mentorshipId !== mentorshipId) {
      throw new Error("Goal does not belong to this mentorship");
    }
  }

  if (
    assignedTo &&
    assignedTo !== mentorship.mentorId &&
    assignedTo !== mentorship.menteeId
  ) {
    throw new Error("Todo can only be assigned to the mentor or mentee");
  }

  const now = Date.now();

  return ctx.db.insert("mentorshipTodos", {
    mentorshipId,
    goalId,
    title: assertNonEmptyTitle(title),
    description: normalizeOptionalText(description),
    assignedTo,
    createdBy: currentUser._id,
    completed: false,
    dueDate,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateTodo(
  ctx: MutationCtx,
  {
    todoId,
    title,
    description,
    assignedTo,
    dueDate,
  }: {
    todoId: Id<"mentorshipTodos">;
    title?: string;
    description?: string;
    assignedTo?: Id<"users">;
    dueDate?: number;
  }
) {
  const { todo, mentorship } = await getTodoAndAuthorize(ctx, todoId);

  if (
    assignedTo &&
    assignedTo !== mentorship.mentorId &&
    assignedTo !== mentorship.menteeId
  ) {
    throw new Error("Todo can only be assigned to the mentor or mentee");
  }

  const patch: Partial<Doc<"mentorshipTodos">> = {
    updatedAt: Date.now(),
  };

  if (title !== undefined) {
    patch.title = assertNonEmptyTitle(title);
  }

  if (description !== undefined) {
    patch.description = normalizeOptionalText(description);
  }

  if (assignedTo !== undefined) {
    patch.assignedTo = assignedTo;
  }

  if (dueDate !== undefined) {
    patch.dueDate = dueDate;
  }

  await ctx.db.patch("mentorshipTodos", todo._id, patch);

  return todo._id;
}

export async function toggleTodoComplete(
  ctx: MutationCtx,
  {
    todoId,
    completed,
  }: {
    todoId: Id<"mentorshipTodos">;
    completed: boolean;
  }
) {
  const { todo } = await getTodoAndAuthorize(ctx, todoId);

  const now = Date.now();

  await ctx.db.patch("mentorshipTodos", todo._id, {
    completed,
    completedAt: completed ? now : undefined,
    updatedAt: now,
  });

  return todo._id;
}

export async function deleteTodo(
  ctx: MutationCtx,
  { todoId }: { todoId: Id<"mentorshipTodos"> }
) {
  const { todo } = await getTodoAndAuthorize(ctx, todoId);

  await ctx.db.delete("mentorshipTodos", todo._id);

  return todo._id;
}