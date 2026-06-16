"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../../convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MentorshipTimelineGrid,
  type MentorshipTimelineItem,
} from "@/components/mentorships/meeting-scheduler/timeline-grid";

type TimelineMeeting = FunctionReturnType<
  typeof api.mentorshipMeetings.listForCurrentUser
>[number];

function getWorkspaceHref(meeting: TimelineMeeting) {
  if (meeting.viewerRole === "mentor") {
    return `/mentor/mentorships/${meeting.mentorshipId}`;
  }

  return `/mentorships/${meeting.mentorshipId}`;
}

function toTimelineItem(meeting: TimelineMeeting): MentorshipTimelineItem {
  return {
    id: meeting._id,
    title: meeting.title,
    startAt: meeting.startAt,
    endAt: meeting.endAt,
    status: meeting.status,
    href: getWorkspaceHref(meeting),
    viewerRole: meeting.viewerRole,
    counterpartName: meeting.counterpartName,
  };
}

export function AllMentorshipsTimeline() {
  const meetings = useQuery(api.mentorshipMeetings.listForCurrentUser);

  const timelineMeetings = useMemo(() => {
    return meetings?.map(toTimelineItem) ?? [];
  }, [meetings]);

  if (meetings === undefined) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-80" />
        </CardHeader>

        <CardContent>
          <Skeleton className="h-80 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (meetings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>All mentorship meetings</CardTitle>
          <CardDescription>
            View scheduled sessions across every active mentorship.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            No meetings have been scheduled across your mentorships yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All mentorship meetings</CardTitle>
        <CardDescription>
          View every meeting across your active mentor and mentee relationships.
          Select a meeting to open its workspace.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <MentorshipTimelineGrid
          meetings={timelineMeetings}
          showRoleFilter
        />
      </CardContent>
    </Card>
  );
}