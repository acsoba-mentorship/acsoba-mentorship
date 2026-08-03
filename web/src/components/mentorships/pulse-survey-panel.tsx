"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { ClipboardCheck, HeartPulse, Loader2 } from "lucide-react";
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
import {
  DynamicQuestionFields,
  getAnswerValidationError,
  toAnswerInputs,
  type DynamicAnswers,
} from "@/components/forms/dynamic-question-fields";
import { formatDate } from "@/lib/utils";

export function PulseSurveyPanel({
  mentorshipId,
}: {
  mentorshipId: Id<"mentorships">;
}) {
  const pendingSurveys = useQuery(api.pulseSurveys.listPendingByMentorship, {
    mentorshipId,
  });
  const questions = useQuery(api.formQuestions.listForForm, {
    formType: "pulse_survey",
  });
  const submitPulseSurvey = useMutation(api.pulseSurveys.submitPulseSurvey);
  const [activeSurveyId, setActiveSurveyId] =
    useState<Id<"mentorshipPulseSurveys"> | null>(null);
  const [answers, setAnswers] = useState<DynamicAnswers>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const activeSurvey = useMemo(
    () => pendingSurveys?.find((survey) => survey._id === activeSurveyId),
    [activeSurveyId, pendingSurveys]
  );

  function closeSurvey() {
    if (isSubmitting) return;
    setActiveSurveyId(null);
    setAnswers({});
    setErrorMessage("");
  }

  async function handleSubmit() {
    if (!activeSurvey || !questions) return;
    const validationError = getAnswerValidationError(questions, answers);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      await submitPulseSurvey({
        surveyId: activeSurvey._id,
        answers: toAnswerInputs(questions, answers),
      });
      setActiveSurveyId(null);
      setAnswers({});
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to submit pulse survey"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (pendingSurveys === undefined || questions === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pulse survey</CardTitle>
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
                Pulse survey
              </CardTitle>
              <CardDescription>
                Periodic check-ins help track the health of this mentorship.
              </CardDescription>
            </div>
            {pendingSurveys.length > 0 ? (
              <Badge variant="secondary">{pendingSurveys.length} due</Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {pendingSurveys.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <ClipboardCheck className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 font-medium">No pulse survey due</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingSurveys.map((survey) => (
                <div
                  key={survey._id}
                  className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">Check-in with {survey.counterpartName}</p>
                    <p className="text-sm text-muted-foreground">
                      Due {formatDate(survey.dueAt)}
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setAnswers({});
                      setErrorMessage("");
                      setActiveSurveyId(survey._id);
                    }}
                  >
                    Complete survey
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
            <DialogTitle>Pulse survey</DialogTitle>
            <DialogDescription>
              Fields marked with an asterisk are compulsory. Your answers are
              not shown to your counterpart.
            </DialogDescription>
          </DialogHeader>
          {activeSurvey ? (
            <div className="space-y-6">
              <div className="rounded-lg bg-muted p-4 text-sm">
                Mentorship with {activeSurvey.counterpartName}
              </div>
              <DynamicQuestionFields
                questions={questions}
                answers={answers}
                onChange={setAnswers}
                disabled={isSubmitting}
              />
              {errorMessage ? (
                <Alert variant="destructive">
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              ) : null}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={closeSurvey}>Cancel</Button>
            <Button disabled={isSubmitting} onClick={handleSubmit}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : null}
              Submit survey
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
