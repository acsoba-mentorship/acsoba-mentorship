"use client";

import {
  CheckCircle2,
  Download,
  ExternalLink,
  MapPin,
  Trash2,
  XCircle,
} from "lucide-react";
import type { FunctionReturnType } from "convex/server";
import type { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

  return <Badge className="border-0 bg-red-50 text-red-700">Cancelled</Badge>;
}

function CalendarActions({ event }: { event: CalendarEventDetails }) {
  const links = buildExternalCalendarLinks(event);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          Add to Calendar
          <ExternalLink className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-48">
        {links.map((link) => (
          <DropdownMenuItem key={link.provider} asChild>
            <a
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-4"
            >
              {link.provider}
              <ExternalLink className="size-3.5" />
            </a>
          </DropdownMenuItem>
        ))}

        <DropdownMenuItem asChild>
          <a
            href={buildIcsDataUri(event)}
            download={buildIcsFileName(event)}
            className="flex items-center justify-between gap-4"
          >
            Download ICS
            <Download className="size-3.5" />
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function MeetingCard({
  meeting,
  onCancel,
  onDelete,
  onComplete,
  isUpdating,
  canManageMeetings,
}: {
  meeting: MentorshipMeeting;
  onCancel: (meetingId: Id<"mentorshipMeetings">) => void;
  onDelete: (meetingId: Id<"mentorshipMeetings">) => void;
  onComplete: (meetingId: Id<"mentorshipMeetings">) => void;
  isUpdating: boolean;
  canManageMeetings: boolean;
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

        <div className="flex flex-wrap gap-2">
          {canManageMeetings && meeting.status === "scheduled" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUpdating}
              onClick={() => onComplete(meeting._id)}
              className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
            >
              <CheckCircle2 className="size-4" />
              Complete
            </Button>
          )}

          {canManageMeetings && meeting.status === "scheduled" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUpdating}
              onClick={() => {
                if (window.confirm("Cancel this meeting?")) {
                  onCancel(meeting._id);
                }
              }}
              className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
            >
              <XCircle className="size-4" />
              Cancel
            </Button>
          )}

          {canManageMeetings && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUpdating}
              onClick={() => {
                if (window.confirm("Delete this meeting?")) {
                  onDelete(meeting._id);
                }
              }}
              className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          )}

        </div>
      </div>

      {meeting.status === "scheduled" && (
        <div className="mt-4 min-h-44 border-t pt-4">
          <CalendarActions event={event} />
        </div>
      )}
    </div>
  );
}
