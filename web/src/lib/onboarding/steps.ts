import type { OnboardingDraft } from "@/components/onboarding/onboarding-draft";

export const ONBOARDING_STEPS = [
  { id: "profile", label: "Your details" },
  { id: "verify", label: "Membership verification" },
  { id: "background", label: "Background" },
  { id: "education", label: "Education" },
  { id: "career", label: "Career" },
  { id: "interests", label: "Interests" },
  { id: "mentoring", label: "Mentoring style" },
  { id: "review", label: "Review" },
] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number]["id"];

const TOTAL_PROGRESS_STEPS = 7;

function getBackgroundDetailStepId(
  draft: OnboardingDraft
): "education" | "career" | null {
  if (!draft.career) return null;
  if (draft.career.careerStage === "student") return "education";
  if (draft.career.careerStage === "professional") return "career";
  return null;
}

export function getNextStep(
  step: OnboardingStepId,
  draft: OnboardingDraft
): OnboardingStepId | null {
  switch (step) {
    case "profile":
      return "verify";
    case "verify":
      return "background";
    case "background":
      return getBackgroundDetailStepId(draft) ?? "interests";
    case "education":
    case "career":
      return "interests";
    case "interests":
      return "mentoring";
    case "mentoring":
      return "review";
    default:
      return null;
  }
}

export function getPreviousStep(
  step: OnboardingStepId,
  draft: OnboardingDraft
): OnboardingStepId | null {
  switch (step) {
    case "verify":
      return "profile";
    case "background":
      return "verify";
    case "education":
    case "career":
      return "background";
    case "interests":
      return getBackgroundDetailStepId(draft) ?? "background";
    case "mentoring":
      return "interests";
    case "review":
      return "mentoring";
    default:
      return null;
  }
}

export function getProgressPercent(step: OnboardingStepId): number {
  const stepNumberById: Record<OnboardingStepId, number> = {
    profile: 1,
    verify: 2,
    background: 3,
    education: 4,
    career: 4,
    interests: 5,
    mentoring: 6,
    review: 7,
  };

  return (stepNumberById[step] / TOTAL_PROGRESS_STEPS) * 100;
}
