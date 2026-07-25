"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useCurrentUser } from "@/app/CurrentUserProvider";
import type { RequestStatus } from "@/components/requests/types";

type MenteeRequest = FunctionReturnType<
  typeof api.mentorRequests.requestsByMentee
>[number];

/**
 * Loads the current mentee's sent requests and exposes the latest status per mentor.
 * Used by mentor search and public profile CTAs so request state stays consistent.
 */
export function useLatestRequestStatusByMentor() {
  const { currentUser } = useCurrentUser();
  const menteeRequestsArgs =
    currentUser?._id && currentUser.menteeProfile
      ? { menteeId: currentUser._id }
      : "skip";
  const sentRequests = useQuery(api.mentorRequests.requestsByMentee, menteeRequestsArgs);

  const latestRequestByMentor = useMemo(() => {
    const map = new Map<Id<"users">, MenteeRequest>();

    for (const request of sentRequests ?? []) {
      const mentorId = request.mentorId;
      if (!map.has(mentorId)) {
        map.set(mentorId, request);
      }
    }

    return map;
  }, [sentRequests]);

  const getLatestStatus = (mentorId: Id<"users">): RequestStatus | null => {
    const request = latestRequestByMentor.get(mentorId);

    if (request?.status === "accepted" && !request.connectionActive) {
      return null;
    }

    return request?.status ?? null;
  };

  /** True while `requestsByMentee` is in flight — avoid treating unknown as "no request". */
  const latestRequestStatusLoading =
    menteeRequestsArgs !== "skip" && sentRequests === undefined;

  return {
    currentUserId: currentUser?._id,
    hasMenteeProfile: !!currentUser?.menteeProfile,
    latestRequestByMentor,
    getLatestStatus,
    latestRequestStatusLoading,
  };
}
