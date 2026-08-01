"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { HandHeart, Loader2, Save } from "lucide-react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

/**
 * FR18/FR19: volunteering now lives on its own tab (not the dashboard).
 * Checking/unchecking boxes only stages a local change; nothing is
 * persisted until the member clicks Save, which reconciles the whole set
 * of selections in a single mutation.
 */
export function VolunteeringTab() {
  const activities = useQuery(api.volunteering.listActivities);
  const setSignups = useMutation(api.volunteering.setSignups);

  const [selected, setSelected] = useState<Set<Id<"volunteerActivities">>>(
    new Set()
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Seed local state from the server once activities load, and whenever the
  // server's signed-up set changes underneath us (e.g. an admin retired an
  // activity the member had checked).
  useEffect(() => {
    if (!activities) return;
    setSelected(
      new Set(
        activities
          .filter((activity) => activity.isSignedUp)
          .map((activity) => activity._id)
      )
    );
  }, [activities]);

  const savedSet = useMemo(
    () =>
      new Set(
        (activities ?? [])
          .filter((activity) => activity.isSignedUp)
          .map((activity) => activity._id)
      ),
    [activities]
  );

  const hasChanges = useMemo(() => {
    if (selected.size !== savedSet.size) return true;
    for (const id of selected) {
      if (!savedSet.has(id)) return true;
    }
    return false;
  }, [selected, savedSet]);

  const toggle = (activityId: Id<"volunteerActivities">) => {
    setSaved(false);
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(activityId)) {
        next.delete(activityId);
      } else {
        next.add(activityId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await setSignups({ activityIds: Array.from(selected) });
      setSaved(true);
    } catch (mutationError) {
      setError(getErrorMessage(mutationError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Volunteering</h1>
        <p className="mt-2 text-muted-foreground">
          Beyond mentoring, let us know how else you&apos;d like to help.
          Check the activities you&apos;re interested in and save your
          choices.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HandHeart className="size-4 text-primary" />
            Ways to volunteer
          </CardTitle>
          <CardDescription>
            Your selections are only saved once you click &quot;Save&quot;.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {activities === undefined ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : activities.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              There are no volunteering activities available right now.
              Check back soon.
            </p>
          ) : (
            <div className="divide-y rounded-lg border">
              {activities.map((activity) => (
                <label
                  key={activity._id}
                  htmlFor={`activity-${activity._id}`}
                  className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-muted/40"
                >
                  <Checkbox
                    id={`activity-${activity._id}`}
                    checked={selected.has(activity._id)}
                    onCheckedChange={() => toggle(activity._id)}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium">{activity.name}</p>
                    {activity.description && (
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Couldn&apos;t save your changes</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {saved && !hasChanges && !error && (
            <Alert className="border-emerald-200 bg-emerald-50 text-emerald-950">
              <AlertTitle>Saved</AlertTitle>
              <AlertDescription className="text-emerald-800">
                Your volunteering preferences have been updated.
              </AlertDescription>
            </Alert>
          )}

          {activities !== undefined && activities.length > 0 && (
            <div className="flex items-center justify-end gap-3">
              {hasChanges && (
                <span className="text-sm text-muted-foreground">
                  You have unsaved changes
                </span>
              )}
              <Button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
              >
                {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
                Save
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
