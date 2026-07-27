"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Briefcase, CheckCircle2, Loader2 } from "lucide-react";

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

type OpenInternship =
  FunctionReturnType<typeof api.internships.listOpen>[number];

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

function ExpressInterestButton({ internship }: { internship: OpenInternship }) {
  const expressInterest = useMutation(api.internships.expressInterest);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(internship.alreadyExpressedInterest);
  const [error, setError] = useState<string | null>(null);

  if (internship.isMine) {
    return <Badge variant="secondary">Your posting</Badge>;
  }

  if (done) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
        <CheckCircle2 className="size-4" />
        Interest sent
      </span>
    );
  }

  return (
    <div className="space-y-1.5">
      <Button
        type="button"
        size="sm"
        disabled={isSubmitting}
        onClick={async () => {
          setIsSubmitting(true);
          setError(null);
          try {
            await expressInterest({ internshipId: internship._id });
            setDone(true);
          } catch (mutationError) {
            setError(getErrorMessage(mutationError));
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
        Indicate interest
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function InternshipCard({ internship }: { internship: OpenInternship }) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-base">{internship.role}</CardTitle>
          <CardDescription className="mt-1">
            {internship.companyName} · Offered by {internship.offerorName}
          </CardDescription>
        </div>
        <Badge variant={internship.isPaid ? "default" : "outline"}>
          {internship.isPaid ? "Paid" : "Unpaid"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
          {internship.description}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>Duration: {internship.duration}</span>
          <span>Closes {formatDate(internship.closingDate)}</span>
        </div>
        <div className="flex justify-end">
          <ExpressInterestButton internship={internship} />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * FR17: browse open internship postings and express interest. Eligibility
 * for expressing interest (students and members not currently employed)
 * is enforced server-side; the mutation surfaces a clear error otherwise.
 */
export function BrowseInternships() {
  const internships = useQuery(api.internships.listOpen, {});

  if (internships === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }

  if (internships.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center px-6 py-14 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <Briefcase className="size-5" />
          </span>
          <p className="mt-4 font-semibold">No open internships right now</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Check back soon, or offer one yourself if you know of an
            opportunity.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {internships.map((internship) => (
        <InternshipCard key={internship._id} internship={internship} />
      ))}
    </div>
  );
}
