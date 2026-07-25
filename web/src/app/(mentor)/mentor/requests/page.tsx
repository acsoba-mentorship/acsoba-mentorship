"use client";

import { useMemo, useState } from "react";
import type { FunctionReturnType } from "convex/server";
import { useMutation, useQuery } from "convex/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useCurrentUser } from "@/app/CurrentUserProvider";
import { api } from "../../../../../convex/_generated/api";
import {
  MentorshipRequestCard,
  RequestsEmptyState,
  RequestsLoadingState,
} from "@/components/requests/mentorship-request-card";
import { History, Inbox, Search, TriangleAlert } from "lucide-react";

type MentorRequest = FunctionReturnType<
  typeof api.mentorRequests.requestsByMentor
>[number];

function RequestSection({
  requests,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  showActions,
  activeRequestId,
  onAccept,
  onReject,
}: {
  requests: MentorRequest[];
  emptyIcon: typeof Inbox;
  emptyTitle: string;
  emptyDescription: string;
  showActions: boolean;
  activeRequestId: MentorRequest["_id"] | null;
  onAccept: (requestId: MentorRequest["_id"]) => void;
  onReject: (requestId: MentorRequest["_id"]) => void;
}) {
  if (requests.length === 0) {
    return (
      <RequestsEmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <MentorshipRequestCard
          key={request._id}
          name={request.menteeName}
          initials={request.menteeInitials}
          title={request.menteeTitle}
          message={request.message}
          tags={request.interests}
          tagsLabel="Areas of Interest"
          status={request.status}
          createdAt={request.createdAt}
          expiresAt={request.expiresAt}
          proposedDurationMonths={request.proposedDurationMonths}
          showActions={showActions}
          isUpdating={activeRequestId === request._id}
          onAccept={() => onAccept(request._id)}
          onReject={() => onReject(request._id)}
        />
      ))}
    </div>
  );
}

export default function MentorRequestsPage() {
  const { currentUser } = useCurrentUser();
  const [query, setQuery] = useState("");
  const [activeRequestId, setActiveRequestId] =
    useState<MentorRequest["_id"] | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const requests = useQuery(
    api.mentorRequests.requestsByMentor,
    currentUser?._id && currentUser.mentorProfile
      ? { mentorId: currentUser._id }
      : "skip"
  );
  const acceptRequest = useMutation(api.mentorRequests.acceptRequest);
  const rejectRequest = useMutation(api.mentorRequests.rejectRequest);

  const filteredRequests = useMemo(() => {
    if (!requests) {
      return [];
    }

    const normalizedQuery = query.trim().toLowerCase();

    return requests.filter((request) => {
      if (!normalizedQuery) {
        return true;
      }

      const searchable = [
        request.menteeName,
        request.menteeTitle,
        request.message,
        ...request.interests,
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    });
  }, [query, requests]);

  const pendingRequests = filteredRequests.filter((r) => r.status === "pending");
  const acceptedRequests = filteredRequests.filter((r) => r.status === "accepted");
  const rejectedRequests = filteredRequests.filter((r) => r.status === "rejected");
  const expiredRequests = filteredRequests.filter((r) => r.status === "expired");

  const handleRequestAction = async (
    requestId: MentorRequest["_id"],
    action: (args: { requestId: MentorRequest["_id"] }) => Promise<unknown>
  ) => {
    setActiveRequestId(requestId);
    setActionError(null);

    try {
      await action({ requestId });
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Something went wrong while updating the request."
      );
    } finally {
      setActiveRequestId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Mentorship Requests</h1>
        <p className="mt-2 text-muted-foreground">
          Review and respond to incoming mentorship requests from mentees.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by mentee name, title, or interest..."
          className="pl-9"
        />
      </div>

      {actionError && (
        <Alert variant="destructive">
          <TriangleAlert className="size-4" />
          <AlertTitle>Request update failed</AlertTitle>
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="pending" className="w-full">
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <TabsList className="min-w-max">
            <TabsTrigger value="pending" className="gap-2">
              <Inbox className="size-4" />
              Pending
              {pendingRequests.length > 0 && requests && (
                <Badge
                  variant="secondary"
                  className="ml-1 h-5 min-w-5 px-1.5 text-xs"
                >
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="accepted" className="gap-2">
              <History className="size-4" />
              Accepted
              {acceptedRequests.length > 0 && requests && (
                <Badge
                  variant="secondary"
                  className="ml-1 h-5 min-w-5 px-1.5 text-xs"
                >
                  {acceptedRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2">
              <History className="size-4" />
              Rejected
              {rejectedRequests.length > 0 && requests && (
                <Badge
                  variant="secondary"
                  className="ml-1 h-5 min-w-5 px-1.5 text-xs"
                >
                  {rejectedRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="expired" className="gap-2">
              <History className="size-4" />
              Expired
              {expiredRequests.length > 0 && requests && (
                <Badge
                  variant="secondary"
                  className="ml-1 h-5 min-w-5 px-1.5 text-xs"
                >
                  {expiredRequests.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="pending" className="mt-6">
          {requests === undefined || currentUser === undefined ? (
            <RequestsLoadingState showActions />
          ) : (
            <RequestSection
              requests={pendingRequests}
              emptyIcon={Inbox}
              emptyTitle="No pending requests"
              emptyDescription="You're all caught up! New requests from mentees will appear here."
              showActions
              activeRequestId={activeRequestId}
              onAccept={(requestId) =>
                void handleRequestAction(requestId, acceptRequest)
              }
              onReject={(requestId) =>
                void handleRequestAction(requestId, rejectRequest)
              }
            />
          )}
        </TabsContent>

        <TabsContent value="accepted" className="mt-6">
          {requests === undefined || currentUser === undefined ? (
            <RequestsLoadingState />
          ) : (
            <RequestSection
              requests={acceptedRequests}
              emptyIcon={History}
              emptyTitle="No accepted requests"
              emptyDescription="Accepted mentorship requests will appear here."
              showActions={false}
              activeRequestId={activeRequestId}
              onAccept={(requestId) =>
                void handleRequestAction(requestId, acceptRequest)
              }
              onReject={(requestId) =>
                void handleRequestAction(requestId, rejectRequest)
              }
            />
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          {requests === undefined || currentUser === undefined ? (
            <RequestsLoadingState />
          ) : (
            <RequestSection
              requests={rejectedRequests}
              emptyIcon={History}
              emptyTitle="No rejected requests"
              emptyDescription="Rejected mentorship requests will appear here."
              showActions={false}
              activeRequestId={activeRequestId}
              onAccept={(requestId) =>
                void handleRequestAction(requestId, acceptRequest)
              }
              onReject={(requestId) =>
                void handleRequestAction(requestId, rejectRequest)
              }
            />
          )}
        </TabsContent>

        <TabsContent value="expired" className="mt-6">
          {requests === undefined || currentUser === undefined ? (
            <RequestsLoadingState />
          ) : (
            <RequestSection
              requests={expiredRequests}
              emptyIcon={History}
              emptyTitle="No expired requests"
              emptyDescription="Expired mentorship requests will appear here."
              showActions={false}
              activeRequestId={activeRequestId}
              onAccept={(requestId) =>
                void handleRequestAction(requestId, acceptRequest)
              }
              onReject={(requestId) =>
                void handleRequestAction(requestId, rejectRequest)
              }
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
