export const ONBOARDING_STATUS = {
  INCOMPLETE: "incomplete",
  COMPLETE: "complete",
} as const;

export const ONBOARDING_ROLE = {
  MENTEE: "mentee",
  MENTOR: "mentor",
} as const;

export type OnboardingRole =
  (typeof ONBOARDING_ROLE)[keyof typeof ONBOARDING_ROLE];

export const ONBOARDING_PATHS: Record<OnboardingRole, string> = {
  mentee: "/onboarding/mentee",
  mentor: "/onboarding/mentor",
};

export const ROLE_ENROLLMENT_PATHS: Record<OnboardingRole, string> = {
  mentee: "/profile/add-mentee",
  mentor: "/profile/add-mentor",
};

export const ONBOARDING_START_PATH = ONBOARDING_PATHS.mentee;
export const POST_ONBOARDING_PATH = "/dashboard";
export const POST_MENTOR_ONBOARDING_PATH = "/mentor";

type RoleProfileState = {
  menteeProfile?: unknown;
  mentorProfile?: unknown;
};

export function getPrimaryAppPath(user?: RoleProfileState | null) {
  return user?.mentorProfile && !user.menteeProfile
    ? POST_MENTOR_ONBOARDING_PATH
    : POST_ONBOARDING_PATH;
}

export function getCompletedOnboardingPath(
  user: RoleProfileState,
  intendedRole: OnboardingRole
) {
  if (intendedRole === ONBOARDING_ROLE.MENTOR) {
    return user.mentorProfile
      ? POST_MENTOR_ONBOARDING_PATH
      : ROLE_ENROLLMENT_PATHS.mentor;
  }

  return user.menteeProfile
    ? POST_ONBOARDING_PATH
    : ROLE_ENROLLMENT_PATHS.mentee;
}

export { ONBOARDING_STEPS } from "./onboarding/steps";
export type { OnboardingStepId } from "./onboarding/steps";
