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
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
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
  const [confirmEndOpen, setConfirmEndOpen] = useState(false);
  const [isInitiating, setIsInitiating] = useState(false);
  const [initiateError, setInitiateError] = useState<string | null>(null);

  async function handleConfirmEnd() {
    setIsInitiating(true);
    setInitiateError(null);

    try {
      await initiateExit({ mentorshipId });
      router.replace("/exit-feedback");
    } catch (error) {
      setInitiateError(getErrorMessage(error));
      setIsInitiating(false);
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

  const feedback = feedbackState.feedback;
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
          role === "mentor" ? (
            <div className="space-y-4">
              <div>
                <p className="font-medium">Ready to end this mentorship?</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  The mentorship will end immediately. Separate compulsory exit
                  surveys will be assigned to both of you, and your mentee will
                  be notified.
                </p>
              </div>

              {initiateError ? (
                <Alert variant="destructive">
                  <AlertDescription>{initiateError}</AlertDescription>
                </Alert>
              ) : null}

              <Button
                type="button"
                variant="destructive"
                disabled={isInitiating}
                onClick={() => setConfirmEndOpen(true)}
              >
                End mentorship
              </Button>

              <Dialog
                open={confirmEndOpen}
                onOpenChange={(nextOpen) => {
                  if (!isInitiating) setConfirmEndOpen(nextOpen);
                }}
              >
                <DialogContent showCloseButton={!isInitiating}>
                  <DialogHeader>
                    <DialogTitle>End this mentorship?</DialogTitle>
                    <DialogDescription>
                      This action is irreversible. The mentorship will stop
                      being active immediately, and both participants must
                      complete exit feedback before using the rest of the app.
                    </DialogDescription>
                  </DialogHeader>
                  {initiateError ? (
                    <Alert variant="destructive">
                      <AlertDescription>{initiateError}</AlertDescription>
                    </Alert>
                  ) : null}
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isInitiating}
                      onClick={() => setConfirmEndOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={isInitiating}
                      onClick={handleConfirmEnd}
                    >
                      {isInitiating ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : null}
                      Yes, end mentorship
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Your mentor can end this mentorship when it concludes. You will
              be notified and required to complete an independent exit survey.
            </p>
          )
        ) : null}

        {isPending ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Your exit survey is due</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Please submit by {formatDate(feedback.dueAt)}.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => router.replace("/exit-feedback")}
            >
              Complete exit survey
            </Button>
          </div>
        ) : null}

        {isSubmitted ? (
          <div className="flex items-start gap-3 rounded-lg bg-primary/5 px-4 py-4">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="font-medium">Your feedback has been submitted</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Submitted {feedback.submittedAt ? formatDate(feedback.submittedAt) : "successfully"}.
              </p>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
