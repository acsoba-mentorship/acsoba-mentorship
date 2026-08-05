"use client";

import { useQuery } from "convex/react";
import { Flag, HeartPulse } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import {
  AdminEmptyState,
  AdminSectionHeader,
  AdminSectionLoading,
  AdminStatusBadge,
  DownloadAllResponsesButton,
  formatAdminDate,
  formatAdminLabel,
} from "@/components/admin/admin-shared";
import {
  FormAnswerList,
  formatStoredAnswer,
} from "@/components/admin/form-answer-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function PulseSurveysSection() {
  const surveys = useQuery(api.admin.listPulseSurveys);
  if (surveys === undefined) return <AdminSectionLoading />;

  const answerColumns = [
    ...new Map(
      surveys.flatMap((survey) =>
        survey.answers.map((answer) => [answer.questionKey, answer.prompt] as const)
      )
    ).entries(),
  ];
  const supportFlags = surveys.filter((survey) =>
    survey.answers.some(
      (answer) => answer.questionKey === "pulse_needs_support" && answer.value === "Yes"
    )
  ).length;

  return (
    <div className="space-y-7">
      <AdminSectionHeader
        eyebrow="Relationship health"
        title="Pulse survey responses"
        description="Responses retain the exact question wording used when they were submitted, even after administrators edit the live form."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <AdminStatusBadge tone={supportFlags > 0 ? "warning" : "success"}>
              <Flag /> {supportFlags} support flag{supportFlags === 1 ? "" : "s"}
            </AdminStatusBadge>
            <DownloadAllResponsesButton
              filenamePrefix="pulse-survey-responses"
              headers={[
                "Respondent",
                "Respondent role",
                "Counterpart",
                "Counterpart role",
                "Cycle",
                ...answerColumns.map(([, prompt]) => prompt),
                "Submitted",
              ]}
              rows={surveys.map((survey) => [
                survey.respondentName,
                formatAdminLabel(survey.respondentRole),
                survey.counterpartName,
                formatAdminLabel(survey.counterpartRole),
                survey.cycleNumber,
                ...answerColumns.map(([key]) => {
                  const answer = survey.answers.find((item) => item.questionKey === key);
                  return answer ? formatStoredAnswer(answer.value) : null;
                }),
                formatAdminDate(survey.submittedAt),
              ])}
            />
          </div>
        }
      />

      {surveys.length === 0 ? (
        <Card>
          <AdminEmptyState
            icon={HeartPulse}
            title="No pulse responses yet"
            description="Submitted relationship-health responses will appear here."
          />
        </Card>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {surveys.map((survey) => (
            <Card key={String(survey._id)} className="overflow-hidden">
              <CardHeader className="border-b border-primary/10">
                <CardTitle className="text-lg text-primary">
                  {survey.respondentName}
                </CardTitle>
                <CardDescription>
                  {formatAdminLabel(survey.respondentRole)} · With {survey.counterpartName} ·
                  Cycle #{survey.cycleNumber} · Submitted {formatAdminDate(survey.submittedAt)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormAnswerList answers={survey.answers} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
