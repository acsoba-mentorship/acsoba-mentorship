"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { CheckCircle2, ChevronDown, ChevronUp, Loader2, Mail, Phone } from "lucide-react";

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
  const acknowledgeInterest = useMutation(api.internships.acknowledgeInterest);
  const [pendingId, setPendingId] = useState<Id<"internshipInterests"> | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  if (interests === undefined) {
    return <Skeleton className="h-16 w-full" />;
  }

  if (interests.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No one has indicated interest yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {interests.map((interest) => (
        <div
          key={interest._id}
          className="rounded-lg border bg-[#f7f6f2] px-4 py-3"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium">{interest.applicantName}</p>
              <p className="text-xs text-muted-foreground">
                Indicated interest {formatDateTime(interest.createdAt)}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {interest.applicantEmail && (
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="size-3.5 text-muted-foreground" />
                    {interest.applicantEmail}
                  </span>
                )}
                {interest.applicantPhoneNumber && (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="size-3.5 text-muted-foreground" />
                    {interest.applicantPhoneNumber}
                  </span>
                )}
              </div>
              {interest.note && (
                <p className="mt-2 text-sm text-muted-foreground">
                  &quot;{interest.note}&quot;
                </p>
              )}
            </div>

            {interest.status === "acknowledged" ? (
              <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-emerald-700">
                <CheckCircle2 className="size-4" />
                Acknowledged
              </span>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pendingId === interest._id}
                onClick={async () => {
                  setPendingId(interest._id);
                  setError(null);
                  try {
                    await acknowledgeInterest({ interestId: interest._id });
                  } catch (mutationError) {
                    setError(getErrorMessage(mutationError));
                  } finally {
                    setPendingId(null);
                  }
                }}
              >
                {pendingId === interest._id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Acknowledge
              </Button>
            )}
          </div>
        </div>
      ))}
      <p className="text-xs text-muted-foreground">
        Further interaction with interested members happens outside the app,
        using the contact details above.
      </p>
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
          {internship.unacknowledgedCount > 0 && (
            <Badge variant="destructive">
              {internship.unacknowledgedCount} new
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
            {internship.interestCount} member
            {internship.interestCount === 1 ? "" : "s"} interested
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
              Interest
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
 * FR17: offeror-facing view of postings they've made, along with the
 * indications of interest (and contact details) each one has received.
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
