"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Archive, ListChecks, Loader2, Pencil, Plus, RotateCcw } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import {
  AdminEmptyState,
  AdminError,
  AdminSectionHeader,
  AdminSectionLoading,
  AdminStatusBadge,
  getErrorMessage,
} from "@/components/admin/admin-shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";

type FormType = "exit_feedback" | "pulse_survey" | "incident_report";
type ResponseType =
  | "single_choice"
  | "multiple_choice"
  | "short_text"
  | "long_text";
type Question = FunctionReturnType<typeof api.formQuestions.listForAdmin>[number];

type Draft = {
  questionKey?: string;
  prompt: string;
  responseType: ResponseType;
  optionsText: string;
  required: boolean;
  order: string;
  active: boolean;
};

const formTabs: Array<{ value: FormType; label: string }> = [
  { value: "exit_feedback", label: "Exit feedback" },
  { value: "pulse_survey", label: "Pulse surveys" },
  { value: "incident_report", label: "Incident reports" },
];

const responseTypes: Array<{ value: ResponseType; label: string }> = [
  { value: "single_choice", label: "Multiple choice — one answer" },
  { value: "multiple_choice", label: "Multiple choice — multiple answers" },
  { value: "short_text", label: "Short text" },
  { value: "long_text", label: "Long text" },
];

function toDraft(question: Question): Draft {
  return {
    questionKey: question.questionKey,
    prompt: question.prompt,
    responseType: question.responseType,
    optionsText: question.options?.join("\n") ?? "",
    required: question.required,
    order: String(question.order),
    active: question.active,
  };
}

export function FormQuestionsSection() {
  const [formType, setFormType] = useState<FormType>("exit_feedback");
  const questions = useQuery(api.formQuestions.listForAdmin, { formType });
  const saveQuestion = useMutation(api.formQuestions.saveQuestion);
  const archiveQuestion = useMutation(api.formQuestions.archiveQuestion);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (questions === undefined) return <AdminSectionLoading rows={5} />;

  const choiceType =
    draft?.responseType === "single_choice" ||
    draft?.responseType === "multiple_choice";

  async function handleSave() {
    if (!draft) return;
    setIsSaving(true);
    setError(null);
    try {
      await saveQuestion({
        questionKey: draft.questionKey,
        formType,
        prompt: draft.prompt,
        responseType: draft.responseType,
        options: choiceType
          ? draft.optionsText.split("\n").map((option) => option.trim())
          : undefined,
        required: draft.required,
        order: Number(draft.order),
        active: draft.active,
      });
      setDraft(null);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  async function setQuestionActive(question: Question, active: boolean) {
    setError(null);
    try {
      if (!active) {
        await archiveQuestion({ formType, questionKey: question.questionKey });
      } else {
        await saveQuestion({
          questionKey: question.questionKey,
          formType,
          prompt: question.prompt,
          responseType: question.responseType,
          options: question.options,
          required: question.required,
          order: question.order,
          active: true,
        });
      }
    } catch (mutationError) {
      setError(getErrorMessage(mutationError));
    }
  }

  return (
    <div className="space-y-7">
      <AdminSectionHeader
        eyebrow="Form configuration"
        title="Questions"
        description="Edit the questions participants see, choose the answer format, and control which responses are compulsory. Existing submissions retain their original question wording."
        action={
          <Button
            onClick={() =>
              setDraft({
                prompt: "",
                responseType: "short_text",
                optionsText: "",
                required: false,
                order: String((questions.at(-1)?.order ?? 0) + 10),
                active: true,
              })
            }
          >
            <Plus /> Add question
          </Button>
        }
      />

      <div className="flex gap-2 overflow-x-auto rounded-xl border bg-card p-2">
        {formTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => {
              setFormType(tab.value);
              setDraft(null);
              setError(null);
            }}
            className={cn(
              "shrink-0 rounded-lg px-4 py-2 text-sm font-semibold",
              formType === tab.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? <AdminError message={error} /> : null}

      {questions.length === 0 ? (
        <Card>
          <AdminEmptyState
            icon={ListChecks}
            title="No questions configured"
            description="Add a question to make this form available."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {questions.map((question) => (
            <Card key={question.questionKey} className={cn(!question.active && "opacity-60")}>
              <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <AdminStatusBadge tone={question.active ? "success" : "neutral"}>
                      {question.active ? "Active" : "Archived"}
                    </AdminStatusBadge>
                    <AdminStatusBadge tone={question.required ? "warning" : "info"}>
                      {question.required ? "Compulsory" : "Optional"}
                    </AdminStatusBadge>
                    <span className="text-xs text-muted-foreground">
                      {responseTypes.find((type) => type.value === question.responseType)?.label}
                    </span>
                  </div>
                  <p className="mt-3 font-semibold text-primary">{question.prompt}</p>
                  {question.options?.length ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {question.options.join(" · ")}
                    </p>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setDraft(toDraft(question))}>
                    <Pencil /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void setQuestionActive(question, !question.active)}
                  >
                    {question.active ? <Archive /> : <RotateCcw />}
                    {question.active ? "Archive" : "Restore"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{draft?.questionKey ? "Edit question" : "Add question"}</DialogTitle>
            <DialogDescription>
              Choice options are stored one per line. Submitted responses keep a snapshot of the question.
            </DialogDescription>
          </DialogHeader>
          {draft ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="question-prompt">Question</Label>
                <Textarea
                  id="question-prompt"
                  value={draft.prompt}
                  onChange={(event) => setDraft({ ...draft, prompt: event.target.value })}
                  maxLength={500}
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Answer format</Label>
                  <Select
                    value={draft.responseType}
                    onValueChange={(value) =>
                      setDraft({ ...draft, responseType: value as ResponseType })
                    }
                  >
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {responseTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="question-order">Display order</Label>
                  <Input
                    id="question-order"
                    type="number"
                    min={0}
                    value={draft.order}
                    onChange={(event) => setDraft({ ...draft, order: event.target.value })}
                  />
                </div>
              </div>
              {choiceType ? (
                <div className="space-y-2">
                  <Label htmlFor="question-options">Options — one per line</Label>
                  <Textarea
                    id="question-options"
                    value={draft.optionsText}
                    onChange={(event) => setDraft({ ...draft, optionsText: event.target.value })}
                    rows={6}
                  />
                </div>
              ) : null}
              <div className="flex items-start gap-3 rounded-lg bg-muted p-3">
                <Checkbox
                  id="question-required"
                  checked={draft.required}
                  onCheckedChange={(checked) => setDraft({ ...draft, required: checked === true })}
                />
                <Label htmlFor="question-required" className="font-normal">
                  Participants must answer this question before submitting.
                </Label>
              </div>
              {error ? <AdminError message={error} /> : null}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>Cancel</Button>
            <Button disabled={isSaving} onClick={handleSave}>
              {isSaving ? <Loader2 className="animate-spin" /> : null}
              Save question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
