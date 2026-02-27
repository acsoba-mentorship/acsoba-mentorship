"use client";

import { useState } from "react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Inbox,
  History,
  Calendar,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface MockRequest {
  id: string;
  menteeName: string;
  menteeInitials: string;
  menteeTitle: string;
  message: string;
  interests: string[];
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

const mockRequests: MockRequest[] = [
  {
    id: "req-1",
    menteeName: "Jordan Lee",
    menteeInitials: "JL",
    menteeTitle: "Junior Developer",
    message:
      "Hi! I'm a junior developer looking to transition into full-stack engineering. I'd love to learn from your experience in React and TypeScript. Could we set up regular sessions to work through real-world projects?",
    interests: ["Web Development", "React", "TypeScript", "Open Source"],
    status: "pending",
    createdAt: "2026-02-20T10:00:00Z",
  },
  {
    id: "req-2",
    menteeName: "Aisha Okonkwo",
    menteeInitials: "AO",
    menteeTitle: "Graduate Student",
    message:
      "I'm finishing my CS degree and very interested in machine learning. Your work in NLP is inspiring and I'd appreciate guidance on breaking into the industry.",
    interests: ["Machine Learning", "NLP", "Python"],
    status: "pending",
    createdAt: "2026-02-18T14:30:00Z",
  },
  {
    id: "req-3",
    menteeName: "Ryan Park",
    menteeInitials: "RP",
    menteeTitle: "Career Switcher",
    message:
      "Coming from a finance background, I'm pivoting into software engineering. Would love mentorship on building a solid portfolio and preparing for interviews.",
    interests: ["Career Transition", "Full Stack", "Interview Prep"],
    status: "accepted",
    createdAt: "2026-01-15T09:00:00Z",
  },
  {
    id: "req-4",
    menteeName: "Maya Singh",
    menteeInitials: "MS",
    menteeTitle: "Frontend Developer",
    message:
      "I want to level up from frontend to full-stack. Your background in engineering management is exactly what I need for career advice.",
    interests: ["Leadership", "System Design"],
    status: "rejected",
    createdAt: "2026-01-10T11:00:00Z",
  },
];

function StatusBadge({ status }: { status: MockRequest["status"] }) {
  const variants: Record<
    MockRequest["status"],
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
}: {
  request: MockRequest;
  showActions: boolean;
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
              >
                Reject
              </Button>
              <Button size="sm">Accept</Button>
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

export default function MentorRequestsPage() {
  const [requests] = useState(mockRequests);

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const historyRequests = requests.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Mentorship Requests</h1>
        <p className="mt-2 text-muted-foreground">
          Review and respond to incoming mentorship requests from mentees.
        </p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Inbox className="size-4" />
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
            <History className="size-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {pendingRequests.length > 0 ? (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  showActions
                />
              ))}
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
              {historyRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  showActions={false}
                />
              ))}
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
