"use client";

import { useQuery } from "convex/react";
import { MessageSquareQuote } from "lucide-react";
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

export function ExitFeedbackSection() {
  const feedback = useQuery(api.exitFeedback.listForAdmin);
  if (feedback === undefined) return <AdminSectionLoading />;

  const answerColumns = [
    ...new Map(
      feedback.flatMap((item) =>
        item.answers.map((answer) => [answer.questionKey, answer.prompt] as const)
      )
    ).entries(),
  ];

  return (
    <div className="space-y-7">
      <AdminSectionHeader
        eyebrow="Programme learning"
        title="Exit feedback"
        description="Independent reflections from mentors and mentees. Each response preserves the question wording that was live at submission time."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <AdminStatusBadge tone="info">
              {feedback.length} response{feedback.length === 1 ? "" : "s"}
            </AdminStatusBadge>
            <DownloadAllResponsesButton
              filenamePrefix="exit-feedback-responses"
              headers={[
                "Respondent",
                "Respondent role",
                "Counterpart",
                "Counterpart role",
                ...answerColumns.map(([, prompt]) => prompt),
                "Submitted",
              ]}
              rows={feedback.map((item) => [
                item.respondentName,
                formatAdminLabel(item.respondentRole),
                item.counterpartName,
                formatAdminLabel(item.counterpartRole),
                ...answerColumns.map(([key]) => {
                  const answer = item.answers.find((candidate) => candidate.questionKey === key);
                  return answer ? formatStoredAnswer(answer.value) : null;
                }),
                formatAdminDate(item.submittedAt),
              ])}
            />
          </div>
        }
      />

      {feedback.length === 0 ? (
        <Card>
          <AdminEmptyState
            icon={MessageSquareQuote}
            title="No exit feedback yet"
            description="Submitted mentor and mentee exit responses will appear here."
          />
        </Card>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {feedback.map((item) => (
            <Card key={String(item._id)} className="overflow-hidden">
              <CardHeader className="border-b border-primary/10">
                <CardTitle className="text-lg text-primary">
                  {item.respondentName}
                </CardTitle>
                <CardDescription>
                  {formatAdminLabel(item.respondentRole)} · With {item.counterpartName} (
                  {formatAdminLabel(item.counterpartRole)}) · Submitted {formatAdminDate(item.submittedAt)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormAnswerList answers={item.answers} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
