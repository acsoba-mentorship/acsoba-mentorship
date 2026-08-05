"use client";

import { ShieldCheck } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { ExitFeedbackPanel } from "./exit-feedback-panel";
import { MentorshipGoals } from "./mentorship-goals";
import { MentorshipSummaryCard } from "./mentorship-summary-card";
import { MentorshipTodos } from "./mentorship-todos";
import { ReportIncidentDialog } from "./report-incident-dialog";
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
        plannedEndDate={workspace.mentorship.plannedEndDate}
        agreedDurationMonths={workspace.mentorship.agreedDurationMonths}
      />

      <section className="flex flex-col gap-4 rounded-xl bg-secondary/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background/80">
            <ShieldCheck className="size-4 text-secondary-foreground" />
          </span>
          <div>
            <h2 className="font-semibold text-secondary-foreground">
              Need programme support?
            </h2>
            <p className="mt-1 text-sm text-secondary-foreground/80">
              Concerns are sent privately to authorised programme admins and
              are not shared in this workspace.
            </p>
          </div>
        </div>

        <ReportIncidentDialog
          mentorshipId={mentorshipId}
          reporterRole={workspace.role}
          participantName={participant?.name}
        />
      </section>

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

      <ExitFeedbackPanel mentorshipId={mentorshipId} role={workspace.role} />
    </div>
  );
}
