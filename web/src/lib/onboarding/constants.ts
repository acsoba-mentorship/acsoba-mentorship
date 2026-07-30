// TODO: Sync with backend so that there is no need for duplicate changes here and in the backend

export const COMMITMENT_LEVEL_OPTIONS = [
  "Weekly",
  "Twice a week",
  "Biweekly",
  "Monthly",
] as const;

export const PREFERRED_COMMUNICATION_MODE_OPTIONS = [
  "Video call",
  "Voice call",
  "Email",
  "Meetup",
  "Chat",
] as const;

export const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
] as const;

export type GenderValue = (typeof GENDER_OPTIONS)[number]["value"];

export const CAREER_STAGE_UI = {
  STUDENT: "student",
  WORKING: "professional",
  BETWEEN_STUDY_AND_WORK: "between_study_and_work",
} as const;

export const PRESET_INDUSTRIES = [
  "Technology",
  "Finance",
  "Healthcare",
  "Education",
  "Consulting",
  "Marketing",
  "Engineering",
  "Legal",
] as const;

export const PRESET_INTERESTS = [
  "Leadership",
  "Career growth",
  "Networking",
  "Public speaking",
  "Entrepreneurship",
  "Work-life balance",
  "Technical skills",
  "Interview prep",
] as const;

export const NATIONALITY_OPTIONS = [
  "Singapore",
  "Malaysia",
  "Indonesia",
  "Philippines",
  "Thailand",
  "Vietnam",
  "United States",
  "United Kingdom",
  "Australia",
  "India",
  "China",
  "Japan",
  "South Korea",
  "Other",
] as const;

export const ONBOARDING_TAG_MIN = 1;
export const ONBOARDING_TAG_MAX = 3;
export const GOALS_MAX_CHARACTERS = 250;
