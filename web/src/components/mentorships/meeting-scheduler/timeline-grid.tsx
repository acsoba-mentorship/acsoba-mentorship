"use client";

import Link from "next/link";
import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
const ZOOM_PRESETS = [50, 75, 100, 150] as const;

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
      text: "text-blue-700",
    };
  }

  if (status === "completed") {
    return {
      dot: "bg-yellow-400",
      border: "border-l-yellow-400",
      text: "text-yellow-700",
    };
  }

  return {
    dot: "bg-red-500",
    border: "border-l-red-500",
    text: "text-red-700",
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
  timelineWidth,
}: {
  meeting: MentorshipTimelineItem;
  startHour: number;
  hourWidth: number;
  timelineWidth: number;
}): CSSProperties {
  const dayStart = getStartOfLocalDay(meeting.startAt);
  const timelineStart = dayStart + startHour * 60 * 60 * 1000;

  const startOffsetMinutes = Math.max(
    0,
    Math.round((meeting.startAt - timelineStart) / 60000)
  );

  const durationMinutes = getDurationMinutes(meeting.startAt, meeting.endAt);
  const left = (startOffsetMinutes / 60) * hourWidth;
  const durationWidth = (durationMinutes / 60) * hourWidth;
  const minimumReadableWidth = Math.min(MIN_SLOT_WIDTH, hourWidth);
  const availableWidth = Math.max(1, timelineWidth - left);

  return {
    left,
    width: Math.min(
      Math.max(minimumReadableWidth, durationWidth),
      availableWidth
    ),
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

function addLocalDays(timestamp: number, days: number) {
  const date = new Date(timestamp);
  date.setDate(date.getDate() + days);
  date.setHours(0, 0, 0, 0);

  return date.getTime();
}

function getStartOfLocalWeek(timestamp: number) {
  const date = new Date(timestamp);
  const day = date.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - daysSinceMonday);
  date.setHours(0, 0, 0, 0);

  return date.getTime();
}

function formatWeekRange(weekStart: number) {
  const weekEnd = addLocalDays(weekStart, 6);
  const formatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  });

  const year = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
  }).format(new Date(weekEnd));

  return `${formatter.format(new Date(weekStart))} - ${formatter.format(
    new Date(weekEnd)
  )}, ${year}`;
}

type TimelineDayGroup = {
  dateKey: string;
  dayStart: number;
  meetings: MentorshipTimelineItem[];
};

type TimelineWeekGroup = {
  weekKey: string;
  weekStart: number;
  days: TimelineDayGroup[];
};

