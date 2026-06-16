"use client";

import { type CSSProperties, type ReactNode, useMemo, useState } from "react";
import type { FunctionReturnType } from "convex/server";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  Download,
  ExternalLink,
  MapPin,
  Clock3,
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

const DEFAULT_TIMELINE_START_HOUR = 8;
const DEFAULT_TIMELINE_END_HOUR = 20;
const TIMELINE_MIN_HOUR = 0;
const TIMELINE_MAX_HOUR = 24;
const TIMELINE_GUTTER_HOURS = 1;

function getLocalDateKey(timestamp: number) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getStartOfLocalDay(timestamp: number) {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);

  return date.getTime();
}

function formatTimelineDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(timestamp));
}

function formatTimelineTime(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function formatTimelineHour(hour: number) {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
  }).format(date);
}

function getDurationLabel(startAt: number, endAt: number) {
  const durationMinutes = Math.max(0, Math.round((endAt - startAt) / 60000));

  if (durationMinutes < 60) {
    return `${durationMinutes}m`;
  }

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

function getTimelineBounds(meetings: MentorshipMeeting[]) {
  if (meetings.length === 0) {
    return {
      startHour: DEFAULT_TIMELINE_START_HOUR,
      endHour: DEFAULT_TIMELINE_END_HOUR,
    };
  }

  const earliestHour = Math.min(
    ...meetings.map((meeting) => new Date(meeting.startAt).getHours())
  );
  const latestEndHour = Math.max(
    ...meetings.map((meeting) => {
      const end = new Date(meeting.endAt);
      const hasMinutes = end.getMinutes() > 0 || end.getSeconds() > 0;

      return end.getHours() + (hasMinutes ? 1 : 0);
    })
  );

  return {
    startHour: Math.max(
      TIMELINE_MIN_HOUR,
      Math.min(DEFAULT_TIMELINE_START_HOUR, earliestHour - TIMELINE_GUTTER_HOURS)
    ),
    endHour: Math.min(
      TIMELINE_MAX_HOUR,
      Math.max(DEFAULT_TIMELINE_END_HOUR, latestEndHour + TIMELINE_GUTTER_HOURS)
    ),
  };
}

function getMeetingSlotStyle({
  meeting,
  startHour,
  endHour,
}: {
  meeting: MentorshipMeeting;
  startHour: number;
  endHour: number;
}): CSSProperties {
  const dayStart = getStartOfLocalDay(meeting.startAt);
  const rangeStart = dayStart + startHour * 60 * 60 * 1000;
  const totalMinutes = (endHour - startHour) * 60;
  const startOffsetMinutes = Math.max(0, (meeting.startAt - rangeStart) / 60000);
  const durationMinutes = Math.max(
    15,
    (meeting.endAt - meeting.startAt) / 60000
  );
  const left = Math.min(100, (startOffsetMinutes / totalMinutes) * 100);
  const width = Math.max(
    8,
    Math.min(100 - left, (durationMinutes / totalMinutes) * 100)
  );

  return {
    left: `${left}%`,
    width: `calc(${width}% - 0.5rem)`,
  };
}

function getCurrentTimeMarkerStyle({
  dayStart,
  startHour,
  endHour,
}: {
  dayStart: number;
  startHour: number;
  endHour: number;
}): CSSProperties | null {
  const now = Date.now();

  if (getLocalDateKey(now) !== getLocalDateKey(dayStart)) {
    return null;
  }

  const rangeStart = dayStart + startHour * 60 * 60 * 1000;
  const rangeEnd = dayStart + endHour * 60 * 60 * 1000;

  if (now < rangeStart || now > rangeEnd) {
    return null;
  }

  return {
    left: `${((now - rangeStart) / (rangeEnd - rangeStart)) * 100}%`,
  };
}

function MeetingTimeline({ meetings }: { meetings: MentorshipMeeting[] }) {
  const { startHour, endHour } = useMemo(
    () => getTimelineBounds(meetings),
    [meetings]
  );

  const hours = useMemo(
    () =>
      Array.from(
        { length: endHour - startHour },
        (_, index) => startHour + index
      ),
    [endHour, startHour]
  );

  const meetingsByDate = useMemo(() => {
    return meetings.reduce<
      Array<{ dateKey: string; dayStart: number; meetings: MentorshipMeeting[] }>
    >((groups, meeting) => {
      const dateKey = getLocalDateKey(meeting.startAt);
      const existingGroup = groups.find((group) => group.dateKey === dateKey);

      if (existingGroup) {
        existingGroup.meetings.push(meeting);
        return groups;
      }

      groups.push({
        dateKey,
        dayStart: getStartOfLocalDay(meeting.startAt),
        meetings: [meeting],
      });

      return groups;
    }, []);
  }, [meetings]);

  return (
    <div className="overflow-hidden rounded-xl border bg-muted/20">
      <div className="flex items-center justify-between gap-3 border-b bg-background px-4 py-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CalendarClock className="size-4 text-muted-foreground" />
            Timeline view
          </div>
          <p className="text-xs text-muted-foreground">
            A day-by-day view of scheduled mentoring slots.
          </p>
        </div>
        <Badge variant="secondary">{meetings.length} scheduled</Badge>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[8rem_1fr] border-b bg-muted/40 text-xs text-muted-foreground">
            <div className="border-r px-4 py-3 font-medium">Date</div>
            <div
              className="relative grid"
              style={{
                gridTemplateColumns: `repeat(${hours.length}, minmax(4.5rem, 1fr))`,
              }}
            >
              {hours.map((hour) => (
                <div key={hour} className="border-r px-2 py-3 last:border-r-0">
                  {formatTimelineHour(hour)}
                </div>
              ))}
            </div>
          </div>

          {meetingsByDate.map((group) => {
            const currentMarkerStyle = getCurrentTimeMarkerStyle({
              dayStart: group.dayStart,
              startHour,
              endHour,
            });

            return (
              <div
                key={group.dateKey}
                className="grid grid-cols-[8rem_1fr] border-b last:border-b-0"
              >
                <div className="border-r bg-background px-4 py-4">
                  <p className="text-sm font-medium">
                    {formatTimelineDate(group.dayStart)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {group.meetings.length} session
                    {group.meetings.length === 1 ? "" : "s"}
                  </p>
                </div>

                <div
                  className="relative bg-background"
                  style={{
                    minHeight: `${Math.max(7, group.meetings.length * 4.75 + 0.75)}rem`,
                  }}
                >
                  <div
                    className="absolute inset-0 grid"
                    style={{
                      gridTemplateColumns: `repeat(${hours.length}, minmax(4.5rem, 1fr))`,
                    }}
                  >
                    {hours.map((hour) => (
                      <div key={hour} className="border-r last:border-r-0" />
                    ))}
                  </div>

                  {currentMarkerStyle && (
                    <div
                      className="absolute bottom-2 top-2 z-20 w-px bg-primary"
                      style={currentMarkerStyle}
                    >
                      <span className="absolute -top-2 left-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                        Now
                      </span>
                    </div>
                  )}

                  {group.meetings.map((meeting, index) => (
                    <div
                      key={meeting._id}
                      className="absolute z-10 rounded-lg border bg-card p-3 shadow-sm"
                      style={{
                        ...getMeetingSlotStyle({ meeting, startHour, endHour }),
                        top: `${0.75 + index * 4.75}rem`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {meeting.title}
                          </p>
                          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock3 className="size-3" />
                            {formatTimelineTime(meeting.startAt)} - {getDurationLabel(
                              meeting.startAt,
                              meeting.endAt
                            )}
                          </p>
                        </div>
                        <MeetingStatusBadge status={meeting.status} />
                      </div>
                      {meeting.location && (
                        <p className="mt-2 truncate text-xs text-muted-foreground">
                          {meeting.location}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
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
  });
  const cancelMeeting = useMutation(api.mentorshipMeetings.cancelMeeting);
  const completeMeeting = useMutation(api.mentorshipMeetings.completeMeeting);

  const [updatingMeetingIds, setUpdatingMeetingIds] = useState<
    Set<Id<"mentorshipMeetings">>
  >(new Set());

  const scheduledMeetings = useMemo(() => {
    return (
      meetings
        ?.filter((meeting) => meeting.status === "scheduled")
        .sort((a, b) => a.startAt - b.startAt) ?? []
    );
  }, [meetings]);

  const meetingHistory = useMemo(() => {
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
            <div className="space-y-4">
              <MeetingTimeline meetings={scheduledMeetings} />

              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Session details
                </h4>
                {scheduledMeetings.map((meeting) => (
                  <MeetingCard
                    key={meeting._id}
                    meeting={meeting}
                    isUpdating={updatingMeetingIds.has(meeting._id)}
                    onCancel={(meetingId) =>
                      withMeetingUpdate(meetingId, () =>
                        cancelMeeting({ meetingId })
                      )
                    }
                    onComplete={(meetingId) =>
                      withMeetingUpdate(meetingId, () =>
                        completeMeeting({ meetingId })
                      )
                    }
                  />
                ))}
              </div>
            </div>
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
