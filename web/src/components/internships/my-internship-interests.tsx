"use client";

import { useQuery } from "convex/react";
import { CheckCircle2, Clock } from "lucide-react";

import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";

/**
 * FR17: lets a member track the internships they've indicated interest
 * in, and whether the offeror has acknowledged it yet.
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
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div>
              <p className="font-medium">{interest.internshipRole}</p>
              <p className="text-sm text-muted-foreground">
                {interest.internshipCompany || "Offeror details unavailable"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Indicated interest {formatDate(interest.createdAt)}
              </p>
            </div>
            {interest.status === "acknowledged" ? (
              <Badge className="gap-1.5 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                <CheckCircle2 className="size-3.5" />
                Offeror responded
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
