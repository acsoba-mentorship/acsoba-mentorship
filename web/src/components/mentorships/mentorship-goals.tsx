"use client";

import { useMemo, useState } from "react";
import { useMutation } from "convex/react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";

type MentorshipGoal = {
  _id: Id<"mentorshipGoals">;
  title: string;
  description?: string;
  status: string;
  createdAt: number;
  completedAt?: number;
};

type MentorshipGoalsProps = {
  mentorshipId: Id<"mentorships">;
  goals: MentorshipGoal[];
};

export function MentorshipGoals({
  mentorshipId,
  goals,
}: MentorshipGoalsProps) {
  const createGoal = useMutation(api.mentorshipWorkspace.createGoal);
  const updateGoal = useMutation(api.mentorshipWorkspace.updateGoal);
  const toggleGoalComplete = useMutation(
    api.mentorshipWorkspace.toggleGoalComplete
  );
  const deleteGoal = useMutation(api.mentorshipWorkspace.deleteGoal);

  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");

  const [editingGoalId, setEditingGoalId] =
    useState<Id<"mentorshipGoals"> | null>(null);
  const [editGoalTitle, setEditGoalTitle] = useState("");
  const [editGoalDescription, setEditGoalDescription] = useState("");

  const [isSubmittingGoal, setIsSubmittingGoal] = useState(false);
  const [isUpdatingGoal, setIsUpdatingGoal] = useState(false);

  const [deletingGoalIds, setDeletingGoalIds] = useState<
    Set<Id<"mentorshipGoals">>
  >(new Set());

  const activeGoals = useMemo(() => {
    return goals.filter((goal) => goal.status !== "completed");
  }, [goals]);

  const completedGoals = useMemo(() => {
    return goals.filter((goal) => goal.status === "completed");
  }, [goals]);

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

  function startEditingGoal(goal: MentorshipGoal) {
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

  function renderGoal(goal: MentorshipGoal, isCompletedSection: boolean) {
    const isEditing = editingGoalId === goal._id;

    return (
      <div
        key={goal._id}
        className={
          isCompletedSection
            ? "rounded-lg border bg-muted/30 p-4"
            : "rounded-lg border p-4"
        }
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-1 gap-3">
            <button
              type="button"
              onClick={() =>
                toggleGoalComplete({
                  goalId: goal._id,
                  completed: !isCompletedSection,
                })
              }
              className="mt-1"
              aria-label={
                isCompletedSection
                  ? "Mark goal as active"
                  : "Mark goal as completed"
              }
            >
              {isCompletedSection ? (
                <CheckCircle2 className="size-5 text-primary" />
              ) : (
                <Circle className="size-5 text-muted-foreground" />
              )}
            </button>

            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-3">
                  <Input
                    value={editGoalTitle}
                    onChange={(event) => setEditGoalTitle(event.target.value)}
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
                      onClick={() => handleUpdateGoal(goal._id)}
                      disabled={isUpdatingGoal || !editGoalTitle.trim()}
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
                    <h3
                      className={
                        isCompletedSection
                          ? "font-medium line-through text-muted-foreground"
                          : "font-medium"
                      }
                    >
                      {goal.title}
                    </h3>

                    <Badge variant={isCompletedSection ? "default" : "secondary"}>
                      {isCompletedSection ? "completed" : "active"}
                    </Badge>
                  </div>

                  {goal.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {goal.description}
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>Created {formatDate(goal.createdAt)}</span>
                    {goal.completedAt && (
                      <span>Completed {formatDate(goal.completedAt)}</span>
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
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Goals</CardTitle>
        <CardDescription>
          {completedGoals.length} of {goals.length} goals completed.
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
              activeGoals.map((goal) => renderGoal(goal, false))
            )}
          </div>

          <div className="space-y-3 border-t pt-4">
            <div>
              <h3 className="text-sm font-semibold">Completed Goal History</h3>
              <p className="text-xs text-muted-foreground">
                Goals that have already been met are retained here for reference.
              </p>
            </div>

            {completedGoals.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No completed goals yet.
              </p>
            ) : (
              completedGoals.map((goal) => renderGoal(goal, true))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}