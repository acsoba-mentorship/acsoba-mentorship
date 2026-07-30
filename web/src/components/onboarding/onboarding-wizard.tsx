"use client";

import {
  OnboardingProvider,
  useOnboardingDraft,
} from "@/components/onboarding/onboarding-provider";
import { BackgroundStep } from "@/components/onboarding/steps/background-step";
import { CareerStep } from "@/components/onboarding/steps/career-step";
import { EducationStep } from "@/components/onboarding/steps/education-step";
import { InterestsStep } from "@/components/onboarding/steps/interests-step";
import { MentoringStep } from "@/components/onboarding/steps/mentoring-step";
import { MentorStep } from "@/components/onboarding/steps/mentor-step";
import { ProfileStep } from "@/components/onboarding/steps/profile-step";
import { ReviewStep } from "@/components/onboarding/steps/review-step";
import { VerifyStep } from "@/components/onboarding/steps/verify-step";
import type { OnboardingRole } from "@/lib/onboarding";

function ActiveOnboardingStep() {
  const { step } = useOnboardingDraft();

  switch (step) {
    case "profile":
      return <ProfileStep />;
    case "verify":
      return <VerifyStep />;
    case "background":
      return <BackgroundStep />;
    case "education":
      return <EducationStep />;
    case "career":
      return <CareerStep />;
    case "interests":
      return <InterestsStep />;
    case "mentoring":
      return <MentoringStep />;
    case "mentor":
      return <MentorStep />;
    case "review":
      return <ReviewStep />;
    default:
      return <ProfileStep />;
  }
}

export function OnboardingWizard({ role }: { role: OnboardingRole }) {
  return (
    <OnboardingProvider role={role}>
      <ActiveOnboardingStep />
    </OnboardingProvider>
  );
}
