"use client";

import { useMemo, useState } from "react";
import type { FunctionReturnType } from "convex/server";
import { useMutation, useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/app/CurrentUserProvider";
import { api } from "../../../../../convex/_generated/api";
import {
  Inbox,
  History,
  Calendar,
  MessageSquare,
  Sparkles,
  Search,
  TriangleAlert,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

type RequestStatus = "pending" | "accepted" | "rejected";

type MentorRequest = FunctionReturnType<
  typeof api.mentorRequests.requestsByMentor
>[number];

function StatusBadge({ status }: { status: RequestStatus }) {
  const variants: Record<
    RequestStatus,
    { label: string; variant: "default" | "secondary" | "destructive" }
  > = {
    pending: { label: "Pending", variant: "secondary" },
    accepted: { label: "Accepted", variant: "default" },
    rejected: { label: "Rejected", variant: "destructive" },
  };
  const v = variants[status];
  return <Badge variant={v.variant}>{v.label}</Badge>;
}

function RequestCard({
  request,
  showActions,
  isUpdating,
  onAccept,
  onReject,
}: {
  request: MentorRequest;
  showActions: boolean;
  isUpdating: boolean;
  onAccept: (requestId: MentorRequest["_id"]) => void;
  onReject: (requestId: MentorRequest["_id"]) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="size-12 border">
              <AvatarFallback className="text-sm font-medium">
                {request.menteeInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{request.menteeName}</CardTitle>
              <CardDescription>{request.menteeTitle}</CardDescription>
            </div>
          </div>
          <StatusBadge status={request.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted/50 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <MessageSquare className="size-4" />
            Their message
          </div>
          <p className="text-sm leading-relaxed">{request.message}</p>
        </div>

        {request.interests.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Sparkles className="size-4" />
              Areas of Interest
            </div>
            <div className="flex flex-wrap gap-2">
              {request.interests.map((interest) => (
                <Badge key={interest} variant="outline">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="size-4" />
            Requested {formatDate(request.createdAt)}
          </div>
          {showActions && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onReject(request._id)}
                disabled={isUpdating}
              >
                {isUpdating ? "Updating..." : "Reject"}
              </Button>
              <Button
                size="sm"
                onClick={() => onAccept(request._id)}
                disabled={isUpdating}
              >
                {isUpdating ? "Updating..." : "Accept"}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Inbox;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="rounded-full bg-muted p-4">
          <Icon className="size-8 text-muted-foreground/50" />
        </div>
        <h3 className="mt-4 font-semibold">{title}</h3>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

function RequestsLoadingState() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index}>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <Skeleton className="size-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-5 w-48" />
            <div className="flex items-center justify-between border-t pt-4">
              <Skeleton className="h-4 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-20 rounded-md" />
                <Skeleton className="h-9 w-20 rounded-md" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

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
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <RequestCard
          key={request._id}
          request={request}
          showActions={showActions}
          isUpdating={activeRequestId === request._id}
          onAccept={onAccept}
          onReject={onReject}
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
    currentUser?._id ? { mentorId: currentUser._id } : "skip"
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
        <TabsList>
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
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {requests === undefined || currentUser === undefined ? (
            <RequestsLoadingState />
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
      </Tabs>
    </div>
  );
}
