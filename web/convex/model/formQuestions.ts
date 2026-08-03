import type { Infer } from "convex/values";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import {
  getAuthenticatedUser,
  requireAdmin,
  requireOnboardingComplete,
} from "./auth";
import { writeAdminAuditLog } from "./admin/audit";
import {
  feedbackFormTypeValidator,
  formAnswerInputValidator,
  questionResponseTypeValidator,
} from "./formQuestions/fields";

export type FeedbackFormType = Infer<typeof feedbackFormTypeValidator>;
export type QuestionResponseType = Infer<typeof questionResponseTypeValidator>;
export type FormAnswerInput = Infer<typeof formAnswerInputValidator>;

type Ctx = QueryCtx | MutationCtx;

type DefaultQuestion = {
  questionKey: string;
  formType: FeedbackFormType;
  prompt: string;
  responseType: QuestionResponseType;
  options?: string[];
  required: boolean;
  order: number;
  active: boolean;
};

const ratingOptions = ["1", "2", "3", "4", "5"];
const yesNoOptions = ["Yes", "No"];

const defaultQuestions: DefaultQuestion[] = [
  {
    questionKey: "exit_reason",
    formType: "exit_feedback",
    prompt: "Reason for ending the mentorship",
    responseType: "long_text",
    required: true,
    order: 10,
    active: true,
  },
  {
    questionKey: "exit_overall_rating",
    formType: "exit_feedback",
    prompt: "Overall rating",
    responseType: "single_choice",
    options: ratingOptions,
    required: true,
    order: 20,
    active: true,
  },
  {
    questionKey: "exit_goals_achieved",
    formType: "exit_feedback",
    prompt: "Were your goals achieved?",
    responseType: "single_choice",
    options: yesNoOptions,
    required: true,
    order: 30,
    active: true,
  },
  {
    questionKey: "exit_would_recommend",
    formType: "exit_feedback",
    prompt: "Would you recommend the programme?",
    responseType: "single_choice",
    options: yesNoOptions,
    required: true,
    order: 40,
    active: true,
  },
  {
    questionKey: "exit_highlights",
    formType: "exit_feedback",
    prompt: "Highlights",
    responseType: "long_text",
    required: false,
    order: 50,
    active: true,
  },
  {
    questionKey: "exit_improvements",
    formType: "exit_feedback",
    prompt: "What could have improved the experience?",
    responseType: "long_text",
    required: false,
    order: 60,
    active: true,
  },
  {
    questionKey: "exit_additional_comments",
    formType: "exit_feedback",
    prompt: "Additional comments",
    responseType: "long_text",
    required: false,
    order: 70,
    active: true,
  },
  {
    questionKey: "pulse_relationship_rating",
    formType: "pulse_survey",
    prompt: "How healthy and useful is this mentorship relationship?",
    responseType: "single_choice",
    options: ratingOptions,
    required: true,
    order: 10,
    active: true,
  },
  {
    questionKey: "pulse_communication_rating",
    formType: "pulse_survey",
    prompt: "How effective and consistent is the communication?",
    responseType: "single_choice",
    options: ratingOptions,
    required: true,
    order: 20,
    active: true,
  },
  {
    questionKey: "pulse_progress_rating",
    formType: "pulse_survey",
    prompt: "How well is the mentorship progressing?",
    responseType: "single_choice",
    options: ratingOptions,
    required: true,
    order: 30,
    active: true,
  },
  {
    questionKey: "pulse_needs_support",
    formType: "pulse_survey",
    prompt: "Do you need programme admin support?",
    responseType: "single_choice",
    options: yesNoOptions,
    required: true,
    order: 40,
    active: true,
  },
  {
    questionKey: "pulse_comments",
    formType: "pulse_survey",
    prompt: "Comments",
    responseType: "long_text",
    required: false,
    order: 50,
    active: true,
  },
  {
    questionKey: "incident_category",
    formType: "incident_report",
    prompt: "Which category best describes the incident?",
    responseType: "single_choice",
    options: ["Misconduct", "Harassment", "Safety concern", "Privacy concern", "Other"],
    required: true,
    order: 10,
    active: true,
  },
  {
    questionKey: "incident_severity",
    formType: "incident_report",
    prompt: "How urgent is this concern?",
    responseType: "single_choice",
    options: ["Low", "Medium", "High", "Urgent"],
    required: true,
    order: 20,
    active: true,
  },
  {
    questionKey: "incident_date",
    formType: "incident_report",
    prompt: "When did the incident occur?",
    responseType: "short_text",
    required: false,
    order: 30,
    active: true,
  },
  {
    questionKey: "incident_description",
    formType: "incident_report",
    prompt: "What happened?",
    responseType: "long_text",
    required: true,
    order: 40,
    active: true,
  },
  {
    questionKey: "incident_allow_contact",
    formType: "incident_report",
    prompt: "May programme admins contact you about this report?",
    responseType: "single_choice",
    options: yesNoOptions,
    required: true,
    order: 50,
    active: true,
  },
];

