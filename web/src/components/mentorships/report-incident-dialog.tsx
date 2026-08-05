"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { CheckCircle2, Flag, Loader2, ShieldAlert } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DynamicQuestionFields,
  getAnswerValidationError,
  toAnswerInputs,
  type DynamicAnswers,
} from "@/components/forms/dynamic-question-fields";

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

export function ReportIncidentDialog({
  mentorshipId,
  reporterRole,
  participantName,
}: {
  mentorshipId?: Id<"mentorships">;
  reporterRole: "mentor" | "mentee";
  participantName?: string | null;
}) {
  const questions = useQuery(api.formQuestions.listForForm, {
    formType: "incident_report",
  });
  const submitIncident = useMutation(api.incidentReports.submit);
  const isMentorshipIncident = Boolean(mentorshipId);
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<DynamicAnswers>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function resetForm() {
    setAnswers({});
    setSubmitted(false);
    setErrorMessage(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isSubmitting) return;
    if (nextOpen) resetForm();
    setOpen(nextOpen);
  }

  async function handleSubmit() {
    if (!questions) return;
    const validationError = getAnswerValidationError(questions, answers);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await submitIncident({
        reporterRole,
        ...(mentorshipId ? { mentorshipId } : {}),
        answers: toAnswerInputs(questions, answers),
      });
      setSubmitted(true);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="bg-background/70">
          <Flag className="size-4" />
          Report an incident
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-xl"
        showCloseButton={!isSubmitting}
      >
        <DialogHeader>
          <DialogTitle>Report an incident</DialogTitle>
          <DialogDescription>
            {isMentorshipIncident
              ? `Share a private concern about this mentorship${
                  participantName ? ` with ${participantName}` : ""
                } with authorised programme admins.`
              : "Share a private general programme concern with authorised programme admins."}
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="space-y-5 py-3">
            <div className="flex flex-col items-center rounded-lg bg-primary/5 px-5 py-7 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <CheckCircle2 className="size-6" />
              </span>
              <h3 className="mt-4 font-semibold">Report submitted</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                The programme team has received your confidential report.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="space-y-5">
              <div className="flex gap-3 rounded-lg bg-secondary/60 px-4 py-3 text-secondary-foreground">
                <ShieldAlert className="mt-0.5 size-4 shrink-0" />
                <p className="text-sm">
                  For immediate danger or urgent medical help, contact local
                  emergency services. This form is not monitored continuously.
                </p>
              </div>
              {questions === undefined ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin" />
                </div>
              ) : (
                <DynamicQuestionFields
                  questions={questions}
                  answers={answers}
                  onChange={setAnswers}
                  disabled={isSubmitting}
                />
              )}
              {errorMessage ? (
                <Alert variant="destructive">
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              ) : null}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={isSubmitting || questions === undefined}
                onClick={handleSubmit}
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : null}
                Submit report
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
