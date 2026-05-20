import type { Infer } from "convex/values";
import type { setUserOnboardingCompleteArgsValidator } from "../../../convex/model/users/validators";
import type { menteeProfileValidator } from "../../../convex/model/users/fields";
import type { OnboardingDraft } from "@/components/onboarding/onboarding-draft";
import {
  educationFormToEntry,
  experienceFormToEntry,
} from "@/lib/validation/profile";
import { toStartOfDay } from "@/lib/utils";

type SubmitPayload = Infer<typeof setUserOnboardingCompleteArgsValidator>;

export function buildOnboardingSubmitPayload(
  draft: OnboardingDraft,
  email: string
): SubmitPayload {
  if (
    !draft.personal ||
    !draft.career ||
    !draft.interestsChapter ||
    !draft.mentoring
  ) {
    throw new Error("Onboarding draft is incomplete");
  }

  const { personal, career, interestsChapter, mentoring } = draft;
  const name = `${personal.firstName.trim()} ${personal.lastName.trim()}`.trim();

  const education =
    career.careerStage === "student" && draft.studentBackground
      ? [
          educationFormToEntry({
            ...draft.studentBackground,
            degree: draft.studentBackground.degree ?? "",
            fieldOfStudy: draft.studentBackground.fieldOfStudy ?? "",
            description: "",
          }),
        ]
      : [];

  const experience =
    career.careerStage === "professional" && draft.workingBackground
      ? [
          experienceFormToEntry({
            company: draft.workingBackground.company,
            title: draft.workingBackground.title,
            startMonth: draft.workingBackground.startMonth,
            startYear: draft.workingBackground.startYear,
            current: true,
            description: "",
          }),
        ]
      : [];

  return {
    personalDetails: {
      name,
      email,
      gender: personal.gender,
      nationality: personal.nationality,
      phoneNumber: personal.phoneNumber,
      dateOfBirth: toStartOfDay(
        personal.birthYear,
        personal.birthMonth,
        personal.birthDay
      ),
    },
    careerStage: career.careerStage,
    education,
    experience,
    interests: interestsChapter.interests,
    industries: interestsChapter.industries,
    menteeProfile: {
      goals: mentoring.goals,
      commitmentLevel:
        mentoring.commitmentLevel as Infer<
          typeof menteeProfileValidator.fields.commitmentLevel
        >,
      preferredCommunicationModes:
        mentoring.preferredCommunicationModes as Infer<
          typeof menteeProfileValidator.fields.preferredCommunicationModes
        >,
    },
  };
}
