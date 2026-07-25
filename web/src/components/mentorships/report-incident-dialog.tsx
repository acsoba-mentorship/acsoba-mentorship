"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import {
  CheckCircle2,
  Flag,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const categoryOptions = [
  { value: "misconduct", label: "Misconduct" },
  { value: "harassment", label: "Harassment" },
  { value: "safety", label: "Safety concern" },
  { value: "privacy", label: "Privacy concern" },
  { value: "other", label: "Other" },
] as const;

const severityOptions = [
  { value: "low", label: "Low — concerning, no immediate risk" },
  { value: "medium", label: "Medium — needs timely review" },
  { value: "high", label: "High — serious or ongoing concern" },
  { value: "urgent", label: "Urgent — immediate safety concern" },
] as const;

type IncidentCategory = (typeof categoryOptions)[number]["value"];
type IncidentSeverity = (typeof severityOptions)[number]["value"];

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

export function ReportIncidentDialog({
  mentorshipId,
}: {
  mentorshipId?: Id<"mentorships">;
}) {
  const submitIncident = useMutation(api.incidentReports.submit);
  const isMentorshipIncident = Boolean(mentorshipId);

  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<IncidentCategory | "">("");
  const [severity, setSeverity] = useState<IncidentSeverity | "">("");
  const [occurredDate, setOccurredDate] = useState("");
  const [description, setDescription] = useState("");
  const [allowContact, setAllowContact] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function resetForm() {
    setCategory("");
    setSeverity("");
    setOccurredDate("");
    setDescription("");
    setAllowContact(false);
    setSubmitted(false);
    setErrorMessage(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isSubmitting) {
      return;
    }

    if (nextOpen) {
      resetForm();
    }

    setOpen(nextOpen);
  }

  async function handleSubmit() {
    if (!category) {
      setErrorMessage("Please choose the category that best fits.");
      return;
    }

    if (!severity) {
      setErrorMessage("Please choose how urgent this concern is.");
      return;
    }

    const cleanDescription = description.trim();
    if (cleanDescription.length < 20) {
      setErrorMessage(
        "Please provide at least 20 characters so the programme team has enough context."
      );
      return;
    }

    let occurredAt: number | undefined;
    if (occurredDate) {
      occurredAt = new Date(`${occurredDate}T00:00:00`).getTime();

      if (!Number.isFinite(occurredAt)) {
        setErrorMessage("Please choose a valid incident date.");
        return;
      }

      if (occurredAt > Date.now()) {
        setErrorMessage("The incident date cannot be in the future.");
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await submitIncident({
        ...(mentorshipId ? { mentorshipId } : {}),
        category,
        severity,
        description: cleanDescription,
        occurredAt,
        allowContact,
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
              ? "Share a private concern about this mentorship with authorised programme admins. The relevant participant is identified securely from this mentorship."
              : "Share a private concern about the Shepherds Programme with authorised programme admins. This report will not be linked to a specific mentorship."}
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="space-y-5 py-3">
            <div className="flex flex-col items-center rounded-lg bg-primary/5 px-5 py-7 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <CheckCircle2 className="size-6" />
              </span>
              <h3 className="mt-4 font-semibold">Report submitted</h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                The programme team has received your report. If you allowed
                contact, an administrator may follow up using your account
                details.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" onClick={() => setOpen(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="space-y-5">
              <div className="flex gap-3 rounded-lg bg-secondary/60 px-4 py-3 text-secondary-foreground">
                <ShieldAlert className="mt-0.5 size-4 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">For urgent safety needs</p>
                  <p className="mt-1 text-secondary-foreground/80">
                    If anyone is in immediate danger or needs urgent medical
                    help, contact local emergency services. This form is not
                    monitored continuously.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={category}
                    onValueChange={(value) =>
                      setCategory(value as IncidentCategory)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Severity</Label>
                  <Select
                    value={severity}
                    onValueChange={(value) =>
                      setSeverity(value as IncidentSeverity)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      {severityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="incident-date">
                  Date of incident{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="incident-date"
                  type="date"
                  value={occurredDate}
                  onChange={(event) => setOccurredDate(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="incident-description">What happened?</Label>
                <Textarea
                  id="incident-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder={
                    isMentorshipIncident
                      ? "Describe what happened in this mentorship and include any context the programme team should know..."
                      : "Describe what happened and include any people or programme context the team should know..."
                  }
                  rows={6}
                  minLength={20}
                  maxLength={5000}
                  required
                />
                <div className="flex justify-between gap-3 text-xs text-muted-foreground">
                  <span>At least 20 characters</span>
                  <span>{description.length}/5000</span>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg bg-muted/70 px-4 py-3">
                <Checkbox
                  id="incident-contact"
                  checked={allowContact}
                  onCheckedChange={(checked) => setAllowContact(checked === true)}
                />
                <div>
                  <Label htmlFor="incident-contact">
                    Programme admins may contact me
                  </Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Leave this unchecked if you do not want your contact details
                    shared with the admin reviewing the report.
                  </p>
                </div>
              </div>

              {errorMessage ? (
                <Alert variant="destructive">
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              ) : null}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setOpen(false)}
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
                Submit report
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
