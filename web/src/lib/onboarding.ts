export const ONBOARDING_STATUS = {
  INCOMPLETE: "incomplete",
  COMPLETE: "complete",
} as const;

export const ONBOARDING_START_PATH = "/onboarding";
export const POST_ONBOARDING_PATH = "/dashboard";

export { ONBOARDING_STEPS } from "./onboarding/steps";
export type { OnboardingStepId } from "./onboarding/steps";
