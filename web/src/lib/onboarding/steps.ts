import type { OnboardingDraft } from "@/components/onboarding/onboarding-draft";
import type { OnboardingRole } from "@/lib/onboarding";

export const ONBOARDING_STEPS = [
  { id: "profile", label: "Your details" },
  { id: "verify", label: "Membership verification" },
  { id: "background", label: "Background" },
  { id: "education", label: "Education" },
  { id: "career", label: "Career" },
  { id: "interests", label: "Interests" },
  { id: "mentoring", label: "Mentoring style" },
  { id: "mentor", label: "Mentor profile" },
  { id: "review", label: "Review" },
] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number]["id"];

function getBackgroundDetailStepId(
  draft: OnboardingDraft
): "education" | "career" | null {
  if (!draft.career) return null;
  if (draft.career.careerStage === "student") return "education";
  if (draft.career.careerStage === "professional") return "career";
  return null;
}

function getFlowSteps(
  draft: OnboardingDraft,
  role: OnboardingRole
): OnboardingStepId[] {
  const detailStep = getBackgroundDetailStepId(draft);
  return [
    "profile",
    "verify",
    "background",
    ...(detailStep ? [detailStep] : []),
    ...(role === "mentor"
      ? (["mentor"] as const)
      : (["interests", "mentoring"] as const)),
    "review",
  ];
}

export function getNextStep(
  step: OnboardingStepId,
  draft: OnboardingDraft,
  role: OnboardingRole
): OnboardingStepId | null {
  const steps = getFlowSteps(draft, role);
  const index = steps.indexOf(step);
  return index >= 0 ? (steps[index + 1] ?? null) : null;
}

export function getPreviousStep(
  step: OnboardingStepId,
  draft: OnboardingDraft,
  role: OnboardingRole
): OnboardingStepId | null {
  const steps = getFlowSteps(draft, role);
  const index = steps.indexOf(step);
  return index > 0 ? steps[index - 1] : null;
}

export function getProgressPercent(
  step: OnboardingStepId,
  draft: OnboardingDraft,
  role: OnboardingRole
): number {
  const steps = getFlowSteps(draft, role);
  const index = steps.indexOf(step);
  return index >= 0 ? ((index + 1) / steps.length) * 100 : 0;
}
