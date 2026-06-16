"use client";

import Link from "next/link";
import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { CalendarClock, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";

export type MentorshipTimelineStatus =
  | "scheduled"
  | "completed"
  | "cancelled";

export type MentorshipTimelineRole = "mentor" | "mentee";

export type MentorshipTimelineItem = {
  id: string;
  title: string;
  startAt: number;
  endAt: number;
  status: MentorshipTimelineStatus;
  href?: string;
  viewerRole?: MentorshipTimelineRole;
  counterpartName?: string | null;
};

const DEFAULT_TIMELINE_START_HOUR = 9;
const DEFAULT_TIMELINE_END_HOUR = 18;
const TIMELINE_MIN_HOUR = 0;
const TIMELINE_MAX_HOUR = 24;
const TIMELINE_GUTTER_HOURS = 1;

const DAY_COLUMN_WIDTH = 160;
const BASE_HOUR_WIDTH = 128;
const ROW_HEIGHT = 56;
const HEADER_HEIGHT = 44;
const SLOT_HEIGHT = 34;
const SLOT_TOP = 11;
const MIN_SLOT_WIDTH = 76;

type TimelineRoleFilter = "both" | "mentor" | "mentee";
type TimelineLayoutItem = {
  meeting: MentorshipTimelineItem;
  lane: number;
};


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
    year: "numeric",
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

function getTimelineBounds(meetings: MentorshipTimelineItem[]) {
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

function getStatusStyles(status: MentorshipTimelineStatus) {
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

function getStatusLabel(status: MentorshipTimelineStatus) {
  if (status === "scheduled") return "Scheduled";
  if (status === "completed") return "Completed";
  return "Cancelled";
}

function getMeetingStyle({
  meeting,
  startHour,
  hourWidth,
}: {
  meeting: MentorshipTimelineItem;
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

function groupMeetingsByDate(meetings: MentorshipTimelineItem[]) {
  return meetings.reduce<
    Array<{
      dateKey: string;
      dayStart: number;
      meetings: MentorshipTimelineItem[];
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
function doMeetingsOverlap(
  first: MentorshipTimelineItem,
  second: MentorshipTimelineItem
) {
  return first.startAt < second.endAt && second.startAt < first.endAt;
}

function getTimelineLayoutItems(
  meetings: MentorshipTimelineItem[]
): TimelineLayoutItem[] {
  const sortedMeetings = [...meetings].sort((a, b) => {
    if (a.startAt !== b.startAt) {
      return a.startAt - b.startAt;
    }

    return a.endAt - b.endAt;
  });

  const laneMeetings: MentorshipTimelineItem[][] = [];

  return sortedMeetings.map((meeting) => {
    const reusableLaneIndex = laneMeetings.findIndex((lane) =>
      lane.every((existingMeeting) => !doMeetingsOverlap(existingMeeting, meeting))
    );

    const lane =
      reusableLaneIndex === -1 ? laneMeetings.length : reusableLaneIndex;

    if (!laneMeetings[lane]) {
      laneMeetings[lane] = [];
    }

    laneMeetings[lane].push(meeting);

    return {
      meeting,
      lane,
    };
  });
}

function TimelineMeetingSlot({
  meeting,
  startHour,
  hourWidth,
  index,
}: {
  meeting: MentorshipTimelineItem;
  startHour: number;
  hourWidth: number;
  index: number;
}) {
  const status = getStatusStyles(meeting.status);

  const content = (
    <div className="flex h-full min-w-0 flex-col justify-center">
      <p
        className={cn(
          "truncate text-[11px] font-semibold leading-none",
          status.text
        )}
      >
        {meeting.title}
      </p>

      <div className="mt-1 flex min-w-0 items-center gap-0.5 text-[10px] leading-none text-slate-300">
        <Clock3 className="size-2.5 shrink-0" />
        <span className="shrink-0">{formatTime(meeting.startAt)}</span>
        <span className="text-slate-600">•</span>
        <span className="truncate">{getStatusLabel(meeting.status)}</span>

        {meeting.counterpartName && (
          <>
            <span className="text-slate-600">•</span>
            <span className="truncate">{meeting.counterpartName}</span>
          </>
        )}
      </div>
    </div>
  );

  const className = cn(
    "absolute overflow-hidden rounded border-l-4 bg-slate-900/95 px-1.5 py-1 shadow-sm ring-1 ring-slate-800/80 transition",
    meeting.href && "hover:bg-slate-800/95 hover:ring-slate-700",
    status.border
  );

  const style = {
    ...getMeetingStyle({
      meeting,
      startHour,
      hourWidth,
    }),
    top: SLOT_TOP + index * ROW_HEIGHT,
    height: SLOT_HEIGHT,
  };

  const title = `${meeting.title} • ${formatTime(meeting.startAt)}${
    meeting.counterpartName ? ` • ${meeting.counterpartName}` : ""
  }`;

  if (meeting.href) {
    return (
      <Link href={meeting.href} title={title} className={className} style={style}>
        {content}
      </Link>
    );
  }

  return (
    <div title={title} className={className} style={style}>
      {content}
    </div>
  );
}

export function MentorshipTimelineGrid({
  meetings,
  showRoleFilter = false,
}: {
  meetings: MentorshipTimelineItem[];
  showRoleFilter?: boolean;
}) {
  const [zoom, setZoom] = useState(100);
  const [now, setNow] = useState(Date.now());
  const [showFromTodayOnly, setShowFromTodayOnly] = useState(false);
  const [roleFilter, setRoleFilter] = useState<TimelineRoleFilter>("both");

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const todayStart = useMemo(() => getStartOfLocalDay(now), [now]);

  const mentorMeetingCount = useMemo(
    () => meetings.filter((meeting) => meeting.viewerRole === "mentor").length,
    [meetings]
  );

  const menteeMeetingCount = useMemo(
    () => meetings.filter((meeting) => meeting.viewerRole === "mentee").length,
    [meetings]
  );

  const roleFilteredMeetings = useMemo(() => {
    if (!showRoleFilter || roleFilter === "both") {
      return meetings;
    }

    return meetings.filter((meeting) => meeting.viewerRole === roleFilter);
  }, [meetings, roleFilter, showRoleFilter]);

  const visibleMeetings = useMemo(() => {
    const dateFilteredMeetings = showFromTodayOnly
      ? roleFilteredMeetings.filter(
          (meeting) => getStartOfLocalDay(meeting.startAt) >= todayStart
        )
      : roleFilteredMeetings;

    return [...dateFilteredMeetings].sort((a, b) => a.startAt - b.startAt);
  }, [roleFilteredMeetings, showFromTodayOnly, todayStart]);

  const { startHour, endHour } = useMemo(
    () => getTimelineBounds(visibleMeetings),
    [visibleMeetings]
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
    () => groupMeetingsByDate(visibleMeetings),
    [visibleMeetings]
  );

  const hourWidth = BASE_HOUR_WIDTH * (zoom / 100);
  const timelineWidth = hours.length * hourWidth;
  const totalWidth = DAY_COLUMN_WIDTH + timelineWidth;

  return (
    <div className="space-y-3 text-xs">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="mentorship-timeline-zoom"
            className="text-xs font-medium text-muted-foreground"
          >
            Zoom level
          </label>

          <span className="text-[11px] text-muted-foreground">{zoom}%</span>
        </div>

        <input
          id="mentorship-timeline-zoom"
          type="range"
          min="100"
          max="180"
          step="1"
          value={zoom}
          onChange={(event) => setZoom(Number(event.target.value))}
          className="h-1.5 w-full accent-blue-500"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {showRoleFilter && (
            <div className="inline-flex rounded-md border border-slate-800 bg-slate-950 p-1 text-[11px]">
              <button
                type="button"
                onClick={() => setRoleFilter("both")}
                className={cn(
                  "rounded px-2.5 py-1 font-medium transition",
                  roleFilter === "both"
                    ? "bg-blue-500 text-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Both
              </button>

              <button
                type="button"
                onClick={() => setRoleFilter("mentee")}
                className={cn(
                  "rounded px-2.5 py-1 font-medium transition",
                  roleFilter === "mentee"
                    ? "bg-blue-500 text-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                As mentee
                {menteeMeetingCount > 0 ? ` (${menteeMeetingCount})` : ""}
              </button>

              <button
                type="button"
                onClick={() => setRoleFilter("mentor")}
                className={cn(
                  "rounded px-2.5 py-1 font-medium transition",
                  roleFilter === "mentor"
                    ? "bg-blue-500 text-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                As mentor
                {mentorMeetingCount > 0 ? ` (${mentorMeetingCount})` : ""}
              </button>
            </div>
          )}

          <div className="inline-flex rounded-md border border-slate-800 bg-slate-950 p-1 text-[11px]">
            <button
              type="button"
              onClick={() => setShowFromTodayOnly(false)}
              className={cn(
                "rounded px-2.5 py-1 font-medium transition",
                !showFromTodayOnly
                  ? "bg-blue-500 text-white"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              All meetings
            </button>

            <button
              type="button"
              onClick={() => setShowFromTodayOnly(true)}
              className={cn(
                "rounded px-2.5 py-1 font-medium transition",
                showFromTodayOnly
                  ? "bg-blue-500 text-white"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              From today
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-blue-500" />
            Scheduled
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-yellow-400" />
            Completed
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-red-500" />
            Cancelled
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950 text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <CalendarClock className="size-3.5 text-slate-400" />
            Timeline view
          </div>

          <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px] text-slate-300">
            {visibleMeetings.length} meeting
            {visibleMeetings.length === 1 ? "" : "s"}
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
              <div className="sticky left-0 z-20 flex items-center border-r border-slate-800 bg-slate-950 px-4 text-xs font-semibold">
                Days
              </div>

              <div className="relative bg-slate-950">
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="absolute inset-y-0 flex items-center border-l border-slate-800 px-2 text-xs text-slate-400"
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

            {meetingsByDate.length === 0 ? (
              <div
                className="grid border-b border-slate-800 last:border-b-0"
                style={{
                  gridTemplateColumns: `${DAY_COLUMN_WIDTH}px ${timelineWidth}px`,
                }}
              >
                <div className="sticky left-0 z-10 border-r border-slate-800 bg-slate-950 px-4 py-3">
                  <p className="text-xs font-semibold text-slate-100">
                    No days
                  </p>
                </div>

                <div className="flex min-h-16 items-center bg-slate-950 px-4 text-[11px] text-slate-500">
                  No meetings to show for the selected filters.
                </div>
              </div>
            ) : (
              meetingsByDate.map((group) => {
                const layoutItems = getTimelineLayoutItems(group.meetings);
                const laneCount = Math.max(1, ...layoutItems.map((item) => item.lane + 1));

                const rowHeight = Math.max(ROW_HEIGHT, laneCount * ROW_HEIGHT);

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
                      className="sticky left-0 z-10 border-r border-slate-800 bg-slate-950 px-4 py-3"
                      style={{ minHeight: rowHeight }}
                    >
                      <p className="text-xs font-semibold text-slate-100">
                        {formatDay(group.dayStart)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
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
                          <span className="absolute -top-7 left-1/2 -translate-x-1/2 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-slate-100 shadow">
                            Now: {formatTime(now)}
                          </span>
                        </div>
                      )}

                      {layoutItems.map(({ meeting, lane }) => (
                        <TimelineMeetingSlot
                          key={meeting.id}
                          meeting={meeting}
                          startHour={startHour}
                          hourWidth={hourWidth}
                          index={lane}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}