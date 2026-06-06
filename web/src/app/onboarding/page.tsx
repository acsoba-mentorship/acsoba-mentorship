"use client";

import { useOnboardingDraft } from "@/components/onboarding/onboarding-provider";
import { BackgroundStep } from "@/components/onboarding/steps/background-step";
import { CareerStep } from "@/components/onboarding/steps/career-step";
import { EducationStep } from "@/components/onboarding/steps/education-step";
import { InterestsStep } from "@/components/onboarding/steps/interests-step";
import { MentoringStep } from "@/components/onboarding/steps/mentoring-step";
import { ProfileStep } from "@/components/onboarding/steps/profile-step";
import { ReviewStep } from "@/components/onboarding/steps/review-step";
import { VerifyStep } from "@/components/onboarding/steps/verify-step";

export default function OnboardingPage() {
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
    case "review":
      return <ReviewStep />;
    default:
      return <ProfileStep />;
  }
}
