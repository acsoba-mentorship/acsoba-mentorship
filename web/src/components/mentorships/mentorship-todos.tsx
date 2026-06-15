"use client";

import { useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
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
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";

type MentorshipGoalOption = {
  _id: Id<"mentorshipGoals">;
  title: string;
};

type MentorshipTodo = {
  _id: Id<"mentorshipTodos">;
  goalId?: Id<"mentorshipGoals">;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
};

type MentorshipTodosProps = {
  mentorshipId: Id<"mentorships">;
  todos: MentorshipTodo[];
  goals: MentorshipGoalOption[];
};

export function MentorshipTodos({
  mentorshipId,
  todos,
  goals,
}: MentorshipTodosProps) {
  const createTodo = useMutation(api.mentorshipWorkspace.createTodo);
  const updateTodo = useMutation(api.mentorshipWorkspace.updateTodo);
  const toggleTodoComplete = useMutation(
    api.mentorshipWorkspace.toggleTodoComplete
  );
  const deleteTodo = useMutation(api.mentorshipWorkspace.deleteTodo);

  const [todoTitle, setTodoTitle] = useState("");
  const [todoDescription, setTodoDescription] = useState("");
  const [todoGoalId, setTodoGoalId] =
    useState<Id<"mentorshipGoals"> | "none">("none");

  const [editingTodoId, setEditingTodoId] =
    useState<Id<"mentorshipTodos"> | null>(null);
  const [editTodoTitle, setEditTodoTitle] = useState("");
  const [editTodoDescription, setEditTodoDescription] = useState("");

  const [isSubmittingTodo, setIsSubmittingTodo] = useState(false);
  const [isUpdatingTodo, setIsUpdatingTodo] = useState(false);

  const [deletingTodoIds, setDeletingTodoIds] = useState<
    Set<Id<"mentorshipTodos">>
  >(new Set());

  const activeTodos = useMemo(() => {
    return todos.filter((todo) => !todo.completed);
  }, [todos]);

  const completedTodos = useMemo(() => {
    return todos.filter((todo) => todo.completed);
  }, [todos]);

  const goalTitleById = useMemo(() => {
    return new Map(goals.map((goal) => [goal._id, goal.title]));
  }, [goals]);

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

  function startEditingTodo(todo: MentorshipTodo) {
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

  function renderTodo(todo: MentorshipTodo, isCompletedSection: boolean) {
    const linkedGoalTitle = todo.goalId ? goalTitleById.get(todo.goalId) : null;
    const isEditing = editingTodoId === todo._id;

    return (
      <div
        key={todo._id}
        className={
          isCompletedSection
            ? "rounded-lg border bg-muted/30 p-4"
            : "rounded-lg border p-4"
        }
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
                    onChange={(event) => setEditTodoTitle(event.target.value)}
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
                      onClick={() => handleUpdateTodo(todo._id)}
                      disabled={isUpdatingTodo || !editTodoTitle.trim()}
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
                  <h3
                    className={
                      isCompletedSection
                        ? "font-medium line-through text-muted-foreground"
                        : "font-medium"
                    }
                  >
                    {todo.title}
                  </h3>

                  {todo.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {todo.description}
                    </p>
                  )}

                  {linkedGoalTitle && (
                    <Badge variant="secondary" className="mt-2">
                      Goal: {linkedGoalTitle}
                    </Badge>
                  )}

                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>Created {formatDate(todo.createdAt)}</span>
                    {todo.completedAt && (
                      <span>Completed {formatDate(todo.completedAt)}</span>
                    )}
                  </div>
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
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Checklist</CardTitle>
        <CardDescription>
          {completedTodos.length} of {todos.length} items completed.
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

          {goals.length > 0 && (
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
              {goals.map((goal) => (
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
              activeTodos.map((todo) => renderTodo(todo, false))
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
              completedTodos.map((todo) => renderTodo(todo, true))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}