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

  const cancelMeeting = useMutation(api.mentorshipMeetings.cancelMeeting);
  const completeMeeting = useMutation(api.mentorshipMeetings.completeMeeting);

  const [updatingMeetingIds, setUpdatingMeetingIds] = useState<
    Set<Id<"mentorshipMeetings">>
  >(new Set());

  const scheduledMeetings = useMemo(() => {
    return (
      meetings
        ?.filter((meeting) => meeting.status === "scheduled")
        .sort((a, b) => a.startAt - b.startAt) ?? []
    );
  }, [meetings]);

  const meetingHistory = useMemo(() => {
    return (
      meetings
        ?.filter((meeting) => meeting.status !== "scheduled")
        .sort((a, b) => b.updatedAt - a.updatedAt) ?? []
    );
  }, [meetings]);

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
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold">Scheduled Sessions</h3>
            <p className="text-xs text-muted-foreground">
              Upcoming sessions for this active mentorship.
            </p>
          </div>

          {scheduledMeetings.length === 0 ? (
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No sessions scheduled yet.
            </p>
          ) : (
            <div className="space-y-4">
              <MeetingTimeline meetings={scheduledMeetings} />

              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Session details
                </h4>

                {scheduledMeetings.map((meeting) => (
                  <MeetingCard
                    key={meeting._id}
                    meeting={meeting}
                    isUpdating={updatingMeetingIds.has(meeting._id)}
                    onCancel={(meetingId) =>
                      withMeetingUpdate(meetingId, () =>
                        cancelMeeting({ meetingId })
                      )
                    }
                    onComplete={(meetingId) =>
                      withMeetingUpdate(meetingId, () =>
                        completeMeeting({ meetingId })
                      )
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3 border-t pt-4">
          <div>
            <h3 className="text-sm font-semibold">Meeting History</h3>
            <p className="text-xs text-muted-foreground">
              Completed and cancelled sessions are retained for reference.
            </p>
          </div>

          {meetingHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No meeting history yet.
            </p>
          ) : (
            meetingHistory.map((meeting) => (
              <MeetingCard
                key={meeting._id}
                meeting={meeting}
                isUpdating={updatingMeetingIds.has(meeting._id)}
                onCancel={(meetingId) =>
                  withMeetingUpdate(meetingId, () =>
                    cancelMeeting({ meetingId })
                  )
                }
                onComplete={(meetingId) =>
                  withMeetingUpdate(meetingId, () =>
                    completeMeeting({ meetingId })
                  )
                }
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}