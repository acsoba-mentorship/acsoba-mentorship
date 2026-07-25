"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { ArrowRight, HeartPulse } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";

export function PulseSurveyReminder() {
  const pendingSurveys = useQuery(api.pulseSurveys.listPendingForCurrentUser);

  if (pendingSurveys === undefined) {
    return <Skeleton className="h-36 w-full rounded-lg" />;
  }

  if (pendingSurveys.length === 0) {
    return null;
  }

  const firstSurvey = pendingSurveys[0];

  const firstSurveyHref =
    firstSurvey.respondentRole === "mentor"
      ? `/mentor/mentorships/${firstSurvey.mentorshipId}`
      : `/mentorships/${firstSurvey.mentorshipId}`;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <HeartPulse className="size-5 text-primary" />
              Pulse survey due
            </CardTitle>
            <CardDescription>
              Complete your relationship health check-in to help track
              mentorship progress.
            </CardDescription>
          </div>

          <Badge variant="secondary">
            {pendingSurveys.length} due
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">
              Next survey: {firstSurvey.counterpartName}
            </p>
            <p className="text-sm text-muted-foreground">
              Due {formatDate(firstSurvey.dueAt)}
            </p>
          </div>

          <Button asChild>
            <Link href={firstSurveyHref}>
              Complete now
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}