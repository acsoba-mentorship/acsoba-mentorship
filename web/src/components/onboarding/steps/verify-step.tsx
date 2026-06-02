"use client";

import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { useOnboardingDraft } from "@/components/onboarding/onboarding-provider";
import { Button } from "@/components/ui/button";

export function VerifyStep() {
  const { draft, updateDraft, goNext } = useOnboardingDraft();

  const handleContinue = () => {
    const nextDraft = { ...draft, membershipVerified: true };
    updateDraft({ membershipVerified: true });
    goNext(nextDraft);
  };

  return (
    <OnboardingShell
      title="Membership verification"
      description="Confirm you are part of the ACS OBA community."
      footer={
        <Button type="button" className="w-full" size="lg" onClick={handleContinue}>
          Yes, continue
        </Button>
      }
    >
      <div className="space-y-4 rounded-xl border bg-muted/30 p-6 text-sm text-muted-foreground">
        <p>
          Placeholder: membership checks (school email, member ID, or alumni
          verification) will be added here.
        </p>
        <p>
          For now, tap the button below to continue setting up your mentee
          profile.
        </p>
      </div>
    </OnboardingShell>
  );
}
