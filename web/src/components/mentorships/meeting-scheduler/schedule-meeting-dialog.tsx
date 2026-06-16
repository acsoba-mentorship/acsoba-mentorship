"use client";

import { type ReactNode, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  AlertTriangle,
  CalendarPlus,
  CheckCircle2,
  Download,
  ExternalLink,
} from "lucide-react";
import type { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import {
  buildExternalCalendarLinks,
  buildIcsDataUri,
  buildIcsFileName,
  type CalendarEventDetails,
} from "@/lib/calendar";
import { formatDateTime } from "@/lib/utils";

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

  const timezoneOffset = nextHour.getTimezoneOffset() * 60 * 1000;
  return new Date(nextHour.getTime() - timezoneOffset)
    .toISOString()
    .slice(0, 16);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

function CalendarActions({ event }: { event: CalendarEventDetails }) {
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
  const existingMeetings = useQuery(api.mentorshipMeetings.listForCurrentUser);

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

  const draftStartAt = useMemo(() => {
    return new Date(startValue).getTime();
  }, [startValue]);

  const draftEndAt = useMemo(() => {
    const duration = Number(durationMinutes);

    if (!Number.isFinite(draftStartAt) || !Number.isFinite(duration)) {
      return Number.NaN;
    }

    return draftStartAt + duration * 60 * 1000;
  }, [draftStartAt, durationMinutes]);

  const conflictingMeetings = useMemo(() => {
    if (
      !existingMeetings ||
      !Number.isFinite(draftStartAt) ||
      !Number.isFinite(draftEndAt)
    ) {
      return [];
    }

    return existingMeetings.filter((meeting) => {
      if (meeting.status !== "scheduled") {
        return false;
      }

      return draftStartAt < meeting.endAt && meeting.startAt < draftEndAt;
    });
  }, [draftEndAt, draftStartAt, existingMeetings]);

  const isPastMeeting = Number.isFinite(draftStartAt) && draftStartAt < Date.now();

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

            <CalendarActions event={createdEvent} />
          </div>
        ) : (
          <div className="space-y-4">
            {errorMessage && (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {conflictingMeetings.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="size-4" />
                <AlertDescription>
                  This meeting overlaps with{" "}
                  {conflictingMeetings.length === 1
                    ? `"${conflictingMeetings[0].title}"`
                    : `${conflictingMeetings.length} existing meetings`}
                  .
                </AlertDescription>
              </Alert>
            )}

            {isPastMeeting && (
              <Alert variant="destructive">
                <AlertTriangle className="size-4" />
                <AlertDescription>
                  This meeting starts in the past.
                </AlertDescription>
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