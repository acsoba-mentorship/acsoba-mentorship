"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/app/CurrentUserProvider";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { useOnboardingDraft } from "@/components/onboarding/onboarding-provider";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type VerificationStatus =
  | "idle"
  | "loading"
  | "success"
  | "skipped"
  | "error";

export function VerifyStep() {
  const { currentUser, isLoading: isUserLoading } = useCurrentUser();
  const { draft, updateDraft, goNext } = useOnboardingDraft();
  const verifyAcsobaMember = useAction(api.verification.verifyAcsobaMember);
  const [status, setStatus] = useState<VerificationStatus>(
    draft.membershipVerified ? "success" : "idle"
  );
  const [message, setMessage] = useState<string | null>(
    draft.membershipVerified ? "Membership verification is complete." : null
  );

  const email = currentUser?.authEmailNormalized?.trim() ?? "";
  const isComplete = status === "success" || status === "skipped";
  const isAccountLoading = isUserLoading || currentUser === undefined;

  const handlePrimaryAction = async () => {
    if (isComplete) {
      goNext({ ...draft, membershipVerified: true });
      return;
    }

    if (!email) {
      setStatus("error");
      setMessage(
        "We could not find an email address for your signed-in account. Contact support before continuing."
      );
      return;
    }

    setStatus("loading");
    setMessage(null);

    try {
      const result = await verifyAcsobaMember({});

      if (!result.success) {
        setStatus("error");
        setMessage(
          result.message ?? "We could not verify your membership. Please try again."
        );
        return;
      }

      const nextStatus = result.skipped ? "skipped" : "success";
      setStatus(nextStatus);
      setMessage(
        result.message ??
          (result.skipped
            ? "Your signed-in account is approved to continue."
            : "Your ACS OBA membership has been verified.")
      );
      updateDraft({ membershipVerified: true });
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "We could not verify your membership. Please try again."
      );
    }
  };

  const buttonLabel = isAccountLoading
    ? "Loading account…"
    : status === "loading"
      ? "Verifying…"
      : isComplete
        ? "Continue"
        : status === "error"
          ? "Try again"
          : "Verify membership";

  return (
    <OnboardingShell
      title="Membership verification"
      description="Confirm you are part of the ACS OBA community."
      footer={
        <Button
          type="button"
          className="w-full"
          size="lg"
          disabled={isAccountLoading || status === "loading"}
          onClick={handlePrimaryAction}
        >
          {status === "loading" ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : null}
          {buttonLabel}
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border bg-muted/30 p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Verify your signed-in email
              </p>
              <p className="text-sm text-muted-foreground">
                We will use{" "}
                <span className="font-medium text-foreground">
                  {email || "your Auth0 email"}
                </span>{" "}
                to confirm your access. Your email cannot be changed here.
              </p>
            </div>
          </div>
        </div>

        {status === "loading" ? (
          <Alert aria-live="polite">
            <Loader2 className="animate-spin" />
            <AlertTitle>Checking membership</AlertTitle>
            <AlertDescription>
              This usually takes only a few seconds.
            </AlertDescription>
          </Alert>
        ) : null}

        {isComplete ? (
          <Alert className="border-primary/30 bg-primary/5" aria-live="polite">
            <CheckCircle2 className="text-primary" />
            <AlertTitle>
              {status === "skipped"
                ? "Ready to continue"
                : "Membership verified"}
            </AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : null}

        {status === "error" ? (
          <Alert variant="destructive" aria-live="assertive">
            <AlertCircle />
            <AlertTitle>Verification unsuccessful</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : null}
      </div>
    </OnboardingShell>
  );
}
