"use client";

import { type ReactNode, useMemo, useState } from "react";
import type { FunctionReturnType } from "convex/server";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  CalendarPlus,
  CheckCircle2,
  Download,
  ExternalLink,
  MapPin,
  XCircle,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  buildExternalCalendarLinks,
  buildIcsDataUri,
  buildIcsFileName,
  type CalendarEventDetails,
} from "@/lib/calendar";
import { formatDateTime } from "@/lib/utils";

type MentorshipMeeting = FunctionReturnType<
  typeof api.mentorshipMeetings.listByMentorship
>[number];

const DURATION_OPTIONS = [
  { label: "30 minutes", value: "30" },
  { label: "45 minutes", value: "45" },
  { label: "1 hour", value: "60" },
  { label: "1.5 hours", value: "90" },
  { label: "2 hours", value: "120" },
];

function getDefaultStartValue() {
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setDate(now.getDate() + 1);
  nextHour.setMinutes(0, 0, 0);

  return toDatetimeLocalValue(nextHour.getTime());
}

function toDatetimeLocalValue(timestamp: number) {
  const date = new Date(timestamp);
  const timezoneOffset = date.getTimezoneOffset() * 60 * 1000;

  return new Date(timestamp - timezoneOffset).toISOString().slice(0, 16);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

function buildEventFromMeeting(meeting: MentorshipMeeting): CalendarEventDetails {
  return {
    title: meeting.title,
    description: meeting.description,
    location: meeting.location,
    startAt: meeting.startAt,
    endAt: meeting.endAt,
  };
}

function MeetingCalendarActions({ event }: { event: CalendarEventDetails }) {
  const links = buildExternalCalendarLinks(event);

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => (
        <Button key={link.provider} asChild variant="outline" size="sm">
          <a href={link.href} target="_blank" rel="noreferrer">
            {link.provider}
            <ExternalLink className="size-3.5" />
          </a>
        </Button>
      ))}

      <Button asChild variant="outline" size="sm">
        <a href={buildIcsDataUri(event)} download={buildIcsFileName(event)}>
          ICS
          <Download className="size-3.5" />
        </a>
      </Button>
    </div>
  );
}

function MeetingStatusBadge({ status }: { status: MentorshipMeeting["status"] }) {
  if (status === "scheduled") {
    return <Badge className="border-0 bg-blue-50 text-blue-700">Scheduled</Badge>;
  }

  if (status === "completed") {
    return (
      <Badge className="border-0 bg-emerald-50 text-emerald-700">
        Completed
      </Badge>
    );
  }

  return <Badge variant="secondary">Cancelled</Badge>;
}

