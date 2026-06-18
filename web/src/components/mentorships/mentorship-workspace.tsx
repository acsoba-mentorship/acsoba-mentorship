"use client";

import type { Id } from "../../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { MentorshipGoals } from "./mentorship-goals";
import { MentorshipSummaryCard } from "./mentorship-summary-card";
import { MentorshipTodos } from "./mentorship-todos";
import { MentorshipMeetingsPanel } from "@/components/mentorships/meeting-scheduler";
import { PulseSurveyPanel } from "@/components/mentorships/pulse-survey-panel";

export function MentorshipWorkspace({
  mentorshipId,
  canManageMeetings = false,
}: {
  mentorshipId: Id<"mentorships">;
  canManageMeetings?: boolean;
}) {
  const workspace = useQuery(api.mentorshipWorkspace.getWorkspace, {
    mentorshipId,
  });

  if (workspace === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  const participant =
    workspace.role === "mentor" ? workspace.mentee : workspace.mentor;
  const canManageSessions = canManageMeetings && workspace.role === "mentor";

  return (
    <div className="space-y-8">
      <MentorshipSummaryCard
        role={workspace.role}
        participant={participant}
        startDate={workspace.mentorship.startDate}
      />

      <MentorshipMeetingsPanel
        mentorshipId={mentorshipId}
        participantName={participant?.name}
        canManageMeetings={canManageSessions}
      />

      <PulseSurveyPanel mentorshipId={mentorshipId} />

      <div className="grid gap-6 lg:grid-cols-2">
        <MentorshipGoals mentorshipId={mentorshipId} goals={workspace.goals} />

        <MentorshipTodos
          mentorshipId={mentorshipId}
          todos={workspace.todos}
          goals={workspace.goals}
        />
      </div>
    </div>
  );
}