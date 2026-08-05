"use client";

import { useQuery } from "convex/react";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";

const CONTACT_METHOD_LABELS = {
  email: "Email",
  phone: "Phone",
  whatsapp: "WhatsApp",
  other: "Other",
} as const;

/**
 * Lets applicants track pending and decided internship applications.
 */
export function MyInternshipInterests() {
  const interests = useQuery(api.internships.myInterests);

  if (interests === undefined) {
    return <Skeleton className="h-32 w-full rounded-lg" />;
  }

  if (interests.length === 0) {
    return (
      <Card>
        <CardContent className="px-6 py-14 text-center text-sm text-muted-foreground">
          You haven&apos;t indicated interest in any internships yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {interests.map((interest) => (
        <Card key={interest._id}>
          <CardContent className="flex flex-wrap items-start justify-between gap-3 py-4">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{interest.internshipRole}</p>
              <p className="text-sm text-muted-foreground">
                {interest.internshipCompany || "Offeror details unavailable"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Indicated interest {formatDate(interest.createdAt)}
              </p>
              {interest.status === "accepted" ? (
                <div className="mt-3 rounded-md bg-muted/60 px-3 py-2 text-sm">
                  <p className="text-xs font-medium text-muted-foreground">
                    Acceptance details
                  </p>
                  <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-muted-foreground">
                        Posting start
                      </dt>
                      <dd>
                        {interest.internshipStartPeriod ?? "To be confirmed"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">
                        Contact
                      </dt>
                      <dd>
                        {interest.acceptanceContactMethod
                          ? CONTACT_METHOD_LABELS[
                              interest.acceptanceContactMethod
                            ]
                          : "Not recorded"}
                        {interest.acceptanceContactDetails
                          ? ` · ${interest.acceptanceContactDetails}`
                          : ""}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-xs text-muted-foreground">
                        Start arrangements
                      </dt>
                      <dd className="whitespace-pre-wrap">
                        {interest.acceptanceStartArrangements ??
                          "Not recorded"}
                      </dd>
                    </div>
                    {interest.decisionMessage ? (
                      <div className="sm:col-span-2">
                        <dt className="text-xs text-muted-foreground">
                          Message
                        </dt>
                        <dd className="whitespace-pre-wrap">
                          {interest.decisionMessage}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
              ) : interest.decisionMessage ? (
                <div className="mt-3 rounded-md bg-muted/60 px-3 py-2 text-sm">
                  <p className="text-xs font-medium text-muted-foreground">
                    Message from the internship offeror
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">
                    {interest.decisionMessage}
                  </p>
                </div>
              ) : null}
            </div>
            {interest.status === "accepted" ? (
              <Badge className="gap-1.5 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                <CheckCircle2 className="size-3.5" />
                Accepted
              </Badge>
            ) : interest.status === "rejected" ? (
              <Badge variant="destructive" className="gap-1.5">
                <XCircle className="size-3.5" />
                Not selected
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1.5">
                <Clock className="size-3.5" />
                Awaiting response
              </Badge>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
