"use client";

import { CheckCircle2, Download, ExternalLink, MapPin, XCircle } from "lucide-react";
import type { FunctionReturnType } from "convex/server";
import type { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

function MeetingStatusBadge({
  status,
}: {
  status: MentorshipMeeting["status"];
}) {
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

export function MeetingCard({
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
  const event: CalendarEventDetails = {
    title: meeting.title,
    description: meeting.description,
    location: meeting.location,
    startAt: meeting.startAt,
    endAt: meeting.endAt,
  };

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
          <CalendarActions event={event} />
        </div>
      )}
    </div>
  );
}