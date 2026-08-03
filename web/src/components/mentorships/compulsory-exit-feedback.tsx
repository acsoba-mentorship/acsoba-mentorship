"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { ClipboardCheck, Loader2, LockKeyhole } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
        {ratingOptions.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={value === option}
            onClick={() => onChange(option)}
            className={cn(
              "h-11 rounded-md text-sm font-semibold transition",
              value === option
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-foreground hover:bg-secondary"
            )}
          >
            {option}
          </button>
        ))}
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
        ].map((option) => (
          <button
            key={option.label}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition",
              value === option.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground hover:bg-secondary"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function FeedbackForm({
  feedback,
}: {
  feedback: Doc<"exitFeedback">;
}) {
  const router = useRouter();
  const submitExitFeedback = useMutation(api.exitFeedback.submit);
  const [reason, setReason] = useState("");
  const [overallRating, setOverallRating] = useState<Rating | null>(null);
  const [goalsAchieved, setGoalsAchieved] = useState<boolean | null>(null);
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [highlights, setHighlights] = useState("");
  const [improvements, setImprovements] = useState("");
  const [additionalComments, setAdditionalComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!reason.trim()) {
      setError("Please share your reason for ending the mentorship.");
      return;
    }
    if (overallRating === null) {
      setError("Please select an overall rating from 1 to 5.");
      return;
    }
    if (goalsAchieved === null) {
      setError("Please indicate whether your goals were achieved.");
      return;
    }
    if (wouldRecommend === null) {
      setError("Please indicate whether you would recommend the programme.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const result = await submitExitFeedback({
        feedbackId: feedback._id,
        reason: reason.trim(),
        overallRating,
        goalsAchieved,
        wouldRecommend,
        highlights: optionalText(highlights),
        improvements: optionalText(improvements),
        additionalComments: optionalText(additionalComments),
      });

      if (result.remainingPendingCount === 0) {
        router.replace(
          feedback.respondentRole === "mentor" ? "/mentor" : "/dashboard"
        );
      }
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="exit-reason">Reason for ending the mentorship</Label>
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

      <RatingField value={overallRating} onChange={setOverallRating} />

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

      {[
        {
          id: "exit-highlights",
          label: "Highlights",
          value: highlights,
          setter: setHighlights,
          placeholder: "What worked especially well?",
        },
        {
          id: "exit-improvements",
          label: "Improvements",
          value: improvements,
          setter: setImprovements,
          placeholder: "What could have made the experience better?",
        },
        {
          id: "exit-comments",
          label: "Additional comments",
          value: additionalComments,
          setter: setAdditionalComments,
          placeholder: "Anything else the programme team should know?",
        },
      ].map((field) => (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={field.id}>
            {field.label}{" "}
            <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id={field.id}
            value={field.value}
            onChange={(event) => field.setter(event.target.value)}
            placeholder={field.placeholder}
            rows={3}
            maxLength={2000}
          />
        </div>
      ))}

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
        Submit compulsory feedback
      </Button>
    </form>
  );
}

export function CompulsoryExitFeedback() {
  const pendingFeedback = useQuery(api.exitFeedback.listPendingMine);

  if (pendingFeedback === undefined || pendingFeedback.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  const feedback = pendingFeedback[0];

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-10 sm:px-6">
      <Card className="mx-auto max-w-2xl border-primary/15 shadow-lg">
        <CardHeader>
          <span className="mb-2 flex size-11 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
            <ClipboardCheck className="size-5" />
          </span>
          <CardTitle>Exit feedback is required</CardTitle>
          <CardDescription>
            This mentorship has ended. Complete this private survey before
            continuing to another page. It is due {formatDate(feedback.dueAt)}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-3 rounded-lg bg-secondary/60 px-4 py-3 text-sm text-secondary-foreground">
            <LockKeyhole className="mt-0.5 size-4 shrink-0" />
            Your answers are visible only to authorised programme admins, not
            the other participant.
          </div>
          <FeedbackForm key={String(feedback._id)} feedback={feedback} />
        </CardContent>
      </Card>
    </main>
  );
}
