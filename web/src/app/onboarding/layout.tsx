"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { RedirectToLanding } from "@/components/auth/redirects";
import { OnboardingProvider } from "@/components/onboarding/onboarding-provider";
import CompletedOnboardingGuard from "@/components/navigation/completed-onboarding-guard";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Unauthenticated>
        <RedirectToLanding />
      </Unauthenticated>

      <Authenticated>
        <CompletedOnboardingGuard>
          <OnboardingProvider>{children}</OnboardingProvider>
        </CompletedOnboardingGuard>
      </Authenticated>
    </>
  );
}
