"use client";

import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { CalendarClock, Clock3 } from "lucide-react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../../../convex/_generated/api";
import { cn } from "@/lib/utils";

type MentorshipMeeting = FunctionReturnType<
  typeof api.mentorshipMeetings.listByMentorship
>[number];

const DEFAULT_TIMELINE_START_HOUR = 9;
const DEFAULT_TIMELINE_END_HOUR = 18;
const TIMELINE_MIN_HOUR = 0;
const TIMELINE_MAX_HOUR = 24;
const TIMELINE_GUTTER_HOURS = 1;

const DAY_COLUMN_WIDTH = 188;
const BASE_HOUR_WIDTH = 188;
const ROW_HEIGHT = 76;
const HEADER_HEIGHT = 52;
const SLOT_HEIGHT = 52;
const SLOT_TOP = 12;
const MIN_SLOT_WIDTH = 104;

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

function formatDay(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(timestamp));
}

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(timestamp));
}

function formatHour(hour: number) {
  return `${hour}:00`;
}

function getDurationMinutes(startAt: number, endAt: number) {
  return Math.max(15, Math.round((endAt - startAt) / 60000));
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

function getStatusStyles(status: MentorshipMeeting["status"]) {
  if (status === "scheduled") {
    return {
      dot: "bg-blue-500",
      border: "border-l-blue-500",
      text: "text-blue-400",
    };
  }

  if (status === "completed") {
    return {
      dot: "bg-yellow-400",
      border: "border-l-yellow-400",
      text: "text-yellow-300",
    };
  }

  return {
    dot: "bg-red-500",
    border: "border-l-red-500",
    text: "text-red-400",
  };
}

function getStatusLabel(status: MentorshipMeeting["status"]) {
  if (status === "scheduled") return "Scheduled";
  if (status === "completed") return "Completed";
  return "Cancelled";
}

function getMeetingStyle({
  meeting,
  startHour,
  hourWidth,
}: {
  meeting: MentorshipMeeting;
  startHour: number;
  hourWidth: number;
}): CSSProperties {
  const dayStart = getStartOfLocalDay(meeting.startAt);
  const timelineStart = dayStart + startHour * 60 * 60 * 1000;

  const startOffsetMinutes = Math.max(
    0,
    Math.round((meeting.startAt - timelineStart) / 60000)
  );

  const durationMinutes = getDurationMinutes(meeting.startAt, meeting.endAt);

  return {
    left: (startOffsetMinutes / 60) * hourWidth,
    width: Math.max(MIN_SLOT_WIDTH, (durationMinutes / 60) * hourWidth),
  };
}

function getNowPosition({
  dayStart,
  startHour,
  endHour,
  hourWidth,
  now,
}: {
  dayStart: number;
  startHour: number;
  endHour: number;
  hourWidth: number;
  now: number;
}) {
  if (getLocalDateKey(now) !== getLocalDateKey(dayStart)) {
    return null;
  }

  const timelineStart = dayStart + startHour * 60 * 60 * 1000;
  const timelineEnd = dayStart + endHour * 60 * 60 * 1000;

  if (now < timelineStart || now > timelineEnd) {
    return null;
  }

  return ((now - timelineStart) / (60 * 60 * 1000)) * hourWidth;
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
  const [zoom, setZoom] = useState(100);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 60_000);
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

  const meetingsByDate = useMemo(
    () => groupMeetingsByDate(meetings),
    [meetings]
  );

  const hourWidth = BASE_HOUR_WIDTH * (zoom / 100);
  const timelineWidth = hours.length * hourWidth;
  const totalWidth = DAY_COLUMN_WIDTH + timelineWidth;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
            <label
            htmlFor="meeting-timeline-zoom"
            className="text-sm font-medium text-muted-foreground"
            >
            Zoom level
            </label>

            <span className="text-xs text-muted-foreground">{zoom}%</span>
        </div>

        <input
            id="meeting-timeline-zoom"
            type="range"
            min="60"
            max="180"
            step="1"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="h-2 w-full accent-blue-500"
        />
        </div>

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-blue-500" />
          Scheduled
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-emerald-500" />
          Completed
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-red-500" />
          Cancelled
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950 text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
            <CalendarClock className="size-4 text-slate-400" />
            Timeline view
            </div>

            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs text-slate-300">
            {meetings.length} meeting{meetings.length === 1 ? "" : "s"}
            </span>
        </div>

        <div className="overflow-x-auto">
            <div className="relative" style={{ width: totalWidth }}>
            <div
                className="grid border-b border-slate-800"
                style={{
                gridTemplateColumns: `${DAY_COLUMN_WIDTH}px ${timelineWidth}px`,
                height: HEADER_HEIGHT,
                }}
            >
                <div className="sticky left-0 z-20 flex items-center border-r border-slate-800 bg-slate-950 px-5 text-sm font-semibold">
                Days
                </div>

                <div className="relative bg-slate-950">
                {hours.map((hour) => (
                    <div
                    key={hour}
                    className="absolute inset-y-0 flex items-center border-l border-slate-800 px-3 text-sm text-slate-400"
                    style={{
                        left: (hour - startHour) * hourWidth,
                        width: hourWidth,
                    }}
                    >
                    {formatHour(hour)}
                    </div>
                ))}
                </div>
            </div>

            {meetingsByDate.map((group) => {
                const rowHeight = Math.max(
                ROW_HEIGHT,
                group.meetings.length * ROW_HEIGHT
                );

                const nowPosition = getNowPosition({
                dayStart: group.dayStart,
                startHour,
                endHour,
                hourWidth,
                now,
                });

                return (
                <div
                    key={group.dateKey}
                    className="grid border-b border-slate-800 last:border-b-0"
                    style={{
                    gridTemplateColumns: `${DAY_COLUMN_WIDTH}px ${timelineWidth}px`,
                    }}
                >
                    <div
                    className="sticky left-0 z-10 border-r border-slate-800 bg-slate-950 px-5 py-4"
                    style={{ minHeight: rowHeight }}
                    >
                    <p className="text-sm font-semibold text-slate-100">
                        {formatDay(group.dayStart)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                        {group.meetings.length} session
                        {group.meetings.length === 1 ? "" : "s"}
                    </p>
                    </div>

                    <div
                    className="relative bg-slate-950"
                    style={{
                        width: timelineWidth,
                        minHeight: rowHeight,
                    }}
                    >
                    {hours.map((hour) => (
                        <div
                        key={hour}
                        className="absolute inset-y-0 border-l border-slate-800"
                        style={{
                            left: (hour - startHour) * hourWidth,
                            width: hourWidth,
                        }}
                        />
                    ))}

                    {hours.flatMap((hour) =>
                        [15, 30, 45].map((minute) => (
                        <div
                            key={`${hour}-${minute}`}
                            className="absolute inset-y-0 border-l border-slate-900"
                            style={{
                            left:
                                (hour - startHour) * hourWidth +
                                (minute / 60) * hourWidth,
                            }}
                        />
                        ))
                    )}

                    {nowPosition !== null && (
                        <div
                        className="absolute bottom-0 top-0 z-30 w-px bg-blue-300/70"
                        style={{ left: nowPosition }}
                        >
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-100 shadow">
                            Now: {formatTime(now)}
                        </span>
                        </div>
                    )}

                    {group.meetings.map((meeting, index) => {
                        const status = getStatusStyles(meeting.status);

                        return (
                        <div
                            key={meeting._id}
                            title={`${meeting.title} • ${formatTime(meeting.startAt)}`}
                            className={cn(
                            "absolute overflow-hidden rounded-md border-l-4 bg-slate-900/95 px-3 shadow-sm ring-1 ring-slate-800/80",
                            status.border
                            )}
                            style={{
                            ...getMeetingStyle({
                                meeting,
                                startHour,
                                hourWidth,
                            }),
                            top: SLOT_TOP + index * ROW_HEIGHT,
                            height: SLOT_HEIGHT,
                            }}
                        >
                            <div className="flex h-full min-w-0 flex-col justify-center">
                            <p
                                className={cn(
                                "truncate text-sm font-semibold leading-tight",
                                status.text
                                )}
                            >
                                {meeting.title}
                            </p>

                            <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs leading-none text-slate-300">
                                <Clock3 className="size-3.5 shrink-0" />
                                <span className="shrink-0">
                                {formatTime(meeting.startAt)}
                                </span>
                                <span className="text-slate-600">•</span>
                                <span className="truncate">
                                {getStatusLabel(meeting.status)}
                                </span>
                            </div>
                            </div>
                        </div>
                        );
                    })}
                    </div>
                </div>
                );
            })}
            </div>
        </div>
        </div>
    </div>
  );
}