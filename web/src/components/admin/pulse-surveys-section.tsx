"use client";

import { useQuery } from "convex/react";
import { Flag, HeartPulse, MessageSquareText } from "lucide-react";

import { api } from "../../../convex/_generated/api";
import {
  AdminEmptyState,
  AdminRating,
  AdminSectionHeader,
  AdminSectionLoading,
  AdminStatusBadge,
  formatAdminDate,
  formatAdminLabel,
} from "@/components/admin/admin-shared";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function averageRating(values: Array<number | null>) {
  const ratings = values.filter((value): value is number => value !== null);
  if (ratings.length === 0) return "—";
  return (
    ratings.reduce((total, value) => total + value, 0) / ratings.length
  ).toFixed(1);
}

export function PulseSurveysSection() {
  const surveys = useQuery(api.admin.listPulseSurveys);

  if (surveys === undefined) {
    return <AdminSectionLoading />;
  }

  const supportFlags = surveys.filter((survey) => survey.needsSupport).length;
  const relationshipAverage = averageRating(
    surveys.map((survey) => survey.relationshipRating)
  );
  const progressAverage = averageRating(
    surveys.map((survey) => survey.progressRating)
  );

  return (
    <div className="space-y-7">
      <AdminSectionHeader
        eyebrow="Relationship health"
        title="Pulse survey responses"
        description="Submitted pulse responses are visible to programme administrators and remain hidden from the respondent's mentorship counterpart."
        action={
          <AdminStatusBadge tone={supportFlags > 0 ? "warning" : "success"}>
            {supportFlags} support flag{supportFlags === 1 ? "" : "s"}
          </AdminStatusBadge>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="py-5">
          <CardContent className="px-5">
            <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
              Responses received
            </p>
            <p className="mt-2 text-3xl font-bold text-primary">
              {surveys.length}
            </p>
          </CardContent>
        </Card>
        <Card className="py-5">
          <CardContent className="px-5">
            <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
              Relationship average
            </p>
            <p className="mt-2 text-3xl font-bold text-primary">
              {relationshipAverage}
              {relationshipAverage !== "—" && (
                <span className="text-base text-[#987721]"> / 5</span>
              )}
            </p>
          </CardContent>
        </Card>
        <Card className="py-5">
          <CardContent className="px-5">
            <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
              Progress average
            </p>
            <p className="mt-2 text-3xl font-bold text-primary">
              {progressAverage}
              {progressAverage !== "—" && (
                <span className="text-base text-[#987721]"> / 5</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden py-0">
        {surveys.length === 0 ? (
          <AdminEmptyState
            icon={HeartPulse}
            title="No pulse responses yet"
            description="Submitted relationship-health responses will appear here."
          />
        ) : (
          <>
            <CardHeader className="border-b py-5">
              <CardTitle className="text-lg">Response register</CardTitle>
              <CardDescription>
                Ratings use a five-point scale. Comments may contain sensitive
                programme feedback.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-[#f2efe5]">
                  <TableRow>
                    <TableHead className="pl-5">Respondent</TableHead>
                    <TableHead>Cycle</TableHead>
                    <TableHead>Relationship</TableHead>
                    <TableHead>Communication</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Support</TableHead>
                    <TableHead className="min-w-72">Comments</TableHead>
                    <TableHead className="pr-5">Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {surveys.map((survey) => (
                    <TableRow key={String(survey._id)}>
                      <TableCell className="pl-5">
                        <p className="font-semibold text-primary">
                          {survey.respondentName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatAdminLabel(survey.respondentRole)}
                        </p>
                      </TableCell>
                      <TableCell>#{survey.cycleNumber}</TableCell>
                      <TableCell>
                        <AdminRating value={survey.relationshipRating} />
                      </TableCell>
                      <TableCell>
                        <AdminRating value={survey.communicationRating} />
                      </TableCell>
                      <TableCell>
                        <AdminRating value={survey.progressRating} />
                      </TableCell>
                      <TableCell>
                        {survey.needsSupport ? (
                          <AdminStatusBadge tone="warning">
                            <Flag />
                            Requested
                          </AdminStatusBadge>
                        ) : (
                          <AdminStatusBadge tone="success">
                            No flag
                          </AdminStatusBadge>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        <div className="flex items-start gap-2">
                          <MessageSquareText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                          <span className="line-clamp-3 leading-5 text-muted-foreground">
                            {survey.comments || "No comments provided"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="pr-5">
                        {formatAdminDate(survey.submittedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
