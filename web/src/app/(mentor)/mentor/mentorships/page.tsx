"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { CalendarDays, History, Inbox, Users } from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import { useCurrentUser } from "@/app/CurrentUserProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ActiveMentorshipsForMentor,
  MentorshipHistoryForMentor,
} from "@/components/mentorships/active-mentorships";
import { MentorRequestsPanel } from "@/components/requests/mentor-requests-panel";

const VALID_TABS = ["active", "requests", "history"] as const;
type MentorshipsTab = (typeof VALID_TABS)[number];

function isMentorshipsTab(value: string | null): value is MentorshipsTab {
  return VALID_TABS.includes(value as MentorshipsTab);
}

function MentorMentorshipsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab = isMentorshipsTab(tabParam) ? tabParam : "active";

  const { currentUser } = useCurrentUser();
  const requests = useQuery(
    api.mentorRequests.requestsByMentor,
    currentUser?._id && currentUser.mentorProfile
      ? { mentorId: currentUser._id }
      : "skip"
  );
  // FR: "attach the number of pending requests in the request filter (just
  // like what the app did for pending, accepted, rejected, expired)"
  const pendingRequestCount =
    requests?.filter((request) => request.status === "pending").length ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mentorships</h1>
          <p className="mt-2 text-muted-foreground">
            View your mentee relationships, respond to requests, and look
            back on mentorships that have ended.
          </p>
        </div>

        <Button asChild variant="outline">
          <Link href="/mentor/mentorships/timeline">
            <CalendarDays className="size-4" />
            View Timeline
          </Link>
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set("tab", value);
          router.push(`/mentor/mentorships?${params.toString()}`);
        }}
        className="w-full"
      >
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <TabsList className="min-w-max">
            <TabsTrigger value="active" className="gap-2">
              <Users className="size-4" />
              Active
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-2">
              <Inbox className="size-4" />
              Requests
              {pendingRequestCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 h-5 min-w-5 px-1.5 text-xs"
                >
                  {pendingRequestCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="size-4" />
              History
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="active" className="mt-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Active Mentorships
            </h2>
            <p className="text-sm text-muted-foreground">
              These are mentorships created when you accept mentee requests.
            </p>
          </div>

          <ActiveMentorshipsForMentor />
        </TabsContent>

        <TabsContent value="requests" className="mt-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Mentorship Requests
            </h2>
            <p className="text-sm text-muted-foreground">
              Review and respond to incoming mentorship requests from
              mentees.
            </p>
          </div>

          <MentorRequestsPanel />
        </TabsContent>

        <TabsContent value="history" className="mt-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Mentorship History
            </h2>
            <p className="text-sm text-muted-foreground">
              Mentorships that have ended, whether completed or cancelled.
            </p>
          </div>

          <MentorshipHistoryForMentor />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function MentorMentorshipsPage() {
  return (
    <Suspense fallback={null}>
      <MentorMentorshipsPageContent />
    </Suspense>
  );
}
