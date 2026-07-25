"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import {
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  LockKeyhole,
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatDate } from "@/lib/utils";

type Rating = 1 | 2 | 3 | 4 | 5;

const ratingOptions = [1, 2, 3, 4, 5] as const;

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

function optionalText(value: string) {
  return value.trim() || undefined;
}

function RatingField({
  value,
  onChange,
}: {
  value: Rating | null;
  onChange: (value: Rating) => void;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">Overall rating</legend>
      <p className="-mt-2 text-xs text-muted-foreground">
        Rate the mentorship from 1 (poor) to 5 (excellent).
      </p>

      <div className="grid grid-cols-5 gap-2">
        {ratingOptions.map((option) => {
          const selected = value === option;

          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option)}
              className={cn(
                "h-11 rounded-md text-sm font-semibold transition",
                selected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-foreground hover:bg-secondary"
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function BooleanChoice({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">{label}</legend>
      <p className="-mt-2 text-xs text-muted-foreground">{description}</p>

      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Yes", value: true },
          { label: "No", value: false },
        ].map((option) => {
          const selected = value === option.value;

          return (
            <button
              key={option.label}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option.value)}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition",
                selected
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground hover:bg-secondary"
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function ExitFeedbackPanel({
  mentorshipId,
  role,
}: {
  mentorshipId: Id<"mentorships">;
  role: "mentor" | "mentee";
}) {
  const router = useRouter();
  const feedbackState = useQuery(api.exitFeedback.getMineForMentorship, {
    mentorshipId,
  });
  const initiateExit = useMutation(api.exitFeedback.initiate);
  const submitExitFeedback = useMutation(api.exitFeedback.submit);

  const [formOpen, setFormOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [overallRating, setOverallRating] = useState<Rating | null>(null);
  const [goalsAchieved, setGoalsAchieved] = useState<boolean | null>(null);
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [highlights, setHighlights] = useState("");
  const [improvements, setImprovements] = useState("");
  const [additionalComments, setAdditionalComments] = useState("");
  const [isInitiating, setIsInitiating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initiateError, setInitiateError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const feedback = feedbackState?.feedback;
  const listPath =
    role === "mentor" ? "/mentor/mentorships" : "/mentorships";

  async function handleInitiate() {
    setIsInitiating(true);
    setInitiateError(null);

    try {
      await initiateExit({ mentorshipId });
    } catch (error) {
      setInitiateError(getErrorMessage(error));
    } finally {
      setIsInitiating(false);
    }
  }

  async function handleSubmit() {
    if (!feedback || feedback.status !== "pending") {
      return;
    }

    const cleanReason = reason.trim();
    if (!cleanReason) {
      setFormError("Please share your reason for ending the mentorship.");
      return;
    }

    if (overallRating === null) {
      setFormError("Please select an overall rating from 1 to 5.");
      return;
    }

    if (goalsAchieved === null) {
      setFormError("Please indicate whether your goals were achieved.");
      return;
    }

    if (wouldRecommend === null) {
      setFormError("Please indicate whether you would recommend the programme.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const result = await submitExitFeedback({
        feedbackId: feedback._id,
        reason: cleanReason,
        overallRating,
        goalsAchieved,
        wouldRecommend,
        highlights: optionalText(highlights),
        improvements: optionalText(improvements),
        additionalComments: optionalText(additionalComments),
      });

      if (result.mentorshipCompleted) {
        router.replace(listPath);
        return;
      }

      setFormOpen(false);
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (feedbackState === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Exit feedback</CardTitle>
          <CardDescription>Loading exit feedback status...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const isPending = feedback?.status === "pending";
  const isSubmitted = feedback?.status === "submitted";

  return (
    <Card className="overflow-hidden border-primary/10">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-lg bg-secondary">
                <ClipboardCheck className="size-4 text-secondary-foreground" />
              </span>
              Exit feedback
            </CardTitle>
            <CardDescription className="mt-1">
              Close the mentorship thoughtfully and help improve the programme.
            </CardDescription>
          </div>

          {isPending ? <Badge variant="secondary">Action needed</Badge> : null}
          {isSubmitted ? <Badge variant="default">Submitted</Badge> : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex gap-3 rounded-lg bg-secondary/60 px-4 py-3 text-secondary-foreground">
          <LockKeyhole className="mt-0.5 size-4 shrink-0" />
          <p className="text-sm">
            Each participant submits feedback independently. Your counterpart
            cannot see your answers, while authorised programme admins can
            review them.
          </p>
        </div>

        {!feedback ? (
          <div className="space-y-4">
            <div>
              <p className="font-medium">Ready to end this mentorship?</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Starting the exit process creates a separate survey for both
                participants. The relationship closes after both responses are
                submitted.
              </p>
            </div>

            {initiateError ? (
              <Alert variant="destructive">
                <AlertDescription>{initiateError}</AlertDescription>
              </Alert>
            ) : null}

            <Button
              type="button"
              variant="outline"
              disabled={isInitiating}
              onClick={handleInitiate}
            >
              {isInitiating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Start exit process
            </Button>
          </div>
        ) : null}

        {isPending ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Your exit survey is due</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Please submit by {formatDate(feedback.dueAt)}.
              </p>
            </div>

            <Dialog
              open={formOpen}
              onOpenChange={(nextOpen) => {
                if (!isSubmitting) {
                  setFormOpen(nextOpen);
                  setFormError(null);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button type="button">Complete exit survey</Button>
              </DialogTrigger>

              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Share your exit feedback</DialogTitle>
                  <DialogDescription>
                    Your response is independent and visible to authorised
                    programme admins, not the other participant.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="exit-reason">
                      Reason for ending the mentorship
                    </Label>
                    <Textarea
                      id="exit-reason"
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      placeholder="Tell us why the mentorship is ending..."
                      rows={4}
                      maxLength={1000}
                      required
                    />
                    <p className="text-right text-xs text-muted-foreground">
                      {reason.length}/1000
                    </p>
                  </div>

                  <RatingField
                    value={overallRating}
                    onChange={setOverallRating}
                  />

                  <div className="grid gap-6 sm:grid-cols-2">
                    <BooleanChoice
                      label="Were your goals achieved?"
                      description="Consider the goals agreed during this mentorship."
                      value={goalsAchieved}
                      onChange={setGoalsAchieved}
                    />

                    <BooleanChoice
                      label="Would you recommend the programme?"
                      description="Tell us whether you would recommend this experience."
                      value={wouldRecommend}
                      onChange={setWouldRecommend}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="exit-highlights">
                      Highlights{" "}
                      <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Textarea
                      id="exit-highlights"
                      value={highlights}
                      onChange={(event) => setHighlights(event.target.value)}
                      placeholder="What worked especially well?"
                      rows={3}
                      maxLength={2000}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="exit-improvements">
                      Improvements{" "}
                      <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Textarea
                      id="exit-improvements"
                      value={improvements}
                      onChange={(event) => setImprovements(event.target.value)}
                      placeholder="What could have made the experience better?"
                      rows={3}
                      maxLength={2000}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="exit-comments">
                      Additional comments{" "}
                      <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Textarea
                      id="exit-comments"
                      value={additionalComments}
                      onChange={(event) =>
                        setAdditionalComments(event.target.value)
                      }
                      placeholder="Anything else the programme team should know?"
                      rows={3}
                      maxLength={2000}
                    />
                  </div>

                  {formError ? (
                    <Alert variant="destructive">
                      <AlertDescription>{formError}</AlertDescription>
                    </Alert>
                  ) : null}
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={() => setFormOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleSubmit}
                  >
                    {isSubmitting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : null}
                    Submit feedback
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        ) : null}

        {isSubmitted ? (
          <div className="flex items-start gap-3 rounded-lg bg-primary/5 px-4 py-4">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="font-medium">Your feedback has been submitted</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Submitted{" "}
                {feedback.submittedAt
                  ? formatDate(feedback.submittedAt)
                  : "successfully"}
                . The mentorship will close when the other participant submits
                their independent response.
              </p>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
