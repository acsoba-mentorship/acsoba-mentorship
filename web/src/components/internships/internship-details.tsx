"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

export function InternshipDetails({
  internshipId,
}: {
  internshipId: Id<"internships">;
}) {
  const internship = useQuery(api.internships.getPosting, { internshipId });
  const expressInterest = useMutation(api.internships.expressInterest);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (internship === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-80 w-full rounded-lg" />
      </div>
    );
  }

  const applicationSent =
    submitted || internship.alreadyExpressedInterest;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Button asChild variant="ghost" className="-ml-3">
        <Link href="/internships">
          <ArrowLeft />
          Back to internships
        </Link>
      </Button>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">{internship.role}</CardTitle>
              <CardDescription className="mt-2">
                {internship.companyName} · Offered by {internship.offerorName}
              </CardDescription>
            </div>
            <Badge variant={internship.isPaid ? "default" : "outline"}>
              {internship.isPaid ? "Paid" : "Unpaid"}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span>
              Starts: {internship.startPeriod ?? "To be confirmed"}
            </span>
            <span>Duration: {internship.duration}</span>
            <span>Applications close {formatDate(internship.closingDate)}</span>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <h2 className="font-semibold">About this internship</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
              {internship.description}
            </p>
          </div>

          <div className="border-t pt-5">
            {internship.isMine ? (
              <Badge variant="secondary">This is your posting</Badge>
            ) : applicationSent ? (
              <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
                <CheckCircle2 className="size-4" />
                Application sent
              </span>
            ) : internship.isOpen ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Review the full posting above before indicating interest.
                </p>
                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={async () => {
                    setIsSubmitting(true);
                    setError(null);
                    try {
                      await expressInterest({ internshipId });
                      setSubmitted(true);
                    } catch (mutationError) {
                      setError(getErrorMessage(mutationError));
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                >
                  {isSubmitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  Indicate interest
                </Button>
              </div>
            ) : (
              <Badge variant="outline">
                This posting is no longer accepting applications
              </Badge>
            )}
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
