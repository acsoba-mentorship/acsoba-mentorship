"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { HandHeart, Loader2 } from "lucide-react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

/**
 * FR18 — a checklist on the member's dashboard where they can check or
 * uncheck the volunteering activities they'd like to help with. The list
 * itself is maintained by admins from the Programme Admin console.
 */
export function VolunteeringChecklist() {
  const activities = useQuery(api.volunteering.listActivities);
  const toggleSignup = useMutation(api.volunteering.toggleSignup);
  const [pendingId, setPendingId] = useState<Id<"volunteerActivities"> | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  if (activities === undefined) {
    return <Skeleton className="h-48 w-full rounded-lg" />;
  }

  if (activities.length === 0) {
    return null;
  }

  async function handleToggle(activityId: Id<"volunteerActivities">) {
    setError(null);
    setPendingId(activityId);
    try {
      await toggleSignup({ activityId });
    } catch (toggleError) {
      setError(getErrorMessage(toggleError));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HandHeart className="size-5 text-primary" />
          Volunteer your time
        </CardTitle>
        <CardDescription>
          Beyond mentoring, check anything you&apos;d like to help with. The
          programme team will reach out when an opportunity comes up.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {activities.map((activity) => (
          <label
            key={activity._id}
            htmlFor={`volunteer-${activity._id}`}
            className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/60"
          >
            <span className="mt-0.5">
              {pendingId === activity._id ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              ) : (
                <Checkbox
                  id={`volunteer-${activity._id}`}
                  checked={activity.isSignedUp}
                  disabled={pendingId !== null}
                  onCheckedChange={() => handleToggle(activity._id)}
                />
              )}
            </span>
            <span>
              <span className="block text-sm font-medium">
                {activity.name}
              </span>
              {activity.description ? (
                <span className="block text-xs text-muted-foreground">
                  {activity.description}
                </span>
              ) : null}
            </span>
          </label>
        ))}
        {error ? (
          <p className="pt-1 text-xs text-destructive">{error}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
