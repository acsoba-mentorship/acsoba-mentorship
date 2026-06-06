"use client";

import { useMemo, useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import {
  CheckCircle2,
  Circle,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";

function HistoryDates({
  createdAt,
  completedAt,
}: {
  createdAt: number;
  completedAt?: number;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
      <span>Created {formatDate(createdAt)}</span>
      {completedAt && <span>Completed {formatDate(completedAt)}</span>}
    </div>
  );
}

export function MentorshipWorkspace({
  mentorshipId,
}: {
  mentorshipId: Id<"mentorships">;
}) {
  const workspace = useQuery(api.mentorshipWorkspace.getWorkspace, {
    mentorshipId,
  });

  const createGoal = useMutation(api.mentorshipWorkspace.createGoal);
  const updateGoal = useMutation(api.mentorshipWorkspace.updateGoal);
  const toggleGoalComplete = useMutation(
    api.mentorshipWorkspace.toggleGoalComplete
  );
  const deleteGoal = useMutation(api.mentorshipWorkspace.deleteGoal);

  const createTodo = useMutation(api.mentorshipWorkspace.createTodo);
  const updateTodo = useMutation(api.mentorshipWorkspace.updateTodo);
  const toggleTodoComplete = useMutation(
    api.mentorshipWorkspace.toggleTodoComplete
  );
  const deleteTodo = useMutation(api.mentorshipWorkspace.deleteTodo);

  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");

  const [todoTitle, setTodoTitle] = useState("");
  const [todoDescription, setTodoDescription] = useState("");
  const [todoGoalId, setTodoGoalId] =
    useState<Id<"mentorshipGoals"> | "none">("none");

  const [editingGoalId, setEditingGoalId] =
    useState<Id<"mentorshipGoals"> | null>(null);
  const [editGoalTitle, setEditGoalTitle] = useState("");
  const [editGoalDescription, setEditGoalDescription] = useState("");

  const [editingTodoId, setEditingTodoId] =
    useState<Id<"mentorshipTodos"> | null>(null);
  const [editTodoTitle, setEditTodoTitle] = useState("");
  const [editTodoDescription, setEditTodoDescription] = useState("");

  const [isSubmittingGoal, setIsSubmittingGoal] = useState(false);
  const [isSubmittingTodo, setIsSubmittingTodo] = useState(false);
  const [isUpdatingGoal, setIsUpdatingGoal] = useState(false);
  const [isUpdatingTodo, setIsUpdatingTodo] = useState(false);

  const [deletingGoalIds, setDeletingGoalIds] = useState<
    Set<Id<"mentorshipGoals">>
  >(new Set());

  const [deletingTodoIds, setDeletingTodoIds] = useState<
    Set<Id<"mentorshipTodos">>
  >(new Set());

  const activeGoals = useMemo(() => {
    return workspace?.goals.filter((goal) => goal.status !== "completed") ?? [];
  }, [workspace?.goals]);

  const completedGoals = useMemo(() => {
    return workspace?.goals.filter((goal) => goal.status === "completed") ?? [];
  }, [workspace?.goals]);

  const activeTodos = useMemo(() => {
    return workspace?.todos.filter((todo) => !todo.completed) ?? [];
  }, [workspace?.todos]);

  const completedTodos = useMemo(() => {
    return workspace?.todos.filter((todo) => todo.completed) ?? [];
  }, [workspace?.todos]);

  const completedGoalCount = completedGoals.length;
  const completedTodoCount = completedTodos.length;

  if (workspace === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  const mentorship = workspace.mentorship;
  const participant =
    workspace.role === "mentor" ? workspace.mentee : workspace.mentor;

  async function handleCreateGoal() {
    if (!goalTitle.trim()) {
      return;
    }

    setIsSubmittingGoal(true);

    try {
      await createGoal({
        mentorshipId,
        title: goalTitle,
        description: goalDescription || undefined,
      });

      setGoalTitle("");
      setGoalDescription("");
    } finally {
      setIsSubmittingGoal(false);
    }
  }

  function startEditingGoal(goal: {
    _id: Id<"mentorshipGoals">;
    title: string;
    description?: string;
  }) {
    setEditingGoalId(goal._id);
    setEditGoalTitle(goal.title);
    setEditGoalDescription(goal.description ?? "");
  }

  function cancelEditingGoal() {
    setEditingGoalId(null);
    setEditGoalTitle("");
    setEditGoalDescription("");
  }

  async function handleUpdateGoal(goalId: Id<"mentorshipGoals">) {
    if (!editGoalTitle.trim()) {
      return;
    }

    setIsUpdatingGoal(true);

    try {
      await updateGoal({
        goalId,
        title: editGoalTitle,
        description: editGoalDescription || undefined,
      });

      cancelEditingGoal();
    } finally {
      setIsUpdatingGoal(false);
    }
  }

  async function handleDeleteGoal(goalId: Id<"mentorshipGoals">) {
    if (deletingGoalIds.has(goalId)) {
      return;
    }

    setDeletingGoalIds((current) => new Set(current).add(goalId));

    try {
      await deleteGoal({ goalId });
    } finally {
      setDeletingGoalIds((current) => {
        const next = new Set(current);
        next.delete(goalId);
        return next;
      });
    }
  }

  async function handleCreateTodo() {
    if (!todoTitle.trim()) {
      return;
    }

    setIsSubmittingTodo(true);

    try {
      await createTodo({
        mentorshipId,
        goalId: todoGoalId === "none" ? undefined : todoGoalId,
        title: todoTitle,
        description: todoDescription || undefined,
      });

      setTodoTitle("");
      setTodoDescription("");
      setTodoGoalId("none");
    } finally {
      setIsSubmittingTodo(false);
    }
  }

  function startEditingTodo(todo: {
    _id: Id<"mentorshipTodos">;
    title: string;
    description?: string;
  }) {
    setEditingTodoId(todo._id);
    setEditTodoTitle(todo.title);
    setEditTodoDescription(todo.description ?? "");
  }

  function cancelEditingTodo() {
    setEditingTodoId(null);
    setEditTodoTitle("");
    setEditTodoDescription("");
  }

  async function handleUpdateTodo(todoId: Id<"mentorshipTodos">) {
    if (!editTodoTitle.trim()) {
      return;
    }

    setIsUpdatingTodo(true);

    try {
      await updateTodo({
        todoId,
        title: editTodoTitle,
        description: editTodoDescription || undefined,
      });

      cancelEditingTodo();
    } finally {
      setIsUpdatingTodo(false);
    }
  }

  async function handleDeleteTodo(todoId: Id<"mentorshipTodos">) {
    if (deletingTodoIds.has(todoId)) {
      return;
    }

    setDeletingTodoIds((current) => new Set(current).add(todoId));

    try {
      await deleteTodo({ todoId });
    } finally {
      setDeletingTodoIds((current) => {
        const next = new Set(current);
        next.delete(todoId);
        return next;
      });
    }
  }

  function getLinkedGoalTitle(goalId?: Id<"mentorshipGoals">) {
    if (!goalId || !workspace) {
      return null;
    }

    return workspace.goals.find((goal) => goal._id === goalId)?.title ?? null;
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Mentorship Workspace</CardTitle>
          <CardDescription>
            Manage goals, checklist items, and completion history for this
            active mentorship.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Your role</p>
            <p className="font-medium capitalize">{workspace.role}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Paired with</p>
            <p className="font-medium">{participant?.name ?? "Unknown user"}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Started</p>
            <p className="font-medium">{formatDate(mentorship.startDate)}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Goals</CardTitle>
            <CardDescription>
              {completedGoalCount} of {workspace.goals.length} goals completed.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-3 rounded-lg border p-4">
              <Input
                value={goalTitle}
                onChange={(event) => setGoalTitle(event.target.value)}
                placeholder="Goal title"
              />

              <Textarea
                value={goalDescription}
                onChange={(event) => setGoalDescription(event.target.value)}
                placeholder="Optional goal description"
              />

              <Button
                type="button"
                onClick={handleCreateGoal}
                disabled={isSubmittingGoal || !goalTitle.trim()}
              >
                <Plus className="mr-2 size-4" />
                Add Goal
              </Button>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold">Active Goals</h3>
                  <p className="text-xs text-muted-foreground">
                    Goals that are still being worked on.
                  </p>
                </div>

                {activeGoals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No active goals right now.
                  </p>
                ) : (
                  activeGoals.map((goal) => {
                    const isEditing = editingGoalId === goal._id;

                    return (
                      <div key={goal._id} className="rounded-lg border p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex flex-1 gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                toggleGoalComplete({
                                  goalId: goal._id,
                                  completed: true,
                                })
                              }
                              className="mt-1"
                              aria-label="Mark goal as completed"
                            >
                              <Circle className="size-5 text-muted-foreground" />
                            </button>

                            <div className="flex-1">
                              {isEditing ? (
                                <div className="space-y-3">
                                  <Input
                                    value={editGoalTitle}
                                    onChange={(event) =>
                                      setEditGoalTitle(event.target.value)
                                    }
                                    placeholder="Goal title"
                                  />

                                  <Textarea
                                    value={editGoalDescription}
                                    onChange={(event) =>
                                      setEditGoalDescription(event.target.value)
                                    }
                                    placeholder="Optional goal description"
                                  />

                                  <div className="flex flex-wrap gap-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={() =>
                                        handleUpdateGoal(goal._id)
                                      }
                                      disabled={
                                        isUpdatingGoal ||
                                        !editGoalTitle.trim()
                                      }
                                    >
                                      <Save className="mr-2 size-4" />
                                      Save
                                    </Button>

                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={cancelEditingGoal}
                                    >
                                      <X className="mr-2 size-4" />
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="font-medium">
                                      {goal.title}
                                    </h3>
                                    <Badge variant="secondary">active</Badge>
                                  </div>

                                  {goal.description && (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                      {goal.description}
                                    </p>
                                  )}

                                  <HistoryDates
                                    createdAt={goal.createdAt}
                                    completedAt={goal.completedAt}
                                  />
                                </>
                              )}
                            </div>
                          </div>

                          {!isEditing && (
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => startEditingGoal(goal)}
                              >
                                <Pencil className="size-4" />
                              </Button>

                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                disabled={deletingGoalIds.has(goal._id)}
                                onClick={() => handleDeleteGoal(goal._id)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="space-y-3 border-t pt-4">
                <div>
                  <h3 className="text-sm font-semibold">
                    Completed Goal History
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Goals that have already been met are retained here for
                    reference.
                  </p>
                </div>

                {completedGoals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No completed goals yet.
                  </p>
                ) : (
                  completedGoals.map((goal) => {
                    const isEditing = editingGoalId === goal._id;

                    return (
                      <div
                        key={goal._id}
                        className="rounded-lg border bg-muted/30 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex flex-1 gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                toggleGoalComplete({
                                  goalId: goal._id,
                                  completed: false,
                                })
                              }
                              className="mt-1"
                              aria-label="Mark goal as active"
                            >
                              <CheckCircle2 className="size-5 text-primary" />
                            </button>

                            <div className="flex-1">
                              {isEditing ? (
                                <div className="space-y-3">
                                  <Input
                                    value={editGoalTitle}
                                    onChange={(event) =>
                                      setEditGoalTitle(event.target.value)
                                    }
                                    placeholder="Goal title"
                                  />

                                  <Textarea
                                    value={editGoalDescription}
                                    onChange={(event) =>
                                      setEditGoalDescription(event.target.value)
                                    }
                                    placeholder="Optional goal description"
                                  />

                                  <div className="flex flex-wrap gap-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={() =>
                                        handleUpdateGoal(goal._id)
                                      }
                                      disabled={
                                        isUpdatingGoal ||
                                        !editGoalTitle.trim()
                                      }
                                    >
                                      <Save className="mr-2 size-4" />
                                      Save
                                    </Button>

                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={cancelEditingGoal}
                                    >
                                      <X className="mr-2 size-4" />
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="font-medium line-through text-muted-foreground">
                                      {goal.title}
                                    </h3>
                                    <Badge>completed</Badge>
                                  </div>

                                  {goal.description && (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                      {goal.description}
                                    </p>
                                  )}

                                  <HistoryDates
                                    createdAt={goal.createdAt}
                                    completedAt={goal.completedAt}
                                  />
                                </>
                              )}
                            </div>
                          </div>

                          {!isEditing && (
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => startEditingGoal(goal)}
                              >
                                <Pencil className="size-4" />
                              </Button>

                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                disabled={deletingGoalIds.has(goal._id)}
                                onClick={() => handleDeleteGoal(goal._id)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Checklist</CardTitle>
            <CardDescription>
              {completedTodoCount} of {workspace.todos.length} items completed.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-3 rounded-lg border p-4">
              <Input
                value={todoTitle}
                onChange={(event) => setTodoTitle(event.target.value)}
                placeholder="Todo title"
              />

              <Textarea
                value={todoDescription}
                onChange={(event) => setTodoDescription(event.target.value)}
                placeholder="Optional todo description"
              />

              {workspace.goals.length > 0 && (
                <select
                  value={todoGoalId}
                  onChange={(event) =>
                    setTodoGoalId(
                      event.target.value === "none"
                        ? "none"
                        : (event.target.value as Id<"mentorshipGoals">)
                    )
                  }
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="none">No linked goal</option>
                  {workspace.goals.map((goal) => (
                    <option key={goal._id} value={goal._id}>
                      {goal.title}
                    </option>
                  ))}
                </select>
              )}

              <Button
                type="button"
                onClick={handleCreateTodo}
                disabled={isSubmittingTodo || !todoTitle.trim()}
              >
                <Plus className="mr-2 size-4" />
                Add Checklist Item
              </Button>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold">Active Checklist</h3>
                  <p className="text-xs text-muted-foreground">
                    Checklist items that still need to be done.
                  </p>
                </div>

                {activeTodos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No active checklist items right now.
                  </p>
                ) : (
                  activeTodos.map((todo) => {
                    const linkedGoalTitle = getLinkedGoalTitle(todo.goalId);
                    const isEditing = editingTodoId === todo._id;

                    return (
                      <div key={todo._id} className="rounded-lg border p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex flex-1 gap-3">
                            <Checkbox
                              checked={todo.completed}
                              onCheckedChange={(checked) =>
                                toggleTodoComplete({
                                  todoId: todo._id,
                                  completed: checked === true,
                                })
                              }
                              className="mt-1"
                            />

                            <div className="flex-1">
                              {isEditing ? (
                                <div className="space-y-3">
                                  <Input
                                    value={editTodoTitle}
                                    onChange={(event) =>
                                      setEditTodoTitle(event.target.value)
                                    }
                                    placeholder="Todo title"
                                  />

                                  <Textarea
                                    value={editTodoDescription}
                                    onChange={(event) =>
                                      setEditTodoDescription(event.target.value)
                                    }
                                    placeholder="Optional todo description"
                                  />

                                  <div className="flex flex-wrap gap-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={() =>
                                        handleUpdateTodo(todo._id)
                                      }
                                      disabled={
                                        isUpdatingTodo ||
                                        !editTodoTitle.trim()
                                      }
                                    >
                                      <Save className="mr-2 size-4" />
                                      Save
                                    </Button>

                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={cancelEditingTodo}
                                    >
                                      <X className="mr-2 size-4" />
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <h3 className="font-medium">
                                    {todo.title}
                                  </h3>

                                  {todo.description && (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                      {todo.description}
                                    </p>
                                  )}

                                  {linkedGoalTitle && (
                                    <Badge
                                      variant="secondary"
                                      className="mt-2"
                                    >
                                      Goal: {linkedGoalTitle}
                                    </Badge>
                                  )}

                                  <HistoryDates
                                    createdAt={todo.createdAt}
                                    completedAt={todo.completedAt}
                                  />
                                </>
                              )}
                            </div>
                          </div>

                          {!isEditing && (
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => startEditingTodo(todo)}
                              >
                                <Pencil className="size-4" />
                              </Button>

                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                disabled={deletingTodoIds.has(todo._id)}
                                onClick={() => handleDeleteTodo(todo._id)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="space-y-3 border-t pt-4">
                <div>
                  <h3 className="text-sm font-semibold">
                    Completed Checklist History
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Completed checklist items are retained here with completion
                    dates.
                  </p>
                </div>

                {completedTodos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No completed checklist items yet.
                  </p>
                ) : (
                  completedTodos.map((todo) => {
                    const linkedGoalTitle = getLinkedGoalTitle(todo.goalId);
                    const isEditing = editingTodoId === todo._id;

                    return (
                      <div
                        key={todo._id}
                        className="rounded-lg border bg-muted/30 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex flex-1 gap-3">
                            <Checkbox
                              checked={todo.completed}
                              onCheckedChange={(checked) =>
                                toggleTodoComplete({
                                  todoId: todo._id,
                                  completed: checked === true,
                                })
                              }
                              className="mt-1"
                            />

                            <div className="flex-1">
                              {isEditing ? (
                                <div className="space-y-3">
                                  <Input
                                    value={editTodoTitle}
                                    onChange={(event) =>
                                      setEditTodoTitle(event.target.value)
                                    }
                                    placeholder="Todo title"
                                  />

                                  <Textarea
                                    value={editTodoDescription}
                                    onChange={(event) =>
                                      setEditTodoDescription(event.target.value)
                                    }
                                    placeholder="Optional todo description"
                                  />

                                  <div className="flex flex-wrap gap-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={() =>
                                        handleUpdateTodo(todo._id)
                                      }
                                      disabled={
                                        isUpdatingTodo ||
                                        !editTodoTitle.trim()
                                      }
                                    >
                                      <Save className="mr-2 size-4" />
                                      Save
                                    </Button>

                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={cancelEditingTodo}
                                    >
                                      <X className="mr-2 size-4" />
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <h3 className="font-medium line-through text-muted-foreground">
                                    {todo.title}
                                  </h3>

                                  {todo.description && (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                      {todo.description}
                                    </p>
                                  )}

                                  {linkedGoalTitle && (
                                    <Badge
                                      variant="secondary"
                                      className="mt-2"
                                    >
                                      Goal: {linkedGoalTitle}
                                    </Badge>
                                  )}

                                  <HistoryDates
                                    createdAt={todo.createdAt}
                                    completedAt={todo.completedAt}
                                  />
                                </>
                              )}
                            </div>
                          </div>

                          {!isEditing && (
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => startEditingTodo(todo)}
                              >
                                <Pencil className="size-4" />
                              </Button>

                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                disabled={deletingTodoIds.has(todo._id)}
                                onClick={() => handleDeleteTodo(todo._id)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}