function buildTimelineWeek(
  meetings: MentorshipTimelineItem[],
  weekStart: number
): TimelineWeekGroup {
  const meetingsByDate = new Map<string, MentorshipTimelineItem[]>();

  meetings.forEach((meeting) => {
    const dateKey = getLocalDateKey(meeting.startAt);
    const existingMeetings = meetingsByDate.get(dateKey) ?? [];

    meetingsByDate.set(dateKey, [...existingMeetings, meeting]);
  });

  const days = Array.from({ length: 7 }, (_, dayIndex) => {
    const dayStart = addLocalDays(weekStart, dayIndex);
    const dateKey = getLocalDateKey(dayStart);

    return {
      dateKey,
      dayStart,
      meetings: [...(meetingsByDate.get(dateKey) ?? [])].sort(
        (a, b) => a.startAt - b.startAt
      ),
    };
  });

  return {
    weekKey: getLocalDateKey(weekStart),
    weekStart,
    days,
  };
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
  timelineWidth,
  index,
}: {
  meeting: MentorshipTimelineItem;
  startHour: number;
  hourWidth: number;
  timelineWidth: number;
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

      <div className="mt-1 flex min-w-0 items-center gap-0.5 text-[10px] leading-none text-muted-foreground">
        <Clock3 className="size-2.5 shrink-0" />
        <span className="shrink-0">{formatTime(meeting.startAt)}</span>
        <span className="text-muted-foreground/60">•</span>
        <span className="truncate">{getStatusLabel(meeting.status)}</span>

        {meeting.counterpartName && (
          <>
            <span className="text-muted-foreground/60">•</span>
            <span className="truncate">{meeting.counterpartName}</span>
          </>
        )}
      </div>
    </div>
  );

  const className = cn(
    "absolute overflow-hidden rounded border-l-4 bg-card px-1.5 py-1 shadow-sm ring-1 ring-border transition",
    meeting.href && "hover:bg-muted/70",
    status.border
  );

  const style = {
    ...getMeetingStyle({
      meeting,
      startHour,
      hourWidth,
      timelineWidth,
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
  const [selectedWeekStart, setSelectedWeekStart] = useState(() =>
    getStartOfLocalWeek(Date.now())
  );
  const [roleFilter, setRoleFilter] = useState<TimelineRoleFilter>("both");
  const timelineScrollerRef = useRef<HTMLDivElement>(null);
  const [timelineScrollerWidth, setTimelineScrollerWidth] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const scroller = timelineScrollerRef.current;

    if (!scroller) {
      return;
    }

    const updateWidth = () => {
      setTimelineScrollerWidth(scroller.clientWidth);
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(scroller);

    return () => resizeObserver.disconnect();
  }, []);

  const currentWeekStart = useMemo(() => getStartOfLocalWeek(now), [now]);
  const selectedWeekEnd = useMemo(
    () => addLocalDays(selectedWeekStart, 7),
    [selectedWeekStart]
  );

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
    return roleFilteredMeetings
      .filter(
        (meeting) =>
          meeting.startAt >= selectedWeekStart && meeting.startAt < selectedWeekEnd
      )
      .sort((a, b) => a.startAt - b.startAt);
  }, [roleFilteredMeetings, selectedWeekEnd, selectedWeekStart]);

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

  const selectedWeek = useMemo(
    () => buildTimelineWeek(visibleMeetings, selectedWeekStart),
    [selectedWeekStart, visibleMeetings]
  );

  const requestedHourWidth = BASE_HOUR_WIDTH * (zoom / 100);
  const minimumTimelineWidth = Math.max(0, timelineScrollerWidth - DAY_COLUMN_WIDTH);
  const minimumHourWidth = hours.length > 0 ? minimumTimelineWidth / hours.length : 0;
  const hourWidth = Math.max(requestedHourWidth, minimumHourWidth);
  const timelineWidth = hours.length * hourWidth;
  const totalWidth = DAY_COLUMN_WIDTH + timelineWidth;
  const isCurrentWeek = selectedWeekStart === currentWeekStart;

  return (
    <div className="space-y-3 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {showRoleFilter && (
            <div className="inline-flex rounded-md border bg-muted p-1 text-[11px]">
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

          <div className="inline-flex items-center rounded-md border bg-background shadow-xs">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Previous week"
              onClick={() => setSelectedWeekStart((weekStart) => addLocalDays(weekStart, -7))}
            >
              <ChevronLeft className="size-3.5" />
            </Button>

            <div className="min-w-36 border-x px-3 py-1.5 text-center text-[11px] font-medium text-muted-foreground">
              {formatWeekRange(selectedWeekStart)}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Next week"
              onClick={() => setSelectedWeekStart((weekStart) => addLocalDays(weekStart, 7))}
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>

          <Button
            type="button"
            variant="outline"
            size="xs"
            disabled={isCurrentWeek}
            onClick={() => setSelectedWeekStart(currentWeekStart)}
          >
            This week
          </Button>
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

      <div className="overflow-hidden rounded-lg border bg-background text-foreground">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <CalendarClock className="size-3.5 text-muted-foreground" />
            Timeline view
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              {visibleMeetings.length} meeting
              {visibleMeetings.length === 1 ? "" : "s"}
            </span>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  className="gap-1.5"
                >
                  <Settings2 className="size-3.5" />
                  Settings
                </Button>
              </PopoverTrigger>

              <PopoverContent align="end" className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Timeline settings</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Adjust the timeline zoom without taking space away from the
                    calendar view.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="mentorship-timeline-zoom"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Zoom level
                    </label>

                    <span className="text-xs font-semibold">{zoom}%</span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {ZOOM_PRESETS.map((preset) => (
                      <Button
                        key={preset}
                        type="button"
                        variant={zoom === preset ? "default" : "outline"}
                        size="xs"
                        onClick={() => setZoom(preset)}
                      >
                        {preset}%
                      </Button>
                    ))}
                  </div>

                  <input
                    id="mentorship-timeline-zoom"
                    type="range"
                    min="50"
                    max="180"
                    step="1"
                    value={zoom}
                    onChange={(event) => setZoom(Number(event.target.value))}
                    className="h-1.5 w-full accent-blue-500"
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div ref={timelineScrollerRef} className="overflow-x-auto">
          <div className="relative" style={{ width: totalWidth, minWidth: "100%" }}>
            <div
              className="grid border-b"
              style={{
                gridTemplateColumns: `${DAY_COLUMN_WIDTH}px ${timelineWidth}px`,
                height: HEADER_HEIGHT,
              }}
            >
              <div className="sticky left-0 z-20 flex items-center border-r bg-background px-4 text-xs font-semibold">
                Days
              </div>

              <div className="relative bg-background">
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="absolute inset-y-0 flex items-center border-l px-2 text-xs text-muted-foreground"
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

            <div className="border-b last:border-b-0">
              <div
                className="grid border-b bg-muted/40"
                style={{
                  gridTemplateColumns: `${DAY_COLUMN_WIDTH}px ${timelineWidth}px`,
                }}
              >
                <div className="sticky left-0 z-20 border-r bg-muted px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Week
                </div>

                <div className="flex items-center px-3 py-2 text-[11px] font-semibold text-muted-foreground">
                  {formatWeekRange(selectedWeek.weekStart)}
                </div>
              </div>

              {selectedWeek.days.map((day) => {
                const layoutItems = getTimelineLayoutItems(day.meetings);
                const laneCount = Math.max(
                  1,
                  ...layoutItems.map((item) => item.lane + 1)
                );

                const rowHeight = Math.max(ROW_HEIGHT, laneCount * ROW_HEIGHT);

                const nowPosition = getNowPosition({
                  dayStart: day.dayStart,
                  startHour,
                  endHour,
                  hourWidth,
                  now,
                });

                return (
                  <div
                    key={day.dateKey}
                    className="grid border-b last:border-b-0"
                    style={{
                      gridTemplateColumns: `${DAY_COLUMN_WIDTH}px ${timelineWidth}px`,
                    }}
                  >
                    <div
                      className="sticky left-0 z-10 border-r bg-background px-4 py-3"
                      style={{ minHeight: rowHeight }}
                    >
                      <p className="text-xs font-semibold text-foreground">
                        {formatDay(day.dayStart)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {day.meetings.length} session
                        {day.meetings.length === 1 ? "" : "s"}
                      </p>
                    </div>

                    <div
                      className="relative bg-muted/30"
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
                            left: (hour - startHour) * hourWidth,
                            width: hourWidth,
                          }}
                        />
                      ))}

                      {hours.flatMap((hour) =>
                        [15, 30, 45].map((minute) => (
                          <div
                            key={`${hour}-${minute}`}
                            className="absolute inset-y-0 border-l border-border/50"
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
                          className="absolute bottom-0 top-0 z-30 w-px bg-blue-400"
                          style={{ left: nowPosition }}
                        >
                          <span className="absolute -top-7 left-1/2 -translate-x-1/2 rounded bg-foreground px-1.5 py-0.5 text-[10px] font-semibold leading-none text-background shadow">
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
                          timelineWidth={timelineWidth}
                          index={lane}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