function normalizePrompt(prompt: string) {
  const clean = prompt.trim();
  if (!clean) throw new Error("Question text is required");
  if (clean.length > 500) {
    throw new Error("Question text must be 500 characters or fewer");
  }
  return clean;
}

function normalizeOptions(
  responseType: QuestionResponseType,
  options?: string[]
) {
  if (responseType === "short_text" || responseType === "long_text") {
    return undefined;
  }

  const normalized = [
    ...new Set((options ?? []).map((option) => option.trim()).filter(Boolean)),
  ];
  if (normalized.length < 2) {
    throw new Error("Choice questions require at least two distinct options");
  }
  if (normalized.length > 50) {
    throw new Error("Choice questions support at most 50 options");
  }
  if (normalized.some((option) => option.length > 200)) {
    throw new Error("Each choice must be 200 characters or fewer");
  }
  return normalized;
}

function normalizeOrder(order: number) {
  if (!Number.isFinite(order)) throw new Error("Question order is invalid");
  return Math.max(0, Math.floor(order));
}

export async function getEffectiveQuestions(
  ctx: Ctx,
  formType: FeedbackFormType,
  includeInactive = false
) {
  const stored = await ctx.db
    .query("formQuestions")
    .withIndex("by_formType", (q) => q.eq("formType", formType))
    .collect();
  const storedByKey = new Map(stored.map((question) => [question.questionKey, question]));
  const defaultKeys = new Set(
    defaultQuestions
      .filter((question) => question.formType === formType)
      .map((question) => question.questionKey)
  );

  const merged = defaultQuestions
    .filter((question) => question.formType === formType)
    .map((question) => {
      const override = storedByKey.get(question.questionKey);
      return override
        ? { ...override, isDefault: true }
        : { ...question, _id: null, _creationTime: null, isDefault: true };
    });

  for (const question of stored) {
    if (!defaultKeys.has(question.questionKey)) {
      merged.push({ ...question, isDefault: false });
    }
  }

  return merged
    .filter((question) => includeInactive || question.active)
    .sort((left, right) => left.order - right.order || left.prompt.localeCompare(right.prompt));
}

export async function listForForm(
  ctx: QueryCtx,
  { formType }: { formType: FeedbackFormType }
) {
  requireOnboardingComplete(await getAuthenticatedUser(ctx));
  return getEffectiveQuestions(ctx, formType);
}

export async function listForAdmin(
  ctx: QueryCtx,
  { formType }: { formType: FeedbackFormType }
) {
  await requireAdmin(ctx);
  return getEffectiveQuestions(ctx, formType, true);
}

