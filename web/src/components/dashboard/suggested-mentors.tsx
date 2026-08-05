"use client";

import { useMemo } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { MentorCard } from "@/components/search/mentor-card";
import { useLatestRequestStatusByMentor } from "@/hooks/use-latest-request-status-by-mentor";
import type { PublicMentorProfile } from "@/lib/types";

export function SuggestedMentors() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const {
    currentUserId,
    hasMenteeProfile,
    getLatestStatus,
    latestRequestStatusLoading,
  } = useLatestRequestStatusByMentor();
  const mentors = useQuery(
    api.users.listMentors,
    isAuthenticated ? {} : "skip"
  );

  const loading = isLoading || (isAuthenticated && mentors === undefined);
  const suggestedMentors = useMemo(
    () =>
      [...((mentors ?? []) as PublicMentorProfile[])].sort(
        (first, second) =>
          (second.matchScore ?? 0) - (first.matchScore ?? 0)
      ).slice(0, 3),
    [mentors]
  );

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-xl border p-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (suggestedMentors.length === 0) {
    return (
      <div className="rounded-xl bg-muted/40 px-6 py-10 text-center">
        <p className="font-medium">No mentor suggestions yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Suggestions will appear as mentor profiles become available.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {suggestedMentors.map((mentor) => (
        <MentorCard
          key={mentor.mentorId}
          mentor={mentor}
          currentUserId={currentUserId}
          hasMenteeProfile={hasMenteeProfile}
          latestRequestStatus={getLatestStatus(mentor.mentorId)}
          latestRequestStatusLoading={latestRequestStatusLoading}
        />
      ))}
    </div>
  );
}
