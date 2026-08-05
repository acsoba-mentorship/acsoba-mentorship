"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { CheckCircle2, Loader2, Plus, ShieldCheck } from "lucide-react";

import { api } from "../../../convex/_generated/api";
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
import { Textarea } from "@/components/ui/textarea";

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

/**
 * FR17: "Any users can offer internships. Basic internship information to
 * be filled in eg. Duration, paid/unpaid. Closing date to apply ...
 * Internship offeror must have authority to do so."
 */
export function OfferInternshipDialog() {
  const offerInternship = useMutation(api.internships.offer);

  const [open, setOpen] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("");
  const [description, setDescription] = useState("");
  const [startPeriod, setStartPeriod] = useState("");
  const [duration, setDuration] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [closingDate, setClosingDate] = useState("");
  const [confirmedAuthority, setConfirmedAuthority] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function resetForm() {
    setCompanyName("");
    setRole("");
    setDescription("");
    setStartPeriod("");
    setDuration("");
    setIsPaid(false);
    setClosingDate("");
    setConfirmedAuthority(false);
    setSubmitted(false);
    setErrorMessage(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isSubmitting) return;
    if (nextOpen) resetForm();
    setOpen(nextOpen);
  }

  async function handleSubmit() {
    if (!confirmedAuthority) {
      setErrorMessage(
        "Please confirm you have the authority to offer this internship."
      );
      return;
    }

    const cleanDescription = description.trim();
    if (cleanDescription.length < 20) {
      setErrorMessage(
        "Please provide at least 20 characters describing the internship."
      );
      return;
    }

    if (!closingDate) {
      setErrorMessage("Please choose a closing date to apply.");
      return;
    }
    const closingDateMs = new Date(`${closingDate}T23:59:59`).getTime();
    if (!Number.isFinite(closingDateMs) || closingDateMs <= Date.now()) {
      setErrorMessage("Closing date to apply must be in the future.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await offerInternship({
        companyName: companyName.trim(),
        role: role.trim(),
        description: cleanDescription,
        startPeriod: startPeriod.trim(),
        duration: duration.trim(),
        isPaid,
        closingDate: closingDateMs,
        confirmedAuthority,
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
        <Button type="button">
          <Plus />
          Offer an internship
        </Button>
      </DialogTrigger>

      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-xl"
        showCloseButton={!isSubmitting}
      >
        <DialogHeader>
          <DialogTitle>Offer an internship</DialogTitle>
          <DialogDescription>
            Similar to LinkedIn&apos;s &quot;Open to Hiring&quot; — share an
            internship opportunity with ACSOBA members who are still in
            school or between jobs.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="space-y-5 py-3">
            <div className="flex flex-col items-center rounded-lg bg-primary/5 px-5 py-7 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <CheckCircle2 className="size-6" />
              </span>
              <h3 className="mt-4 font-semibold">Internship posted</h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Eligible members can now see and express interest in this
                internship. You&apos;ll be notified as interest comes in.
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="internship-company">Company / organisation</Label>
                  <Input
                    id="internship-company"
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                    placeholder="e.g. Acme Pte Ltd"
                    maxLength={200}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="internship-role">Internship title</Label>
                  <Input
                    id="internship-role"
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                    placeholder="e.g. Software Engineering Intern"
                    maxLength={120}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="internship-start-period">
                    Approximate start period
                  </Label>
                  <Input
                    id="internship-start-period"
                    value={startPeriod}
                    onChange={(event) => setStartPeriod(event.target.value)}
                    placeholder="e.g. May to July 2027"
                    maxLength={80}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="internship-duration">Duration</Label>
                  <Input
                    id="internship-duration"
                    value={duration}
                    onChange={(event) => setDuration(event.target.value)}
                    placeholder="e.g. 3 months"
                    maxLength={60}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="internship-closing-date">
                    Closing date to apply
                  </Label>
                  <Input
                    id="internship-closing-date"
                    type="date"
                    value={closingDate}
                    onChange={(event) => setClosingDate(event.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg bg-muted/70 px-4 py-3">
                <Checkbox
                  id="internship-paid"
                  checked={isPaid}
                  onCheckedChange={(checked) => setIsPaid(checked === true)}
                />
                <Label htmlFor="internship-paid">
                  This internship is paid
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="internship-description">Description</Label>
                <Textarea
                  id="internship-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe the role, responsibilities, and who should apply..."
                  rows={5}
                  minLength={20}
                  maxLength={4000}
                  required
                />
                <p className="text-right text-xs text-muted-foreground">
                  {description.length}/4000
                </p>
              </div>

              <div className="flex items-start gap-3 rounded-lg bg-secondary/60 px-4 py-3 text-secondary-foreground">
                <Checkbox
                  id="internship-authority"
                  checked={confirmedAuthority}
                  onCheckedChange={(checked) =>
                    setConfirmedAuthority(checked === true)
                  }
                />
                <div>
                  <Label htmlFor="internship-authority" className="flex items-center gap-2">
                    <ShieldCheck className="size-4" />
                    I have the authority to offer this internship
                  </Label>
                  <p className="mt-1 text-xs text-secondary-foreground/80">
                    You&apos;re confirming you&apos;re authorised to make this
                    offer on behalf of the company or organisation named
                    above.
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
              <Button type="button" disabled={isSubmitting} onClick={handleSubmit}>
                {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
                Post internship
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
