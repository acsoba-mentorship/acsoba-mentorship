"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  getMentorshipRequestsForMentor,
  getMenteeWithUser,
  currentUser,
} from "@/lib/dummy-data";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Inbox,
  History,
  Calendar,
  MessageSquare,
  Sparkles,
} from "lucide-react";

export default function MentorRequestsPage() {
  const allRequests = getMentorshipRequestsForMentor(currentUser.id);
  const pendingRequests = allRequests.filter((req) => req.status === "pending");
  const historyRequests = allRequests.filter((req) => req.status !== "pending");

  const renderRequestCard = (
    request: (typeof allRequests)[0],
    showActions: boolean = false
  ) => {
    const menteeProfile = getMenteeWithUser(request.menteeId);
    const initials = `${request.mentee.firstName[0]}${request.mentee.lastName[0]}`;

    return (
      <Card key={request.id} className="overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 border">
                <AvatarImage
                  src={request.mentee.avatarUrl}
                  alt={`${request.mentee.firstName} ${request.mentee.lastName}`}
                />
                <AvatarFallback className="text-sm font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">
                  <Link
                    href={`/mentor/mentees/${request.menteeId}`}
                    className="hover:text-primary hover:underline"
                  >
                    {request.mentee.firstName} {request.mentee.lastName}
                  </Link>
                </CardTitle>
                <CardDescription>{request.mentee.title}</CardDescription>
              </div>
            </div>
            <StatusBadge status={request.status} type="request" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Message */}
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              Their message
            </div>
            <p className="text-sm leading-relaxed">{request.message}</p>
          </div>

          {/* Interests */}
          {menteeProfile && menteeProfile.interests.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                Areas of Interest
              </div>
              <div className="flex flex-wrap gap-2">
                {menteeProfile.interests.slice(0, 4).map((interest, index) => (
                  <Badge key={index} variant="outline">
                    {interest}
                  </Badge>
                ))}
                {menteeProfile.interests.length > 4 && (
                  <Badge variant="outline" className="text-muted-foreground">
                    +{menteeProfile.interests.length - 4} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Footer with date and actions */}
          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Requested {formatDate(request.createdAt)}
            </div>
            {showActions && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950">
                  Reject
                </Button>
                <Button size="sm">Accept</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const EmptyState = ({
    icon: Icon,
    title,
    description,
  }: {
    icon: typeof Inbox;
    title: string;
    description: string;
  }) => (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="rounded-full bg-muted p-4">
          <Icon className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <h3 className="mt-4 font-semibold">{title}</h3>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Mentorship Requests</h1>
        <p className="mt-2 text-muted-foreground">
          Review and respond to incoming mentorship requests from mentees
        </p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Inbox className="h-4 w-4" />
            Pending
            {pendingRequests.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-5 min-w-5 px-1.5 text-xs"
              >
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {pendingRequests.length > 0 ? (
            <div className="space-y-4">
              {pendingRequests.map((request) =>
                renderRequestCard(request, true)
              )}
            </div>
          ) : (
            <EmptyState
              icon={Inbox}
              title="No pending requests"
              description="You're all caught up! New requests from mentees will appear here."
            />
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          {historyRequests.length > 0 ? (
            <div className="space-y-4">
              {historyRequests.map((request) =>
                renderRequestCard(request, false)
              )}
            </div>
          ) : (
            <EmptyState
              icon={History}
              title="No request history"
              description="Accepted and rejected requests will appear here."
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
