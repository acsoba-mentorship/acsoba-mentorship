"use client";

import { useQuery } from "convex/react";
import {
  CheckCircle2,
  MessageSquareQuote,
  Star,
  ThumbsUp,
} from "lucide-react";

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

function percentage(count: number, total: number) {
  return total === 0 ? 0 : Math.round((count / total) * 100);
}

export function ExitFeedbackSection() {
  const feedback = useQuery(api.exitFeedback.listForAdmin);

  if (feedback === undefined) {
    return <AdminSectionLoading />;
  }

  const ratings = feedback
    .map((item) => item.overallRating)
    .filter((rating): rating is number => rating !== null);
  const averageRating =
    ratings.length > 0
      ? (
          ratings.reduce((total, rating) => total + rating, 0) / ratings.length
        ).toFixed(1)
      : "—";
  const recommendCount = feedback.filter(
    (item) => item.wouldRecommend === true
  ).length;
  const goalsCount = feedback.filter(
    (item) => item.goalsAchieved === true
  ).length;

  return (
    <div className="space-y-7">
      <AdminSectionHeader
        eyebrow="Programme learning"
        title="Exit feedback"
        description="Independent reflections from mentors and mentees after a mentorship concludes. Responses are restricted to programme administrators."
        action={
          <AdminStatusBadge tone="info">
            {feedback.length} response{feedback.length === 1 ? "" : "s"}
          </AdminStatusBadge>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="py-5">
          <CardContent className="flex items-center justify-between px-5">
            <div>
              <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                Average rating
              </p>
              <p className="mt-2 text-3xl font-bold text-primary">
                {averageRating}
                {averageRating !== "—" && (
                  <span className="text-base text-[#987721]"> / 5</span>
                )}
              </p>
            </div>
            <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-[#80651f]">
              <Star className="size-5" />
            </span>
          </CardContent>
        </Card>
        <Card className="py-5">
          <CardContent className="flex items-center justify-between px-5">
            <div>
              <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                Would recommend
              </p>
              <p className="mt-2 text-3xl font-bold text-primary">
                {percentage(recommendCount, feedback.length)}%
              </p>
            </div>
            <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
              <ThumbsUp className="size-5" />
            </span>
          </CardContent>
        </Card>
        <Card className="py-5">
          <CardContent className="flex items-center justify-between px-5">
            <div>
              <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                Goals achieved
              </p>
              <p className="mt-2 text-3xl font-bold text-primary">
                {percentage(goalsCount, feedback.length)}%
              </p>
            </div>
            <span className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-800">
              <CheckCircle2 className="size-5" />
            </span>
          </CardContent>
        </Card>
      </div>

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
              <CardHeader className="border-b border-primary/10 pb-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg text-primary">
                      {item.respondentName}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {formatAdminLabel(item.respondentRole)} · Submitted{" "}
                      {formatAdminDate(item.submittedAt)}
                    </CardDescription>
                  </div>
                  <AdminRating value={item.overallRating} />
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  <AdminStatusBadge
                    tone={item.goalsAchieved ? "success" : "neutral"}
                  >
                    {item.goalsAchieved
                      ? "Goals achieved"
                      : "Goals not fully achieved"}
                  </AdminStatusBadge>
                  <AdminStatusBadge
                    tone={item.wouldRecommend ? "success" : "warning"}
                  >
                    {item.wouldRecommend
                      ? "Would recommend"
                      : "Would not recommend"}
                  </AdminStatusBadge>
                </div>

                <div>
                  <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                    Reason for ending
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                    {item.reason || "No reason provided"}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg bg-[#f7f6f2] p-4">
                    <p className="text-xs font-bold text-primary">Highlights</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-5 text-muted-foreground">
                      {item.highlights || "No highlights provided"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[#f7f6f2] p-4">
                    <p className="text-xs font-bold text-primary">
                      Improvements
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-5 text-muted-foreground">
                      {item.improvements || "No improvements provided"}
                    </p>
                  </div>
                </div>

                {item.additionalComments && (
                  <div className="border-t pt-4">
                    <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                      Additional comments
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                      {item.additionalComments}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
