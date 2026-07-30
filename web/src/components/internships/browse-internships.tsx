"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { ArrowRight, Briefcase } from "lucide-react";

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
        <p className="line-clamp-2 whitespace-pre-line text-sm text-muted-foreground">
          {internship.description}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>Starts: {internship.startPeriod ?? "To be confirmed"}</span>
          <span>Duration: {internship.duration}</span>
          <span>Closes {formatDate(internship.closingDate)}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          {internship.isMine ? (
            <Badge variant="secondary">Your posting</Badge>
          ) : internship.alreadyExpressedInterest ? (
            <Badge variant="secondary">Application sent</Badge>
          ) : (
            <span />
          )}
          <Button asChild type="button" size="sm">
            <Link href={`/internships/${internship._id}`}>
              View details
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * FR17: browse open internship postings. Cards intentionally show a short
 * summary and lead to a details page before an application can be submitted.
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
