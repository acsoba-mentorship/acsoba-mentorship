"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { MeetingCard } from "./meeting-scheduler/meeting-card";
import { MeetingTimeline } from "./meeting-scheduler/meeting-timeline";
import { ScheduleMeetingDialog } from "./meeting-scheduler/schedule-meeting-dialog";

export { ScheduleMeetingDialog };

export function MentorshipMeetingsPanel({
  mentorshipId,
  participantName,
}: {
  mentorshipId: Id<"mentorships">;
  participantName?: string | null;
}) {
  const meetings = useQuery(api.mentorshipMeetings.listByMentorship, {
    mentorshipId,
  });

  const completeMeeting = useMutation(api.mentorshipMeetings.completeMeeting);
  const deleteMeeting = useMutation(api.mentorshipMeetings.deleteMeeting);

  const [activeTab, setActiveTab] = useState<"upcoming" | "closed">("upcoming");
  const [updatingMeetingIds, setUpdatingMeetingIds] = useState<
    Set<Id<"mentorshipMeetings">>
  >(new Set());

  const orderedMeetings = useMemo(() => {
    return [...(meetings ?? [])].sort((a, b) => a.startAt - b.startAt);
  }, [meetings]);

  const upcomingMeetings = useMemo(() => {
    return orderedMeetings.filter((meeting) => meeting.status === "scheduled");
  }, [orderedMeetings]);

  const closedMeetings = useMemo(() => {
    return orderedMeetings
      .filter((meeting) => meeting.status !== "scheduled")
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [orderedMeetings]);

  async function withMeetingUpdate(
    meetingId: Id<"mentorshipMeetings">,
    update: () => Promise<unknown>
  ) {
    setUpdatingMeetingIds((current) => new Set(current).add(meetingId));

    try {
      await update();
    } finally {
      setUpdatingMeetingIds((current) => {
        const next = new Set(current);
        next.delete(meetingId);
        return next;
      });
    }
  }

  if (meetings === undefined) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>

        <CardContent className="space-y-3">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Meetings</CardTitle>
            <CardDescription>
              Schedule mentoring sessions and add them to external calendars.
            </CardDescription>
          </div>

          <ScheduleMeetingDialog
            mentorshipId={mentorshipId}
            participantName={participantName}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <MeetingTimeline meetings={orderedMeetings} />

        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold">Sessions</h3>
              <p className="text-xs text-muted-foreground">
                Review upcoming and closed meetings for this mentorship.
              </p>
            </div>

            <div className="inline-flex rounded-md border bg-muted p-1 text-sm">
              <button
                type="button"
                onClick={() => setActiveTab("upcoming")}
                className={cn(
                  "rounded px-3 py-1.5 font-medium transition",
                  activeTab === "upcoming"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Upcoming ({upcomingMeetings.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("closed")}
                className={cn(
                  "rounded px-3 py-1.5 font-medium transition",
                  activeTab === "closed"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Closed ({closedMeetings.length})
              </button>
            </div>
          </div>

          {activeTab === "upcoming" ? (
            upcomingMeetings.length === 0 ? (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                No upcoming sessions.
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingMeetings.map((meeting) => (
                  <MeetingCard
                    key={meeting._id}
                    meeting={meeting}
                    isUpdating={updatingMeetingIds.has(meeting._id)}
                    onDelete={(meetingId) =>
                      withMeetingUpdate(meetingId, () => deleteMeeting({ meetingId }))
                    }
                    onComplete={(meetingId) =>
                      withMeetingUpdate(meetingId, () =>
                        completeMeeting({ meetingId })
                      )
                    }
                  />
                ))}
              </div>
            )
          ) : closedMeetings.length === 0 ? (
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No closed sessions yet.
            </p>
          ) : (
            <div className="space-y-3">
              {closedMeetings.map((meeting) => (
                <MeetingCard
                  key={meeting._id}
                  meeting={meeting}
                  isUpdating={updatingMeetingIds.has(meeting._id)}
                  onDelete={(meetingId) =>
                    withMeetingUpdate(meetingId, () => deleteMeeting({ meetingId }))
                  }
                  onComplete={(meetingId) =>
                    withMeetingUpdate(meetingId, () => completeMeeting({ meetingId }))
                  }
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}