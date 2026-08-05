"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type DynamicQuestion = {
  questionKey: string;
  prompt: string;
  responseType:
    | "single_choice"
    | "multiple_choice"
    | "short_text"
    | "long_text";
  options?: string[];
  required: boolean;
  order: number;
};

export type DynamicAnswers = Record<string, string | string[]>;

export function getAnswerValidationError(
  questions: DynamicQuestion[],
  answers: DynamicAnswers
) {
  for (const question of questions) {
    const answer = answers[question.questionKey];
    const empty =
      answer === undefined ||
      (Array.isArray(answer) ? answer.length === 0 : answer.trim() === "");
    if (question.required && empty) {
      return `“${question.prompt}” is required.`;
    }
  }
  return null;
}

export function toAnswerInputs(
  questions: DynamicQuestion[],
  answers: DynamicAnswers
) {
  return questions.flatMap((question) => {
    const value = answers[question.questionKey];
    if (value === undefined) return [];
    if (Array.isArray(value) ? value.length === 0 : value.trim() === "") {
      return [];
    }
    return [{ questionKey: question.questionKey, value }];
  });
}

export function DynamicQuestionFields({
  questions,
  answers,
  onChange,
  disabled = false,
}: {
  questions: DynamicQuestion[];
  answers: DynamicAnswers;
  onChange: (answers: DynamicAnswers) => void;
  disabled?: boolean;
}) {
  const setAnswer = (questionKey: string, value: string | string[]) => {
    onChange({ ...answers, [questionKey]: value });
  };

  return (
    <div className="space-y-6">
      {questions.map((question) => {
        const fieldId = `question-${question.questionKey}`;
        const value = answers[question.questionKey];
        return (
          <fieldset key={question.questionKey} className="space-y-2">
            <legend className="text-sm font-medium">
              {question.prompt}
              {question.required ? (
                <span className="ml-1 text-destructive" aria-label="required">
                  *
                </span>
              ) : (
                <span className="ml-1 font-normal text-muted-foreground">
                  (optional)
                </span>
              )}
            </legend>

            {question.responseType === "single_choice" ? (
              <Select
                value={typeof value === "string" ? value : ""}
                onValueChange={(nextValue) =>
                  setAnswer(question.questionKey, nextValue)
                }
                disabled={disabled}
              >
                <SelectTrigger id={fieldId} className="w-full">
                  <SelectValue placeholder="Choose one answer" />
                </SelectTrigger>
                <SelectContent>
                  {question.options?.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}

            {question.responseType === "multiple_choice" ? (
              <div className="space-y-2 rounded-lg border p-3">
                {question.options?.map((option) => {
                  const selected = Array.isArray(value) ? value : [];
                  const optionId = `${fieldId}-${option.replace(/[^a-z0-9]/gi, "-")}`;
                  return (
                    <div key={option} className="flex items-center gap-3">
                      <Checkbox
                        id={optionId}
                        checked={selected.includes(option)}
                        disabled={disabled}
                        onCheckedChange={(checked) =>
                          setAnswer(
                            question.questionKey,
                            checked
                              ? [...selected, option]
                              : selected.filter((item) => item !== option)
                          )
                        }
                      />
                      <Label htmlFor={optionId} className="font-normal">
                        {option}
                      </Label>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {question.responseType === "short_text" ? (
              <Input
                id={fieldId}
                value={typeof value === "string" ? value : ""}
                onChange={(event) =>
                  setAnswer(question.questionKey, event.target.value)
                }
                maxLength={500}
                disabled={disabled}
                required={question.required}
              />
            ) : null}

            {question.responseType === "long_text" ? (
              <Textarea
                id={fieldId}
                value={typeof value === "string" ? value : ""}
                onChange={(event) =>
                  setAnswer(question.questionKey, event.target.value)
                }
                rows={5}
                maxLength={5000}
                disabled={disabled}
                required={question.required}
              />
            ) : null}
          </fieldset>
        );
      })}
    </div>
  );
}
