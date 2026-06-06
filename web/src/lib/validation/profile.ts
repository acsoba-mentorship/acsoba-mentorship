import { z } from "zod";
import { GOALS_MAX_CHARACTERS } from "@/lib/onboarding/constants";
import { toStartOfMonth } from "@/lib/utils";

const usernameRegex = /^[a-z0-9](?:[a-z0-9_]*[a-z0-9])?$/;

export const aboutSchema = z.object({
  bio: z.string().max(2000).default(""),
  location: z.string().max(200).default(""),
  title: z.string().max(200).default(""),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(
      usernameRegex,
      "Use lowercase letters, numbers, or underscores (no leading/trailing underscore)"
    ),
});

export type AboutFormValues = z.infer<typeof aboutSchema>;
export type AboutFormInput = z.input<typeof aboutSchema>;

export const goalsSchema = z.object({
  goals: z
    .string()
    .trim()
    .min(1, "Goals are required")
    .max(GOALS_MAX_CHARACTERS, `Maximum ${GOALS_MAX_CHARACTERS} characters`),
});

export type GoalsFormValues = z.infer<typeof goalsSchema>;

export const interestsSchema = z.object({
  interests: z.array(z.string().min(1)),
});

export type InterestsFormValues = z.infer<typeof interestsSchema>;

// --- Education (matches Convex education entry) ---
const monthSchema = z.number().min(1).max(12);
const yearSchema = z.number().min(1900).max(2100);

function isEndDateAfterOrEqualStart(
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number
): boolean {
  return endYear > startYear || (endYear === startYear && endMonth >= startMonth);
}

export const educationEntryFieldsSchema = z.object({
  institution: z.string().min(1, "Institution is required").max(200),
  degree: z.string().max(200).optional().default(""),
  fieldOfStudy: z.string().max(200).optional().default(""),
  startMonth: monthSchema,
  startYear: yearSchema,
  endMonth: monthSchema.optional(),
  endYear: yearSchema.optional(),
  description: z.string().max(5000).optional().default(""),
});

export const educationEntrySchema = educationEntryFieldsSchema.superRefine(
  (data, ctx) => {
    if (data.endYear == null || data.endMonth == null) return;
    if (
      !isEndDateAfterOrEqualStart(
        data.startYear,
        data.startMonth,
        data.endYear,
        data.endMonth
      )
    ) {
      ctx.addIssue({
        code: "custom",
        message: "End date cannot be earlier than start date",
        path: ["endMonth"],
      });
      ctx.addIssue({
        code: "custom",
        message: " ",
        path: ["endYear"],
      });
    }
  }
);

export type EducationEntryFormValues = z.infer<typeof educationEntrySchema>;
export type EducationEntryFormInput = z.input<typeof educationEntrySchema>;

/** Parse form values into Convex education entry shape. */
export function educationFormToEntry(v: EducationEntryFormValues): {
  institution: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate: number;
  endDate?: number;
  description?: string;
} {
  const startDate = toStartOfMonth(v.startYear, v.startMonth);
  const hasEndDate = v.endYear != null && v.endMonth != null;
  const result: {
    institution: string;
    degree?: string;
    fieldOfStudy?: string;
    startDate: number;
    endDate?: number;
    description?: string;
  } = {
    institution: v.institution,
    startDate,
  };
  if (hasEndDate) result.endDate = toStartOfMonth(v.endYear!, v.endMonth!);
  if (v.degree) result.degree = v.degree;
  if (v.fieldOfStudy) result.fieldOfStudy = v.fieldOfStudy;
  if (v.description) result.description = v.description;
  return result;
}

// --- Experience (matches Convex experience entry) ---
export const experienceEntryFieldsSchema = z.object({
  company: z.string().min(1, "Company is required").max(200),
  title: z.string().min(1, "Title is required").max(200),
  startMonth: monthSchema,
  startYear: yearSchema,
  endMonth: monthSchema.optional(),
  endYear: yearSchema.optional(),
  current: z.boolean().optional().default(false),
  description: z.string().max(5000).optional().default(""),
});

export const experienceEntrySchema = experienceEntryFieldsSchema
  .refine(
    (data) => {
      if (data.current) return true;
      return data.endMonth != null && data.endYear != null;
    },
    {
      message: "End date is required when not currently working here",
      path: ["endMonth"],
    }
  )
  .superRefine((data, ctx) => {
    if (data.current || data.endYear == null || data.endMonth == null) return;
    if (
      !isEndDateAfterOrEqualStart(
        data.startYear,
        data.startMonth,
        data.endYear,
        data.endMonth
      )
    ) {
      ctx.addIssue({
        code: "custom",
        message: "End date cannot be earlier than start date",
        path: ["endMonth"],
      });
      ctx.addIssue({
        code: "custom",
        message: " ",
        path: ["endYear"],
      });
    }
  });

export type ExperienceEntryFormValues = z.infer<typeof experienceEntrySchema>;
export type ExperienceEntryFormInput = z.input<typeof experienceEntrySchema>;

// --- Mentor profile ---
export const mentorDetailsSchema = z.object({
  yearsOfExperience: z.number().int("Must be an integer").min(0, "Must be 0 or more").max(50),
  maxMentees: z.number().int("Must be an integer").min(1, "Must be at least 1").max(100),
  isAvailable: z.boolean(),
});

export type MentorDetailsFormValues = z.infer<typeof mentorDetailsSchema>;

export const mentorExpertiseSchema = z.object({
  expertise: z.array(z.string().min(1)),
});

export const userIndustriesSchema = z.object({
  industries: z.array(z.string().min(1)),
});

export type MentorExpertiseFormValues = z.infer<typeof mentorExpertiseSchema>;

/** Parse form values into Convex experience entry shape. */
export function experienceFormToEntry(v: ExperienceEntryFormValues): {
  company: string;
  title: string;
  startDate: number;
  endDate?: number;
  description?: string;
} {
  const startDate = toStartOfMonth(v.startYear, v.startMonth);
  const hasEndDate =
    !v.current && v.endYear != null && v.endMonth != null;
  return {
    company: v.company,
    title: v.title,
    startDate,
    ...(hasEndDate ? { endDate: toStartOfMonth(v.endYear!, v.endMonth!) } : {}),
    ...(v.description ? { description: v.description } : {}),
  };
}
