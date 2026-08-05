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
import {
  DynamicQuestionFields,
  getAnswerValidationError,
  toAnswerInputs,
  type DynamicAnswers,
  type DynamicQuestion,
} from "@/components/forms/dynamic-question-fields";
import { formatDate } from "@/lib/utils";

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

function FeedbackForm({
  feedback,
  questions,
}: {
  feedback: Doc<"exitFeedback">;
  questions: DynamicQuestion[];
}) {
  const router = useRouter();
  const submitExitFeedback = useMutation(api.exitFeedback.submit);
  const [answers, setAnswers] = useState<DynamicAnswers>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = getAnswerValidationError(questions, answers);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const result = await submitExitFeedback({
        feedbackId: feedback._id,
        answers: toAnswerInputs(questions, answers),
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
      <DynamicQuestionFields
        questions={questions}
        answers={answers}
        onChange={setAnswers}
        disabled={isSubmitting}
      />

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
  const questions = useQuery(api.formQuestions.listForForm, {
    formType: "exit_feedback",
  });

  if (
    pendingFeedback === undefined ||
    pendingFeedback.length === 0 ||
    questions === undefined
  ) {
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
            Fields marked with an asterisk are compulsory.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-3 rounded-lg bg-secondary/60 px-4 py-3 text-sm text-secondary-foreground">
            <LockKeyhole className="mt-0.5 size-4 shrink-0" />
            Your answers are visible only to authorised programme admins, not
            the other participant.
          </div>
          <FeedbackForm
            key={String(feedback._id)}
            feedback={feedback}
            questions={questions}
          />
        </CardContent>
      </Card>
    </main>
  );
}
