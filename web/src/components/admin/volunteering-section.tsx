"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Loader2, Plus, Save, Search, Users2 } from "lucide-react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  AdminEmptyState,
  AdminError,
  AdminSectionHeader,
  AdminSectionLoading,
  AdminSuccess,
  formatAdminDate,
  getErrorMessage,
} from "@/components/admin/admin-shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { VolunteerActivityCard } from "@/components/volunteering/volunteer-activity-card";

type VolunteerActivity =
  FunctionReturnType<typeof api.volunteering.listActivitiesForAdmin>[number];

type StatusFilter = "all" | "active" | "retired";

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
          New activities appear immediately on every member&apos;s
          volunteering tab.
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
        No members have volunteered for this activity yet.
      </p>
    );
  }

  return (
    <ul className="max-h-48 space-y-2 overflow-y-auto text-sm">
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

/**
 * The full edit/retire/roster workflow, now tucked behind "Manage" so the
 * card grid itself can stay compact and match the internship card layout.
 */
function ManageActivityDialog({
  activity,
  open,
  onOpenChange,
}: {
  activity: VolunteerActivity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateActivity = useMutation(api.volunteering.updateActivity);
  const [name, setName] = useState(activity.name);
  const [description, setDescription] = useState(activity.description ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle>{activity.name}</DialogTitle>
            <Badge
              className={
                activity.isActive
                  ? "border-0 bg-emerald-50 text-emerald-700"
                  : "border-0 bg-muted text-muted-foreground"
              }
            >
              {activity.isActive ? "Active" : "Retired"}
            </Badge>
          </div>
          <DialogDescription>
            {activity.signupCount} member
            {activity.signupCount === 1 ? "" : "s"} volunteered
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-3">
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
              rows={3}
              maxLength={500}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
              Save
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={toggleActive}
              disabled={isSaving}
            >
              {activity.isActive ? "Retire" : "Reactivate"}
            </Button>
          </div>
        </form>

        {error && <AdminError message={error} />}
        {success && <AdminSuccess message={success} />}

        <div className="border-t pt-3">
          <p className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Users2 className="size-4" />
            Volunteers
          </p>
          <ActivitySignupsPanel activityId={activity._id} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function matchesSearch(activity: VolunteerActivity, query: string) {
  if (!query) return true;
  const haystack = [activity.name, activity.description ?? ""]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export function VolunteeringSection() {
  const activities = useQuery(api.volunteering.listActivitiesForAdmin);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [manageActivityId, setManageActivityId] =
    useState<Id<"volunteerActivities"> | null>(null);

  const filtered = useMemo(() => {
    if (!activities) return undefined;
    return activities.filter((activity) => {
      if (statusFilter === "active" && !activity.isActive) return false;
      if (statusFilter === "retired" && activity.isActive) return false;
      return matchesSearch(activity, search.trim());
    });
  }, [activities, search, statusFilter]);

  const manageActivity = activities?.find((a) => a._id === manageActivityId) ?? null;

  if (activities === undefined) {
    return <AdminSectionLoading rows={4} />;
  }

  return (
    <div className="space-y-7">
      <AdminSectionHeader
        eyebrow="Beyond mentoring"
        title="Volunteering activities"
        description="Manage the list of ways members can volunteer their time. Members select the ones they're interested in from their volunteering tab."
      />

      <NewActivityForm />

      {activities.length === 0 ? (
        <Card>
          <AdminEmptyState
            icon={Users2}
            title="No volunteering activities yet"
            description="Add an activity above to make it available to every member."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or description..."
                className="pl-9"
                aria-label="Search volunteering activities"
              />
            </div>

            <div
              role="group"
              aria-label="Filter by status"
              className="inline-flex w-fit items-center rounded-md border p-0.5"
            >
              {(
                [
                  { value: "all", label: "All" },
                  { value: "active", label: "Active" },
                  { value: "retired", label: "Retired" },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatusFilter(option.value)}
                  aria-pressed={statusFilter === option.value}
                  className={`rounded-sm px-3 py-1.5 text-sm font-medium transition-colors ${
                    statusFilter === option.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {filtered && filtered.length === 0 ? (
            <Card>
              <AdminEmptyState
                icon={Search}
                title="No matching activities"
                description="Try a different search term or status filter."
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered?.map((activity) => (
                <VolunteerActivityCard
                  key={activity._id}
                  name={activity.name}
                  description={activity.description}
                  isActive={activity.isActive}
                  meta={
                    <p className="text-xs text-muted-foreground">
                      {activity.signupCount} member
                      {activity.signupCount === 1 ? "" : "s"} volunteered
                    </p>
                  }
                  footer={
                    <Button
                      type="button"
                      size="sm"
                      className="w-full"
                      onClick={() => setManageActivityId(activity._id)}
                    >
                      Manage
                    </Button>
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {manageActivity && (
        <ManageActivityDialog
          activity={manageActivity}
          open={manageActivityId !== null}
          onOpenChange={(open) => !open && setManageActivityId(null)}
        />
      )}
    </div>
  );
}
