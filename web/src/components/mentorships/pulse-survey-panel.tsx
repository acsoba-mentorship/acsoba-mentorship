"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  ClipboardCheck,
  HeartPulse,
  Loader2,
  MessageSquareWarning,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatDate } from "@/lib/utils";

type Rating = 1 | 2 | 3 | 4 | 5;

type PendingPulseSurvey = {
  _id: Id<"mentorshipPulseSurveys">;
  mentorshipId: Id<"mentorships">;
  respondentRole: "mentor" | "mentee";
  cycleNumber: number;
  dueAt: number;
  counterpartName: string;
  counterpartTitle: string;
};

const ratingOptions = [1, 2, 3, 4, 5] as const;

function RatingField({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: Rating | null;
  onChange: (value: Rating) => void;
}) {
  return (
    <div className="space-y-2">
      <div>
        <Label>{label}</Label>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {ratingOptions.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              "rounded-md border px-3 py-2 text-sm font-medium transition",
              value === option
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-muted"
            )}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Poor</span>
        <span>Excellent</span>
      </div>
    </div>
  );
}

function SupportField({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="space-y-2">
      <div>
        <Label>Do you need programme admin support?</Label>
        <p className="mt-1 text-xs text-muted-foreground">
          Select yes if something needs attention from the programme team.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange(false)}
          className={cn(
            "rounded-md border px-3 py-2 text-sm font-medium transition",
            value === false
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background hover:bg-muted"
          )}
        >
          No
        </button>

        <button
          type="button"
          onClick={() => onChange(true)}
          className={cn(
            "rounded-md border px-3 py-2 text-sm font-medium transition",
            value === true
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background hover:bg-muted"
          )}
        >
          Yes
        </button>
      </div>
    </div>
  );
}

export function PulseSurveyPanel({
  mentorshipId,
}: {
  mentorshipId: Id<"mentorships">;
}) {
  const pendingSurveys = useQuery(api.pulseSurveys.listPendingByMentorship, {
    mentorshipId,
  });

  const submitPulseSurvey = useMutation(api.pulseSurveys.submitPulseSurvey);

  const [activeSurveyId, setActiveSurveyId] =
    useState<Id<"mentorshipPulseSurveys"> | null>(null);

  const [relationshipRating, setRelationshipRating] =
    useState<Rating | null>(null);
  const [communicationRating, setCommunicationRating] =
    useState<Rating | null>(null);
  const [progressRating, setProgressRating] = useState<Rating | null>(null);
  const [needsSupport, setNeedsSupport] = useState<boolean | null>(null);
  const [comments, setComments] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const activeSurvey = useMemo(() => {
    return pendingSurveys?.find((survey) => survey._id === activeSurveyId);
  }, [activeSurveyId, pendingSurveys]);

  function resetForm() {
    setRelationshipRating(null);
    setCommunicationRating(null);
    setProgressRating(null);
    setNeedsSupport(null);
    setComments("");
    setErrorMessage("");
  }

  function openSurvey(survey: PendingPulseSurvey) {
    resetForm();
    setActiveSurveyId(survey._id);
  }

  function closeSurvey() {
    if (isSubmitting) {
      return;
    }

    setActiveSurveyId(null);
    resetForm();
  }

  async function handleSubmit() {
    if (
      !activeSurvey ||
      relationshipRating === null ||
      communicationRating === null ||
      progressRating === null ||
      needsSupport === null
    ) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await submitPulseSurvey({
        surveyId: activeSurvey._id,
        relationshipRating,
        communicationRating,
        progressRating,
        needsSupport,
        comments: comments || undefined,
      });

      setActiveSurveyId(null);
      resetForm();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to submit pulse survey"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmit =
    relationshipRating !== null &&
    communicationRating !== null &&
    progressRating !== null &&
    needsSupport !== null &&
    !isSubmitting;

  if (pendingSurveys === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pulse Survey</CardTitle>
          <CardDescription>Loading pulse survey status...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <HeartPulse className="size-5 text-primary" />
                Pulse Survey
              </CardTitle>
              <CardDescription>
                Periodic check-ins help track the health of this mentorship.
              </CardDescription>
            </div>

            {pendingSurveys.length > 0 && (
              <Badge variant="secondary">
                {pendingSurveys.length} due
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {pendingSurveys.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <ClipboardCheck className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 font-medium">No pulse survey due</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your next relationship health check will appear here when it is
                due.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingSurveys.map((survey) => (
                <div
                  key={survey._id}
                  className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">
                      Check-in with {survey.counterpartName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Cycle {survey.cycleNumber} · Due{" "}
                      {formatDate(survey.dueAt)}
                    </p>
                  </div>

                  <Button type="button" onClick={() => openSurvey(survey)}>
                    Complete Survey
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(activeSurvey)} onOpenChange={closeSurvey}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pulse Survey</DialogTitle>
            <DialogDescription>
              Share a quick update on how this mentorship relationship is going.
            </DialogDescription>
          </DialogHeader>

          {activeSurvey && (
            <div className="space-y-6">
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm font-medium">
                  Mentorship with {activeSurvey.counterpartName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {activeSurvey.counterpartTitle}
                </p>
              </div>

              <RatingField
                label="Relationship health"
                description="How healthy and useful is this mentorship relationship overall?"
                value={relationshipRating}
                onChange={setRelationshipRating}
              />

              <RatingField
                label="Communication"
                description="How effective and consistent is the communication?"
                value={communicationRating}
                onChange={setCommunicationRating}
              />

              <RatingField
                label="Progress"
                description="How well is the mentorship progressing against goals or expectations?"
                value={progressRating}
                onChange={setProgressRating}
              />

              <SupportField value={needsSupport} onChange={setNeedsSupport} />

              <div className="space-y-2">
                <Label htmlFor="pulse-comments">Optional comments</Label>
                <Textarea
                  id="pulse-comments"
                  value={comments}
                  onChange={(event) => setComments(event.target.value)}
                  placeholder="Share any context, blockers, wins, or concerns..."
                  rows={4}
                />
              </div>

              {needsSupport === true && (
                <Alert className="border-amber-200 bg-amber-50 text-amber-900">
                  <MessageSquareWarning className="size-4" />
                  <AlertDescription>
                    Your response will be flagged as needing programme support
                    for future admin review.
                  </AlertDescription>
                </Alert>
              )}

              {errorMessage && (
                <Alert variant="destructive">
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeSurvey}>
              Cancel
            </Button>

            <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Submit Survey
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}