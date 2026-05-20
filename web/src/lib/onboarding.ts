export const ONBOARDING_STATUS = {
  INCOMPLETE: "incomplete",
  COMPLETE: "complete",
} as const;

export const ONBOARDING_START_PATH = "/onboarding/profile"; // Path to redirect after login if onboarding is incomplete
export const POST_ONBOARDING_PATH = "/dashboard"; // Path to redirect after onboarding is complete
