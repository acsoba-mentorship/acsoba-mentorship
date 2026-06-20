"use client";

import {
  CheckCircle2,
  Download,
  ExternalLink,
  MapPin,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

  return <Badge className="border-0 bg-red-50 text-red-700">Cancelled</Badge>;
}

function CalendarActions({ event }: { event: CalendarEventDetails }) {
  const links = buildExternalCalendarLinks(event);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  function handleOpen() {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpen(true);
  }

  function handleClose() {
    // Small grace period so moving the cursor from the trigger to the
    // portal-rendered menu (which lives outside this DOM subtree) doesn't
    // get treated as "left the menu area" and close it prematurely.
    closeTimeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 150);
  }

  useEffect(() => {
    if (!open || !triggerRef.current) return;

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const menuWidth = 192; // matches min-w-48
      const gap = 8;
      const viewportWidth = window.innerWidth;

      // Prefer opening to the right of the button. If there isn't enough
      // room before the edge of the viewport, fall back to the left side
      // instead of letting it overflow off-screen.
      const spaceOnRight = viewportWidth - rect.right;
      const openToRight = spaceOnRight >= menuWidth + gap;

      const left = openToRight
        ? rect.right + gap
        : Math.max(gap, rect.left - menuWidth - gap);

      const top = rect.top + rect.height / 2;

      setMenuStyle({ top, left });
    };

    updatePosition();

    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  return (
    <div
      ref={triggerRef}
      className="relative inline-flex w-fit"
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
    >
      <Button type="button" variant="outline" size="sm">
        Add to Calendar
        <ExternalLink className="size-3.5" />
      </Button>

      {open &&
        mounted &&
        createPortal(
          <div
            className="fixed z-50 min-w-48 -translate-y-1/2 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
            style={{ top: menuStyle.top, left: menuStyle.left }}
            onMouseEnter={handleOpen}
            onMouseLeave={handleClose}
          >
            {links.map((link) => (
              <a
                key={link.provider}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
              >
                {link.provider}
                <ExternalLink className="size-3.5" />
              </a>
            ))}

            <a
              href={buildIcsDataUri(event)}
              download={buildIcsFileName(event)}
              className="flex items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
            >
              Download ICS
              <Download className="size-3.5" />
            </a>
          </div>,
          document.body
        )}
    </div>
  );
}

export function MeetingCard({
  meeting,
  onDelete,
  onComplete,
  isUpdating,
}: {
  meeting: MentorshipMeeting;
  onDelete: (meetingId: Id<"mentorshipMeetings">) => void;
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

        <div className="flex flex-wrap gap-2">
          {meeting.status === "scheduled" && (
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
          )}

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
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
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