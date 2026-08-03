"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { RedirectToLanding } from "@/components/auth/redirects";
import { RequireOnboardingGuard } from "@/components/navigation/onboarding-guard";
import { CompulsoryExitFeedback } from "@/components/mentorships/compulsory-exit-feedback";

export default function ExitFeedbackPage() {
  return (
    <>
      <Unauthenticated>
        <RedirectToLanding />
      </Unauthenticated>
      <Authenticated>
        <RequireOnboardingGuard>
          <CompulsoryExitFeedback />
        </RequireOnboardingGuard>
      </Authenticated>
    </>
  );
}
