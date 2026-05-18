"use client";

import { useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { AlertCircle } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { PublicMentorProfile } from "@/lib/types";
import type { RequestStatus } from "./types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function getRequestButtonState({
  mentor,
  currentUserId,
  hasMenteeProfile,
  latestStatus,
}: {
  mentor: PublicMentorProfile;
  currentUserId?: Id<"users">;
  hasMenteeProfile: boolean;
  latestStatus: RequestStatus | null;
}) {
  if (!mentor.mentorProfile?.isAvailable) {
    return { label: "Not Available", disabled: true };
  }

  if (!currentUserId) {
    return { label: "Loading...", disabled: true };
  }

  if (mentor.mentorId === currentUserId) {
    return { label: "Your Profile", disabled: true };
  }

  if (!hasMenteeProfile) {
    return { label: "Mentee Profile Required", disabled: true };
  }

  if (latestStatus === "pending") {
    return { label: "Pending Request", disabled: true };
  }

  if (latestStatus === "accepted") {
    return { label: "Accepted", disabled: true };
  }

  if (latestStatus === "rejected") {
    return { label: "Request Again", disabled: false };
  }

  return { label: "Send Request", disabled: false };
}

export function SendRequestDialog({
  mentor,
  currentUserId,
  hasMenteeProfile,
  latestStatus,
  buttonClassName,
}: {
  mentor: PublicMentorProfile;
  currentUserId?: Id<"users">;
  hasMenteeProfile: boolean;
  latestStatus: RequestStatus | null;
  buttonClassName?: string;
}) {
  const createRequest = useMutation(api.mentorRequests.createRequestByMentorId);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const buttonState = useMemo(
    () =>
      getRequestButtonState({
        mentor,
          currentUserId,
        hasMenteeProfile,
        latestStatus,
      }),
    [currentUserId, hasMenteeProfile, latestStatus, mentor]
  );

  const handleSubmit = async () => {
    if (!currentUserId) {
      setError("Your account is still loading. Please try again.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createRequest({
        mentorId: mentor.mentorId,
        message,
      });
      setMessage("");
      setOpen(false);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to send the mentorship request."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setError(null);
          setMessage("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          size="sm"
          className={buttonClassName}
          disabled={buttonState.disabled}
        >
          {buttonState.label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send mentorship request</DialogTitle>
          <DialogDescription>
            Introduce yourself to {mentor.name} and explain what kind of
            guidance you are looking for.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Unable to send request</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <label htmlFor="request-message" className="text-sm font-medium">
            Message
          </label>
          <Textarea
            id="request-message"
            aria-describedby="request-message-counter"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Hi! I’d love mentorship on..."
            className="min-h-32"
            maxLength={1000}
          />
          <p id="request-message-counter" className="text-right text-xs text-muted-foreground">
            {message.length}/1000
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={isSubmitting || message.trim().length === 0}
          >
            {isSubmitting ? "Sending..." : "Send Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
