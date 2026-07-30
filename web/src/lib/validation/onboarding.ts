import { z } from "zod";
import {
  COMMITMENT_LEVEL_OPTIONS,
  GENDER_OPTIONS,
  GOALS_MAX_CHARACTERS,
  NATIONALITY_OPTIONS,
  ONBOARDING_TAG_MAX,
  ONBOARDING_TAG_MIN,
  PREFERRED_COMMUNICATION_MODE_OPTIONS,
  type GenderValue,
} from "@/lib/onboarding/constants";
import { experienceEntryFieldsSchema } from "@/lib/validation/profile";

const genderValues = GENDER_OPTIONS.map((o) => o.value) as [
  GenderValue,
  ...GenderValue[],
];
const nationalityValues = [...NATIONALITY_OPTIONS] as [string, ...string[]];

const tagSelectionSchema = z
  .array(z.string().trim().min(1).max(80))
  .min(ONBOARDING_TAG_MIN, `Select at least ${ONBOARDING_TAG_MIN}`)
  .max(ONBOARDING_TAG_MAX, `Select at most ${ONBOARDING_TAG_MAX}`)
  .refine(
    (values) =>
      new Set(values.map((value) => value.toLocaleLowerCase("en-SG"))).size ===
      values.length,
    "Select each option only once"
  );

export const personalDetailsSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().min(1, "Last name is required").max(80),
  birthDay: z.number().int().min(1).max(31),
  birthMonth: z.number().int().min(1).max(12),
  birthYear: z.number().int().min(1900).max(new Date().getFullYear()),
  gender: z.enum(genderValues),
  phoneNumber: z.string().trim().min(1, "Phone number is required").max(30),
  nationality: z.enum(nationalityValues),
});

export type PersonalDetailsFormValues = z.infer<typeof personalDetailsSchema>;
export type PersonalDetailsFormInput = z.input<typeof personalDetailsSchema>;

export const careerStageSchema = z.object({
  careerStage: z.enum([
    "student",
    "professional",
    "between_study_and_work",
  ]),
});

export type CareerStageFormValues = z.infer<typeof careerStageSchema>;

export const studentBackgroundSchema = z.object({
  institution: z.string().min(1, "Institution is required").max(200),
  degree: z.string().max(200).default(""),
  fieldOfStudy: z.string().max(200).default(""),
  startMonth: z.number().int().min(1).max(12),
  startYear: z.number().int().min(1900).max(2100),
});

export type StudentBackgroundFormValues = z.infer<typeof studentBackgroundSchema>;
export type StudentBackgroundFormInput = z.input<typeof studentBackgroundSchema>;

export const workingBackgroundSchema = experienceEntryFieldsSchema.pick({
  company: true,
  title: true,
  startMonth: true,
  startYear: true,
});

export type WorkingBackgroundFormValues = z.infer<typeof workingBackgroundSchema>;

export const interestsChapterSchema = z.object({
  industries: tagSelectionSchema,
  interests: tagSelectionSchema,
});

export type InterestsChapterFormValues = z.infer<typeof interestsChapterSchema>;

const commitmentValues = [...COMMITMENT_LEVEL_OPTIONS] as [string, ...string[]];
const communicationValues = [...PREFERRED_COMMUNICATION_MODE_OPTIONS] as [
  string,
  ...string[],
];

export const mentoringChapterSchema = z.object({
  commitmentLevel: z.enum(commitmentValues),
  preferredCommunicationModes: z
    .array(z.enum(communicationValues))
    .min(1, "Select at least one communication mode"),
  goals: z
    .string()
    .trim()
    .min(1, "Tell us a little about your goals")
    .max(GOALS_MAX_CHARACTERS, `Maximum ${GOALS_MAX_CHARACTERS} characters`),
});

export type MentoringChapterFormValues = z.infer<typeof mentoringChapterSchema>;
