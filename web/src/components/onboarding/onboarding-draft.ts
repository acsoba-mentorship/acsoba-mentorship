import type { PersonalDetailsFormValues } from "@/lib/validation/onboarding";
import type { CareerStageFormValues } from "@/lib/validation/onboarding";
import type { StudentBackgroundFormValues } from "@/lib/validation/onboarding";
import type { WorkingBackgroundFormValues } from "@/lib/validation/onboarding";
import type { InterestsChapterFormValues } from "@/lib/validation/onboarding";
import type { MentoringChapterFormValues } from "@/lib/validation/onboarding";

export type OnboardingDraft = {
  personal?: PersonalDetailsFormValues;
  membershipVerified?: boolean;
  career?: CareerStageFormValues;
  studentBackground?: StudentBackgroundFormValues;
  workingBackground?: WorkingBackgroundFormValues;
  interestsChapter?: InterestsChapterFormValues;
  mentoring?: MentoringChapterFormValues;
};
