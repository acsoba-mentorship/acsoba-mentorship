import type { Infer } from "convex/values";
import type { setUserOnboardingCompleteArgsValidator } from "../../../convex/model/users/validators";
import type { menteeProfileValidator } from "../../../convex/model/users/fields";
import type { OnboardingDraft } from "@/components/onboarding/onboarding-draft";
import type { OnboardingRole } from "@/lib/onboarding";
import {
  educationFormToEntry,
  experienceFormToEntry,
} from "@/lib/validation/profile";
import { toStartOfDay } from "@/lib/utils";

type SubmitPayload = Infer<typeof setUserOnboardingCompleteArgsValidator>;

export function buildOnboardingSubmitPayload(
  draft: OnboardingDraft,
  email: string,
  role: OnboardingRole
): SubmitPayload {
  if (!draft.personal || !draft.career) {
    throw new Error("Onboarding draft is incomplete");
  }

  const { personal, career } = draft;
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

  const background = {
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
  };

  if (role === "mentor") {
    if (!draft.mentor) {
      throw new Error("Mentor onboarding draft is incomplete");
    }
    return {
      ...background,
      role,
      industries: draft.mentor.industries,
      mentorProfile: {
        yearsOfExperience: draft.mentor.yearsOfExperience,
        expertise: draft.mentor.expertise,
        maxMentees: draft.mentor.maxMentees,
        isAvailable: draft.mentor.isAvailable,
        isVisible: true,
      },
    };
  }

  if (!draft.interestsChapter || !draft.mentoring) {
    throw new Error("Mentee onboarding draft is incomplete");
  }

  return {
    ...background,
    role,
    interests: draft.interestsChapter.interests,
    industries: draft.interestsChapter.industries,
    menteeProfile: {
      goals: draft.mentoring.goals,
      commitmentLevel:
        draft.mentoring.commitmentLevel as Infer<
          typeof menteeProfileValidator.fields.commitmentLevel
        >,
      preferredCommunicationModes:
        draft.mentoring.preferredCommunicationModes as Infer<
          typeof menteeProfileValidator.fields.preferredCommunicationModes
        >,
    },
  };
}
