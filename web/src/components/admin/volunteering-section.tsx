"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Loader2, Plus, Save, Users2 } from "lucide-react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  AdminEmptyState,
  AdminError,
  AdminSectionHeader,
  AdminSectionLoading,
  AdminStatusBadge,
  AdminSuccess,
  formatAdminDate,
  getErrorMessage,
} from "@/components/admin/admin-shared";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type VolunteerActivity =
  FunctionReturnType<typeof api.volunteering.listActivitiesForAdmin>[number];

function NewActivityForm() {
  const createActivity = useMutation(api.volunteering.createActivity);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      await createActivity({
        name,
        description: description.trim() || undefined,
      });
      setName("");
      setDescription("");
    } catch (mutationError) {
      setError(getErrorMessage(mutationError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add a volunteering activity</CardTitle>
        <CardDescription>
          New activities appear immediately on every member&apos;s dashboard
          checklist.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="new-activity-name">Activity name</Label>
            <Input
              id="new-activity-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Host an industry day"
              maxLength={120}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-activity-description">
              Description <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="new-activity-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Short context shown to members"
              maxLength={500}
            />
          </div>
          <Button type="submit" disabled={isSaving || name.trim().length < 2}>
            {isSaving ? <Loader2 className="animate-spin" /> : <Plus />}
            Add
          </Button>
        </form>
        {error && (
          <div className="mt-4">
            <AdminError message={error} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ActivitySignupsPanel({ activityId }: { activityId: Id<"volunteerActivities"> }) {
  const signups = useQuery(api.volunteering.listSignupsForActivity, {
    activityId,
  });

  if (signups === undefined) {
    return <p className="text-sm text-muted-foreground">Loading roster…</p>;
  }

  if (signups.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No members have checked this activity yet.
      </p>
    );
  }

  return (
    <ul className="space-y-2 text-sm">
      {signups.map((signup) => (
        <li
          key={signup._id}
          className="flex items-center justify-between rounded-md bg-[#f7f6f2] px-3 py-2"
        >
          <div>
            <p className="font-medium">{signup.userName}</p>
            {signup.userEmail && (
              <p className="text-xs text-muted-foreground">{signup.userEmail}</p>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            Checked {formatAdminDate(signup.createdAt)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ActivityCard({ activity }: { activity: VolunteerActivity }) {
  const updateActivity = useMutation(api.volunteering.updateActivity);
  const [name, setName] = useState(activity.name);
  const [description, setDescription] = useState(activity.description ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showRoster, setShowRoster] = useState(false);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateActivity({
        activityId: activity._id,
        name,
        description: description.trim() || undefined,
      });
      setSuccess("Saved.");
    } catch (mutationError) {
      setError(getErrorMessage(mutationError));
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async () => {
    setError(null);
    setIsSaving(true);
    try {
      await updateActivity({
        activityId: activity._id,
        isActive: !activity.isActive,
      });
    } catch (mutationError) {
      setError(getErrorMessage(mutationError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base">{activity.name}</CardTitle>
            <AdminStatusBadge tone={activity.isActive ? "success" : "neutral"}>
              {activity.isActive ? "Active" : "Retired"}
            </AdminStatusBadge>
          </div>
          <CardDescription className="mt-1">
            {activity.signupCount} member
            {activity.signupCount === 1 ? "" : "s"} volunteered
          </CardDescription>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={toggleActive} disabled={isSaving}>
          {activity.isActive ? "Retire" : "Reactivate"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSave} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor={`activity-name-${activity._id}`}>Name</Label>
              <Input
                id={`activity-name-${activity._id}`}
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={120}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`activity-description-${activity._id}`}>
                Description
              </Label>
              <Textarea
                id={`activity-description-${activity._id}`}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={2}
                maxLength={500}
              />
            </div>
          </div>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
            Save
          </Button>
        </form>

        {error && <AdminError message={error} />}
        {success && <AdminSuccess message={success} />}

        <div className="border-t pt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowRoster((value) => !value)}
          >
            <Users2 />
            {showRoster ? "Hide" : "View"} volunteers
          </Button>
          {showRoster && (
            <div className="mt-3">
              <ActivitySignupsPanel activityId={activity._id} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function VolunteeringSection() {
  const activities = useQuery(api.volunteering.listActivitiesForAdmin);

  if (activities === undefined) {
    return <AdminSectionLoading rows={4} />;
  }

  return (
    <div className="space-y-7">
      <AdminSectionHeader
        eyebrow="Beyond mentoring"
        title="Volunteering activities"
        description="Manage the list of ways members can volunteer their time. Members check the ones they're interested in from their dashboard."
      />

      <NewActivityForm />

      {activities.length === 0 ? (
        <Card>
          <AdminEmptyState
            icon={Users2}
            title="No volunteering activities yet"
            description="Add an activity above to make it available on every member's dashboard."
          />
        </Card>
      ) : (
        <div className="space-y-5">
          {activities.map((activity) => (
            <ActivityCard key={activity._id} activity={activity} />
          ))}
        </div>
      )}
    </div>
  );
}