export function ScheduleMeetingDialog({
  mentorshipId,
  participantName,
  children,
}: {
  mentorshipId: Id<"mentorships">;
  participantName?: string | null;
  children?: ReactNode;
}) {
  const createMeeting = useMutation(api.mentorshipMeetings.createMeeting);
  const defaultTitle = `Mentoring session${
    participantName ? ` with ${participantName}` : ""
  }`;

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startValue, setStartValue] = useState(getDefaultStartValue);
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [createdEvent, setCreatedEvent] = useState<CalendarEventDetails | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetForm() {
    setTitle(defaultTitle);
    setDescription("");
    setLocation("");
    setStartValue(getDefaultStartValue());
    setDurationMinutes("60");
    setCreatedEvent(null);
    setErrorMessage(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen) {
      resetForm();
    }
  }

  async function handleSubmit() {
    setErrorMessage(null);

    const trimmedTitle = title.trim();
    const startAt = new Date(startValue).getTime();
    const duration = Number(durationMinutes);

    if (!trimmedTitle) {
      setErrorMessage("Please add a meeting title.");
      return;
    }

    if (!Number.isFinite(startAt)) {
      setErrorMessage("Please choose a valid meeting date and time.");
      return;
    }

    if (!Number.isFinite(duration) || duration <= 0) {
      setErrorMessage("Please choose a valid meeting duration.");
      return;
    }

    const endAt = startAt + duration * 60 * 1000;

    setIsSubmitting(true);

    try {
      await createMeeting({
        mentorshipId,
        title: trimmedTitle,
        description: description || undefined,
        location: location || undefined,
        startAt,
        endAt,
      });

      setCreatedEvent({
        title: trimmedTitle,
        description: description || undefined,
        location: location || undefined,
        startAt,
        endAt,
      });
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children ?? (
          <Button type="button" size="sm">
            <CalendarPlus className="size-4" />
            Schedule Meeting
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Schedule mentoring session</DialogTitle>
          <DialogDescription>
            Save the session to this mentorship and add it to an external
            calendar.
          </DialogDescription>
        </DialogHeader>

        {createdEvent ? (
          <div className="space-y-4">
            <Alert>
              <CheckCircle2 className="size-4" />
              <AlertDescription>
                Meeting saved for {formatDateTime(createdEvent.startAt)}. Add it
                to your preferred calendar below.
              </AlertDescription>
            </Alert>

            <MeetingCalendarActions event={createdEvent} />
          </div>
        ) : (
          <div className="space-y-4">
            {errorMessage && (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-2">
              <Label htmlFor="meeting-title">Title</Label>
              <Input
                id="meeting-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Mentoring session"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="meeting-start">Date and time</Label>
                <Input
                  id="meeting-start"
                  type="datetime-local"
                  value={startValue}
                  onChange={(event) => setStartValue(event.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label>Duration</Label>
                <Select
                  value={durationMinutes}
                  onValueChange={setDurationMinutes}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="meeting-location">Location or meeting link</Label>
              <Input
                id="meeting-location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Zoom link, Google Meet link, office, or school campus"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="meeting-description">Notes</Label>
              <Textarea
                id="meeting-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Optional agenda or preparation notes"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {createdEvent ? (
            <Button type="button" onClick={() => setOpen(false)}>
              Done
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !title.trim()}
            >
              {isSubmitting ? "Saving..." : "Save Meeting"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MeetingCard({
  meeting,
  onCancel,
  onComplete,
  isUpdating,
}: {
  meeting: MentorshipMeeting;
  onCancel: (meetingId: Id<"mentorshipMeetings">) => void;
  onComplete: (meetingId: Id<"mentorshipMeetings">) => void;
  isUpdating: boolean;
}) {
  const event = buildEventFromMeeting(meeting);

  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium">{meeting.title}</h3>
            <MeetingStatusBadge status={meeting.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDateTime(meeting.startAt)} – {formatDateTime(meeting.endAt)}
          </p>
          {meeting.location && (
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="size-4" />
              {meeting.location}
            </p>
          )}
          {meeting.description && (
            <p className="mt-2 text-sm text-muted-foreground">
              {meeting.description}
            </p>
          )}
        </div>

        {meeting.status === "scheduled" && (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUpdating}
              onClick={() => onComplete(meeting._id)}
            >
              <CheckCircle2 className="size-4" />
              Complete
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUpdating}
              onClick={() => onCancel(meeting._id)}
            >
              <XCircle className="size-4" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      {meeting.status === "scheduled" && (
        <div className="mt-4 border-t pt-4">
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            Add to calendar
          </p>
          <MeetingCalendarActions event={event} />
        </div>
      )}
    </div>
  );
}

export function MentorshipMeetingsPanel({
  mentorshipId,
  participantName,
}: {
  mentorshipId: Id<"mentorships">;
  participantName?: string | null;
}) {
  const meetings = useQuery(api.mentorshipMeetings.listByMentorship, {
    mentorshipId,
  }) as MentorshipMeeting[] | undefined;
  const cancelMeeting = useMutation(api.mentorshipMeetings.cancelMeeting);
  const completeMeeting = useMutation(api.mentorshipMeetings.completeMeeting);

  const [updatingMeetingIds, setUpdatingMeetingIds] = useState<
    Set<Id<"mentorshipMeetings">>
  >(new Set());

  const scheduledMeetings = useMemo<MentorshipMeeting[]>(() => {
    return (
      meetings
        ?.filter((meeting) => meeting.status === "scheduled")
        .sort((a, b) => a.startAt - b.startAt) ?? []
    );
  }, [meetings]);

  const meetingHistory = useMemo<MentorshipMeeting[]>(() => {
    return (
      meetings
        ?.filter((meeting) => meeting.status !== "scheduled")
        .sort((a, b) => b.updatedAt - a.updatedAt) ?? []
    );
  }, [meetings]);

  async function withMeetingUpdate(
    meetingId: Id<"mentorshipMeetings">,
    update: () => Promise<unknown>
  ) {
    setUpdatingMeetingIds((current) => new Set(current).add(meetingId));

    try {
      await update();
    } finally {
      setUpdatingMeetingIds((current) => {
        const next = new Set(current);
        next.delete(meetingId);
        return next;
      });
    }
  }

  if (meetings === undefined) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Meetings</CardTitle>
            <CardDescription>
              Schedule mentoring sessions and add them to external calendars.
            </CardDescription>
          </div>

          <ScheduleMeetingDialog
            mentorshipId={mentorshipId}
            participantName={participantName}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold">Scheduled Sessions</h3>
            <p className="text-xs text-muted-foreground">
              Upcoming sessions for this active mentorship.
            </p>
          </div>

          {scheduledMeetings.length === 0 ? (
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No sessions scheduled yet.
            </p>
          ) : (
            scheduledMeetings.map((meeting) => (
              <MeetingCard
                key={meeting._id}
                meeting={meeting}
                isUpdating={updatingMeetingIds.has(meeting._id)}
                onCancel={(meetingId) =>
                  withMeetingUpdate(meetingId, () => cancelMeeting({ meetingId }))
                }
                onComplete={(meetingId) =>
                  withMeetingUpdate(meetingId, () =>
                    completeMeeting({ meetingId })
                  )
                }
              />
            ))
          )}
        </div>

        <div className="space-y-3 border-t pt-4">
          <div>
            <h3 className="text-sm font-semibold">Meeting History</h3>
            <p className="text-xs text-muted-foreground">
              Completed and cancelled sessions are retained for reference.
            </p>
          </div>

          {meetingHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No meeting history yet.
            </p>
          ) : (
            meetingHistory.map((meeting) => (
              <MeetingCard
                key={meeting._id}
                meeting={meeting}
                isUpdating={updatingMeetingIds.has(meeting._id)}
                onCancel={(meetingId) =>
                  withMeetingUpdate(meetingId, () => cancelMeeting({ meetingId }))
                }
                onComplete={(meetingId) =>
                  withMeetingUpdate(meetingId, () =>
                    completeMeeting({ meetingId })
                  )
                }
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
