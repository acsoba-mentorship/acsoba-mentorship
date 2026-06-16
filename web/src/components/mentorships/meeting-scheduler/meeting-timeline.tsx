"use client";

import { type CSSProperties, useMemo } from "react";
import { CalendarClock, Clock3 } from "lucide-react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";

type MentorshipMeeting = FunctionReturnType<
  typeof api.mentorshipMeetings.listByMentorship
>[number];

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

function getStatusBadge(status: MentorshipMeeting["status"]) {
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

  return (
    <div className="overflow-hidden rounded-xl border bg-muted/20">
      <div className="flex items-center justify-between gap-3 border-b bg-background px-4 py-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CalendarClock className="size-4 text-muted-foreground" />
            Timeline view
          </div>
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
                    minHeight: `${Math.max(
                      7,
                      group.meetings.length * 4.75 + 0.75
                    )}rem`,
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
                            {formatTimelineTime(meeting.startAt)} -{" "}
                            {getDurationLabel(meeting.startAt, meeting.endAt)}
                          </p>
                        </div>

                        {getStatusBadge(meeting.status)}
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