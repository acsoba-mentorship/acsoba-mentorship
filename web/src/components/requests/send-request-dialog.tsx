"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useMutation } from "convex/react";
import { AlertCircle } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { PublicMentorProfile } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { RequestStatus } from "./types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const DURATION_OPTIONS = [
  { value: "1", label: "1 month" },
  { value: "3", label: "3 months" },
  { value: "6", label: "6 months" },
  { value: "12", label: "12 months" },
] as const;

function getRequestButtonState({
  mentor,
  currentUserId,
  hasMenteeProfile,
  latestStatus,
  latestStatusLoading,
}: {
  mentor: PublicMentorProfile;
  currentUserId?: Id<"users">;
  hasMenteeProfile: boolean;
  latestStatus: RequestStatus | null;
  latestStatusLoading: boolean;
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

  if (latestStatusLoading) {
    return { label: "Loading...", disabled: true };
  }

  if (latestStatus === "pending") {
    return { label: "Pending Request", disabled: true };
  }

  if (latestStatus === "accepted") {
    return { label: "Accepted", disabled: true };
  }

  if (latestStatus === "rejected" || latestStatus === "expired") {
    return { label: "Request Again", disabled: false };
  }

  return { label: "Send Request", disabled: false };
}

export function SendRequestDialog({
  mentor,
  currentUserId,
  hasMenteeProfile,
  latestStatus,
  latestStatusLoading = false,
  buttonClassName,
  sendRequestLabel,
  triggerStart,
}: {
  mentor: PublicMentorProfile;
  currentUserId?: Id<"users">;
  hasMenteeProfile: boolean;
  latestStatus: RequestStatus | null;
  /** When true, `latestStatus` is not known yet (Convex query still loading). */
  latestStatusLoading?: boolean;
  buttonClassName?: string;
  /** Replaces the default "Send Request" label when that action is available. */
  sendRequestLabel?: string;
  triggerStart?: ReactNode;
}) {
  const createRequest = useMutation(api.mentorRequests.createRequestByMentorId);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [durationMonths, setDurationMonths] = useState("3");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const buttonState = useMemo(() => {
    const state = getRequestButtonState({
      mentor,
      currentUserId,
      hasMenteeProfile,
      latestStatus,
      latestStatusLoading,
    });
    if (sendRequestLabel && state.label === "Send Request") {
      return { ...state, label: sendRequestLabel };
    }
    return state;
  }, [
    currentUserId,
    hasMenteeProfile,
    latestStatus,
    latestStatusLoading,
    mentor,
    sendRequestLabel,
  ]);

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
        proposedDurationMonths: Number(durationMonths),
      });
      setMessage("");
      setDurationMonths("3");
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
          setDurationMonths("3");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          size="sm"
          className={cn(
            triggerStart && "inline-flex items-center gap-1.5",
            buttonClassName
          )}
          disabled={buttonState.disabled}
        >
          {triggerStart}
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

        <div className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="request-duration" className="text-sm font-medium">
              Proposed mentorship length
            </label>
            <Select
              value={durationMonths}
              onValueChange={setDurationMonths}
            >
              <SelectTrigger id="request-duration" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              The mentor agrees to this planned period by accepting your
              request.
            </p>
          </div>

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
            <p
              id="request-message-counter"
              className="text-right text-xs text-muted-foreground"
            >
              {message.length}/1000
            </p>
          </div>
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