export async function saveQuestion(
  ctx: MutationCtx,
  {
    questionKey,
    formType,
    prompt,
    responseType,
    options,
    required,
    order,
    active,
  }: {
    questionKey?: string;
    formType: FeedbackFormType;
    prompt: string;
    responseType: QuestionResponseType;
    options?: string[];
    required: boolean;
    order: number;
    active: boolean;
  }
) {
  const { user: admin } = await requireAdmin(ctx);
  const now = Date.now();
  const key = questionKey?.trim() || `custom_${now}_${Math.random().toString(36).slice(2, 10)}`;
  const existing = await ctx.db
    .query("formQuestions")
    .withIndex("by_questionKey", (q) => q.eq("questionKey", key))
    .unique();

  if (existing && existing.formType !== formType) {
    throw new Error("Question does not belong to this form");
  }

  const values = {
    questionKey: key,
    formType,
    prompt: normalizePrompt(prompt),
    responseType,
    options: normalizeOptions(responseType, options),
    required,
    order: normalizeOrder(order),
    active,
    updatedAt: now,
  };

  const id = existing
    ? (await ctx.db.patch("formQuestions", existing._id, values), existing._id)
    : await ctx.db.insert("formQuestions", { ...values, createdAt: now });

  await writeAdminAuditLog(ctx, {
    actorId: admin._id,
    action: existing ? "form_question.updated" : "form_question.created",
    targetType: "form_question",
    targetId: key,
    metadata: { formType, responseType, required, active },
  });

  return id;
}

export async function archiveQuestion(
  ctx: MutationCtx,
  { formType, questionKey }: { formType: FeedbackFormType; questionKey: string }
) {
  await requireAdmin(ctx);
  const questions = await getEffectiveQuestions(ctx, formType);
  if (questions.length <= 1) {
    throw new Error("A form must keep at least one active question");
  }
  const question = questions.find((item) => item.questionKey === questionKey);
  if (!question) throw new Error("Question not found");

  return saveQuestion(ctx, {
    questionKey,
    formType,
    prompt: question.prompt,
    responseType: question.responseType,
    options: question.options,
    required: question.required,
    order: question.order,
    active: false,
  });
}

function isEmpty(value: string | string[]) {
  return Array.isArray(value)
    ? value.length === 0
    : value.trim().length === 0;
}

export async function validateAndSnapshotAnswers(
  ctx: MutationCtx,
  formType: FeedbackFormType,
  inputs: FormAnswerInput[]
) {
  const questions = await getEffectiveQuestions(ctx, formType);
  const questionByKey = new Map(questions.map((question) => [question.questionKey, question]));
  const inputByKey = new Map<string, FormAnswerInput>();

  for (const input of inputs) {
    if (inputByKey.has(input.questionKey)) {
      throw new Error("A question was answered more than once");
    }
    if (!questionByKey.has(input.questionKey)) {
      throw new Error("This form contains a question that is no longer active");
    }
    inputByKey.set(input.questionKey, input);
  }

  return questions.flatMap((question) => {
    const input = inputByKey.get(question.questionKey);
    if (!input || isEmpty(input.value)) {
      if (question.required) {
        throw new Error(`“${question.prompt}” is required`);
      }
      return [];
    }

    let value: string | string[];
    if (question.responseType === "single_choice") {
      if (Array.isArray(input.value)) {
        throw new Error(`“${question.prompt}” accepts one answer`);
      }
      value = input.value.trim();
      if (!question.options?.includes(value)) {
        throw new Error(`Select a valid answer for “${question.prompt}”`);
      }
    } else if (question.responseType === "multiple_choice") {
      if (!Array.isArray(input.value)) {
        throw new Error(`“${question.prompt}” accepts multiple answers`);
      }
      value = [...new Set(input.value.map((item) => item.trim()).filter(Boolean))];
      if (value.some((item) => !question.options?.includes(item))) {
        throw new Error(`Select valid answers for “${question.prompt}”`);
      }
    } else {
      if (Array.isArray(input.value)) {
        throw new Error(`“${question.prompt}” requires a text answer`);
      }
      value = input.value.trim();
      const maximum = question.responseType === "short_text" ? 500 : 5000;
      if (value.length > maximum) {
        throw new Error(`“${question.prompt}” must be ${maximum} characters or fewer`);
      }
    }

    return [{
      questionKey: question.questionKey,
      prompt: question.prompt,
      responseType: question.responseType,
      value,
    }];
  });
}
