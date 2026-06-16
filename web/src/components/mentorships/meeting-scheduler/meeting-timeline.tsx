"use client";

import type { FunctionReturnType } from "convex/server";
import { api } from "../../../../convex/_generated/api";
import {
  MentorshipTimelineGrid,
  type MentorshipTimelineItem,
} from "./timeline-grid";

type MentorshipMeeting = FunctionReturnType<
  typeof api.mentorshipMeetings.listByMentorship
>[number];

export function MeetingTimeline({ meetings }: { meetings: MentorshipMeeting[] }) {
  const timelineMeetings: MentorshipTimelineItem[] = meetings.map((meeting) => ({
    id: meeting._id,
    title: meeting.title,
    startAt: meeting.startAt,
    endAt: meeting.endAt,
    status: meeting.status,
  }));

  return <MentorshipTimelineGrid meetings={timelineMeetings} />;
}