"use client";

import { useMemo, useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { CheckCircle2, Circle, Plus, Trash2 } from "lucide-react";
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

export function MentorshipWorkspace({
  mentorshipId,
}: {
  mentorshipId: Id<"mentorships">;
}) {
  const workspace = useQuery(api.mentorshipWorkspace.getWorkspace, {
    mentorshipId,
  });

  const createGoal = useMutation(api.mentorshipWorkspace.createGoal);
  const toggleGoalComplete = useMutation(
    api.mentorshipWorkspace.toggleGoalComplete
  );
  const deleteGoal = useMutation(api.mentorshipWorkspace.deleteGoal);

  const createTodo = useMutation(api.mentorshipWorkspace.createTodo);
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

  const [isSubmittingGoal, setIsSubmittingGoal] = useState(false);
  const [isSubmittingTodo, setIsSubmittingTodo] = useState(false);

  const completedGoalCount = useMemo(() => {
    return workspace?.goals.filter((goal) => goal.status === "completed")
      .length ?? 0;
  }, [workspace?.goals]);

  const completedTodoCount = useMemo(() => {
    return workspace?.todos.filter((todo) => todo.completed).length ?? 0;
  }, [workspace?.todos]);

  if (workspace === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

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

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Mentorship Workspace</CardTitle>
          <CardDescription>
            Manage goals and checklist items for this active mentorship.
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
            <p className="font-medium">
              {formatDate(workspace.mentorship.startDate)}
            </p>
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

            {workspace.goals.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No goals have been added yet.
              </p>
            ) : (
              <div className="space-y-3">
                {workspace.goals.map((goal) => {
                  const completed = goal.status === "completed";

                  return (
                    <div
                      key={goal._id}
                      className="rounded-lg border p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              toggleGoalComplete({
                                goalId: goal._id,
                                completed: !completed,
                              })
                            }
                            className="mt-1"
                            aria-label={
                              completed
                                ? "Mark goal as active"
                                : "Mark goal as completed"
                            }
                          >
                            {completed ? (
                              <CheckCircle2 className="size-5 text-primary" />
                            ) : (
                              <Circle className="size-5 text-muted-foreground" />
                            )}
                          </button>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-medium">{goal.title}</h3>
                              <Badge
                                variant={
                                  completed ? "default" : "secondary"
                                }
                              >
                                {goal.status}
                              </Badge>
                            </div>

                            {goal.description && (
                              <p className="mt-1 text-sm text-muted-foreground">
                                {goal.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteGoal({ goalId: goal._id })}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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

            {workspace.todos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No checklist items have been added yet.
              </p>
            ) : (
              <div className="space-y-3">
                {workspace.todos.map((todo) => {
                  const linkedGoal = workspace.goals.find(
                    (goal) => goal._id === todo.goalId
                  );

                  return (
                    <div
                      key={todo._id}
                      className="rounded-lg border p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-3">
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

                          <div>
                            <h3
                              className={
                                todo.completed
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

                            {linkedGoal && (
                              <Badge variant="secondary" className="mt-2">
                                Goal: {linkedGoal.title}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteTodo({ todoId: todo._id })}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}