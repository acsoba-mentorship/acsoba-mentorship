import { z } from "zod";

export const aboutSchema = z.object({
  bio: z.string().max(2000).default(""),
  location: z.string().max(200).default(""),
  title: z.string().max(200).default(""),
});

export type AboutFormValues = z.infer<typeof aboutSchema>;
export type AboutFormInput = z.input<typeof aboutSchema>;

export const goalsSchema = z.object({
  goals: z.string().min(1, "Goals are required").max(2000),
});

export type GoalsFormValues = z.infer<typeof goalsSchema>;

export const interestsSchema = z.object({
  interests: z.array(z.string().min(1)),
});

export type InterestsFormValues = z.infer<typeof interestsSchema>;

// --- Education (matches Convex education entry) ---
const monthSchema = z.number().min(1).max(12);
const yearSchema = z.number().min(1900).max(2100);

export const educationEntrySchema = z.object({
  institution: z.string().min(1, "Institution is required").max(200),
  degree: z.string().max(200).optional().default(""),
  fieldOfStudy: z.string().max(200).optional().default(""),
  startMonth: monthSchema,
  startYear: yearSchema,
  endMonth: monthSchema.optional(),
  endYear: yearSchema.optional(),
  description: z.string().max(5000).optional().default(""),
});

export type EducationEntryFormValues = z.infer<typeof educationEntrySchema>;
export type EducationEntryFormInput = z.input<typeof educationEntrySchema>;

/** Convert form month/year to Convex timestamp (start of month UTC). */
export function toStartOfMonth(year: number, month: number): number {
  return Date.UTC(year, month - 1, 1);
}

/** Get year and month (1-12) from a Convex timestamp for form defaults. */
export function fromTimestamp(ts: number): { year: number; month: number } {
  const d = new Date(ts);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

/** Parse form values into Convex education entry shape. */
export function educationFormToEntry(v: EducationEntryFormValues): {
  institution: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate: number;
  endDate: number;
  description?: string;
} {
  const startDate = toStartOfMonth(v.startYear, v.startMonth);
  const endDate =
    v.endYear != null && v.endMonth != null
      ? toStartOfMonth(v.endYear, v.endMonth)
      : Date.now();
  const result: {
    institution: string;
    degree?: string;
    fieldOfStudy?: string;
    startDate: number;
    endDate: number;
    description?: string;
  } = {
    institution: v.institution,
    startDate,
    endDate,
  };
  if (v.degree) result.degree = v.degree;
  if (v.fieldOfStudy) result.fieldOfStudy = v.fieldOfStudy;
  if (v.description) result.description = v.description;
  return result;
}

// --- Experience (matches Convex experience entry) ---
export const experienceEntrySchema = z
  .object({
    company: z.string().min(1, "Company is required").max(200),
    title: z.string().min(1, "Title is required").max(200),
    startMonth: monthSchema,
    startYear: yearSchema,
    endMonth: monthSchema.optional(),
    endYear: yearSchema.optional(),
    current: z.boolean().optional().default(false),
    description: z.string().max(5000).optional().default(""),
  })
  .refine(
    (data) => {
      if (data.current) return true;
      return data.endMonth != null && data.endYear != null;
    },
    { message: "End date is required when not currently working here", path: ["endMonth"] }
  );

export type ExperienceEntryFormValues = z.infer<typeof experienceEntrySchema>;
export type ExperienceEntryFormInput = z.input<typeof experienceEntrySchema>;

/** Parse form values into Convex experience entry shape. */
export function experienceFormToEntry(v: ExperienceEntryFormValues): {
  company: string;
  title: string;
  startDate: number;
  endDate: number;
  description?: string;
} {
  const startDate = toStartOfMonth(v.startYear, v.startMonth);
  const endDate = v.current
    ? Date.now()
    : v.endYear != null && v.endMonth != null
      ? toStartOfMonth(v.endYear, v.endMonth)
      : startDate;
  return {
    company: v.company,
    title: v.title,
    startDate,
    endDate,
    ...(v.description ? { description: v.description } : {}),
  };
}
