"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { CheckCircle2, HandHeart, Loader2, Save } from "lucide-react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { VolunteerActivityCard } from "@/components/volunteering/volunteer-activity-card";

type VolunteerActivity =
  FunctionReturnType<typeof api.volunteering.listActivities>[number];

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

/**
 * FR18/FR19: volunteering now lives on its own tab (not the dashboard).
 * Selecting/deselecting a card only stages a local change; nothing is
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
  const [detailsActivity, setDetailsActivity] =
    useState<VolunteerActivity | null>(null);

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
          Select the activities you&apos;re interested in and save your
          choices.
        </p>
      </div>

      {activities === undefined ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-52 w-full rounded-lg" />
          <Skeleton className="h-52 w-full rounded-lg" />
          <Skeleton className="h-52 w-full rounded-lg" />
        </div>
      ) : activities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <HandHeart className="size-5" />
            </span>
            <p className="mt-4 font-semibold">
              No volunteering activities right now
            </p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Check back soon for ways to help beyond mentoring.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {activities.map((activity) => {
            const isSelected = selected.has(activity._id);
            return (
              <VolunteerActivityCard
                key={activity._id}
                name={activity.name}
                description={activity.description}
                isActive
                topRightExtra={
                  isSelected ? (
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle2 className="size-3" />
                      Selected
                    </Badge>
                  ) : undefined
                }
                footer={
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={isSelected ? "outline" : "default"}
                      size="sm"
                      className="flex-1"
                      onClick={() => toggle(activity._id)}
                    >
                      {isSelected ? "Selected" : "Select"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setDetailsActivity(activity)}
                    >
                      View details
                    </Button>
                  </div>
                }
              />
            );
          })}
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

      <Dialog
        open={detailsActivity !== null}
        onOpenChange={(open) => !open && setDetailsActivity(null)}
      >
        <DialogContent>
          {detailsActivity && (
            <>
              <DialogHeader>
                <DialogTitle>{detailsActivity.name}</DialogTitle>
                <DialogDescription>
                  {detailsActivity.description ||
                    "No further details have been provided for this activity."}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  type="button"
                  variant={
                    selected.has(detailsActivity._id) ? "outline" : "default"
                  }
                  onClick={() => toggle(detailsActivity._id)}
                >
                  {selected.has(detailsActivity._id) ? "Selected" : "Select"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
