"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { ChevronDown, ChevronUp } from "lucide-react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatDateTime } from "@/lib/utils";

type MyInternship = FunctionReturnType<typeof api.internships.myOffered>[number];

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

function statusVariant(status: MyInternship["status"]) {
  if (status === "open") return "default" as const;
  if (status === "filled") return "secondary" as const;
  return "outline" as const;
}

function InterestsInbox({ internshipId }: { internshipId: Id<"internships"> }) {
  const interests = useQuery(api.internships.listInterestsForPosting, {
    internshipId,
  });

  if (interests === undefined) {
    return <Skeleton className="h-16 w-full" />;
  }

  if (interests.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No one has applied yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {interests.map((interest) => (
        <div
          key={interest._id}
          className="rounded-lg border bg-[#f7f6f2] px-4 py-3"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium">{interest.applicantName}</p>
              <p className="text-xs text-muted-foreground">
                Applied {formatDateTime(interest.createdAt)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {interest.status === "accepted" ? (
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                  Accepted
                </Badge>
              ) : interest.status === "rejected" ? (
                <Badge variant="destructive">Rejected</Badge>
              ) : (
                <Badge variant="secondary">Pending</Badge>
              )}
              <Button asChild size="sm" variant="outline">
                <Link href={`/internships/applications/${interest._id}`}>
                  See application
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MyInternshipCard({ internship }: { internship: MyInternship }) {
  const updateStatus = useMutation(api.internships.updateStatus);
  const [expanded, setExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-base">{internship.role}</CardTitle>
          <CardDescription className="mt-1">
            {internship.companyName} · Closes {formatDate(internship.closingDate)}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {internship.pendingApplicationCount > 0 && (
            <Badge variant="destructive">
              {internship.pendingApplicationCount} pending
            </Badge>
          )}
          <Badge variant={statusVariant(internship.status)}>
            {internship.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {internship.interestCount} application
            {internship.interestCount === 1 ? "" : "s"}
          </p>

          <div className="flex items-center gap-2">
            <Select
              value={internship.status}
              disabled={isSaving}
              onValueChange={async (value) => {
                setIsSaving(true);
                setError(null);
                try {
                  await updateStatus({
                    internshipId: internship._id,
                    status: value as MyInternship["status"],
                  });
                } catch (mutationError) {
                  setError(getErrorMessage(mutationError));
                } finally {
                  setIsSaving(false);
                }
              }}
            >
              <SelectTrigger className="h-8 w-32 bg-background text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="filled">Filled</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? <ChevronUp /> : <ChevronDown />}
              Applications
            </Button>
          </div>
        </div>

        {error ? <p className="text-xs text-destructive">{error}</p> : null}

        {expanded && (
          <div className="border-t pt-4">
            <InterestsInbox internshipId={internship._id} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Offeror-facing view of internship postings and their applications.
 * Applicant contact details and CV URLs are loaded only in the owner-guarded
 * application review page.
 */
export function MyInternshipPostings() {
  const postings = useQuery(api.internships.myOffered);

  if (postings === undefined) {
    return <Skeleton className="h-40 w-full rounded-lg" />;
  }

  if (postings.length === 0) {
    return (
      <Card>
        <CardContent className="px-6 py-14 text-center text-sm text-muted-foreground">
          You haven&apos;t offered any internships yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {postings.map((posting) => (
        <MyInternshipCard key={posting._id} internship={posting} />
      ))}
    </div>
  );
}
