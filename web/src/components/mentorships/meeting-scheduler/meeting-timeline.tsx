"use client";

import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { CalendarClock } from "lucide-react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type MentorshipMeeting = FunctionReturnType<
  typeof api.mentorshipMeetings.listByMentorship
>[number];

const DEFAULT_TIMELINE_START_HOUR = 8;
const DEFAULT_TIMELINE_END_HOUR = 20;
const TIMELINE_MIN_HOUR = 0;
const TIMELINE_MAX_HOUR = 24;
const TIMELINE_GUTTER_HOURS = 1;

const DATE_COLUMN_WIDTH = 128;
const HOUR_COLUMN_WIDTH = 96;
const ROW_HEIGHT = 56;
const MIN_SLOT_WIDTH = 64;

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
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(timestamp));
}

function formatTimelineHour(hour: number) {
  return `${hour}:00`;
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
      const hasPartialHour = end.getMinutes() > 0 || end.getSeconds() > 0;

      return end.getHours() + (hasPartialHour ? 1 : 0);
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

function getSlotStyle({
  meeting,
  startHour,
}: {
  meeting: MentorshipMeeting;
  startHour: number;
}): CSSProperties {
  const dayStart = getStartOfLocalDay(meeting.startAt);
  const timelineStart = dayStart + startHour * 60 * 60 * 1000;

  const startOffsetMinutes = Math.max(
    0,
    Math.round((meeting.startAt - timelineStart) / 60000)
  );

  const durationMinutes = Math.max(
    15,
    Math.round((meeting.endAt - meeting.startAt) / 60000)
  );

  const left = (startOffsetMinutes / 60) * HOUR_COLUMN_WIDTH;
  const width = Math.max(
    MIN_SLOT_WIDTH,
    (durationMinutes / 60) * HOUR_COLUMN_WIDTH
  );

  return {
    left,
    width,
  };
}

function getCurrentTimePosition({
  dayStart,
  startHour,
  endHour,
  now,
}: {
  dayStart: number;
  startHour: number;
  endHour: number;
  now: number;
}) {
  if (getLocalDateKey(now) !== getLocalDateKey(dayStart)) {
    return null;
  }

  const rangeStart = dayStart + startHour * 60 * 60 * 1000;
  const rangeEnd = dayStart + endHour * 60 * 60 * 1000;

  if (now < rangeStart || now > rangeEnd) {
    return null;
  }

  return ((now - rangeStart) / (60 * 60 * 1000)) * HOUR_COLUMN_WIDTH;
}

function getStatusClasses(status: MentorshipMeeting["status"]) {
  if (status === "scheduled") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (status === "completed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-muted bg-muted text-muted-foreground";
}

function getStatusLabel(status: MentorshipMeeting["status"]) {
  if (status === "completed") {
    return "Done";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function groupMeetingsByDate(meetings: MentorshipMeeting[]) {
  return meetings.reduce<
    Array<{
      dateKey: string;
      dayStart: number;
      meetings: MentorshipMeeting[];
    }>
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
}

export function MeetingTimeline({ meetings }: { meetings: MentorshipMeeting[] }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => window.clearInterval(interval);
  }, []);

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

  const meetingsByDate = useMemo(() => groupMeetingsByDate(meetings), [
    meetings,
  ]);

  const timelineWidth = hours.length * HOUR_COLUMN_WIDTH;
  const totalWidth = DATE_COLUMN_WIDTH + timelineWidth;

  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <CalendarClock className="size-4 text-muted-foreground" />
          Timeline view
        </div>

        <Badge variant="secondary" className="h-6 px-2 text-xs">
          {meetings.length} scheduled
        </Badge>
      </div>

      <div className="overflow-x-auto">
        <div className="relative" style={{ width: totalWidth }}>
          <div
            className="sticky top-0 z-10 grid h-11 border-b bg-background text-xs text-muted-foreground"
            style={{
              gridTemplateColumns: `${DATE_COLUMN_WIDTH}px ${timelineWidth}px`,
            }}
          >
            <div className="sticky left-0 z-20 flex items-center border-r bg-background px-3 font-medium">
              Date
            </div>

            <div className="relative">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="absolute inset-y-0 flex items-center border-l px-2"
                  style={{
                    left: (hour - startHour) * HOUR_COLUMN_WIDTH,
                    width: HOUR_COLUMN_WIDTH,
                  }}
                >
                  {formatTimelineHour(hour)}
                </div>
              ))}
            </div>
          </div>

          {meetingsByDate.map((group) => {
            const rowHeight = Math.max(
              ROW_HEIGHT,
              group.meetings.length * ROW_HEIGHT
            );

            const currentTimePosition = getCurrentTimePosition({
              dayStart: group.dayStart,
              startHour,
              endHour,
              now,
            });

            return (
              <div
                key={group.dateKey}
                className="grid border-b last:border-b-0"
                style={{
                  gridTemplateColumns: `${DATE_COLUMN_WIDTH}px ${timelineWidth}px`,
                }}
              >
                <div
                  className="sticky left-0 z-10 border-r bg-background px-3 py-3"
                  style={{ minHeight: rowHeight }}
                >
                  <p className="text-sm font-medium">
                    {formatTimelineDate(group.dayStart)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {group.meetings.length} session
                    {group.meetings.length === 1 ? "" : "s"}
                  </p>
                </div>

                <div
                  className="relative"
                  style={{
                    width: timelineWidth,
                    minHeight: rowHeight,
                  }}
                >
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className="absolute inset-y-0 border-l"
                      style={{
                        left: (hour - startHour) * HOUR_COLUMN_WIDTH,
                        width: HOUR_COLUMN_WIDTH,
                      }}
                    />
                  ))}

                  {hours.flatMap((hour) =>
                    [15, 30, 45].map((minute) => (
                      <div
                        key={`${hour}-${minute}`}
                        className="absolute inset-y-0 border-l border-border/30"
                        style={{
                          left:
                            (hour - startHour) * HOUR_COLUMN_WIDTH +
                            (minute / 60) * HOUR_COLUMN_WIDTH,
                        }}
                      />
                    ))
                  )}

                  {currentTimePosition !== null && (
                    <div
                      className="absolute bottom-1 top-1 z-20 w-0.5 bg-red-500"
                      style={{ left: currentTimePosition }}
                    >
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-medium text-white shadow-sm">
                        Now
                      </span>
                    </div>
                  )}

                  {group.meetings.map((meeting, index) => (
                    <div
                      key={meeting._id}
                      title={`${meeting.title} • ${formatTimelineTime(
                        meeting.startAt
                      )} • ${getDurationLabel(
                        meeting.startAt,
                        meeting.endAt
                      )}`}
                      className={cn(
                        "absolute inset-y-1 cursor-default overflow-hidden rounded-md border px-2 py-1.5 shadow-sm transition hover:ring-2 hover:ring-foreground/20",
                        getStatusClasses(meeting.status)
                      )}
                      style={{
                        ...getSlotStyle({ meeting, startHour }),
                        top: 6 + index * ROW_HEIGHT,
                        height: ROW_HEIGHT - 12,
                      }}
                    >
                      <div className="flex h-full flex-col justify-center">
                        <div className="flex items-center justify-between gap-1">
                          <p className="truncate text-xs font-medium">
                            {meeting.title}
                          </p>

                          <span className="shrink-0 rounded bg-background/70 px-1 py-0.5 text-[10px] font-medium">
                            {getStatusLabel(meeting.status)}
                          </span>
                        </div>

                        <p className="mt-0.5 truncate text-[11px] opacity-80">
                          {formatTimelineTime(meeting.startAt)} ·{" "}
                          {getDurationLabel(meeting.startAt, meeting.endAt)}
                        </p>
                      </div>
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