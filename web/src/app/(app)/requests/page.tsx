"use client";

import { useMemo, useState } from "react";
import type { FunctionReturnType } from "convex/server";
import { useQuery } from "convex/react";
import { Inbox, Search } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/app/CurrentUserProvider";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  MentorshipRequestCard,
  RequestsEmptyState,
  RequestsLoadingState,
} from "@/components/requests/mentorship-request-card";

type MenteeRequest = FunctionReturnType<
  typeof api.mentorRequests.requestsByMentee
>[number];

function RequestList({
  requests,
  emptyTitle,
  emptyDescription,
}: {
  requests: MenteeRequest[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (requests.length === 0) {
    return (
      <RequestsEmptyState
        icon={Inbox}
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
          name={request.mentorName}
          initials={request.mentorInitials}
          title={request.mentorTitle}
          message={request.message}
          tags={request.expertise}
          tagsLabel="Mentor Expertise"
          status={request.status}
          createdAt={request.createdAt}
        />
      ))}
    </div>
  );
}

export default function MenteeRequestsPage() {
  const { currentUser } = useCurrentUser();
  const [query, setQuery] = useState("");

  const requests = useQuery(
    api.mentorRequests.requestsByMentee,
    currentUser?._id && currentUser.menteeProfile
      ? { menteeId: currentUser._id }
      : "skip"
  );

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
        request.mentorName,
        request.mentorTitle,
        request.message,
        ...request.expertise,
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    });
  }, [query, requests]);

  const pendingRequests = filteredRequests.filter((r) => r.status === "pending");
  const acceptedRequests = filteredRequests.filter((r) => r.status === "accepted");
  const rejectedRequests = filteredRequests.filter((r) => r.status === "rejected");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">My Mentorship Requests</h1>
        <p className="mt-2 text-muted-foreground">
          Track the mentorship requests you&apos;ve sent and see whether mentors
          have accepted or rejected them.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by mentor name, title, or expertise..."
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
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
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {requests === undefined || currentUser === undefined ? (
            <RequestsLoadingState />
          ) : (
            <RequestList
              requests={pendingRequests}
              emptyTitle="No pending requests"
              emptyDescription="Requests you send to mentors will appear here while you wait for a response."
            />
          )}
        </TabsContent>

        <TabsContent value="accepted" className="mt-6">
          {requests === undefined || currentUser === undefined ? (
            <RequestsLoadingState />
          ) : (
            <RequestList
              requests={acceptedRequests}
              emptyTitle="No accepted requests"
              emptyDescription="Accepted mentorship requests will appear here."
            />
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          {requests === undefined || currentUser === undefined ? (
            <RequestsLoadingState />
          ) : (
            <RequestList
              requests={rejectedRequests}
              emptyTitle="No rejected requests"
              emptyDescription="Rejected mentorship requests will appear here."
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
