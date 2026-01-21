"use client";

import { use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MenteeProfileView } from "@/components/profile/mentee-profile-view";
import {
  getMenteeWithUser,
  getPendingRequestFromMentee,
  currentUser,
} from "@/lib/dummy-data";
import { formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  MessageSquare,
  Calendar,
  UserX,
} from "lucide-react";

interface MenteeProfilePageProps {
  params: Promise<{ id: string }>;
}

export default function MenteeProfilePage({ params }: MenteeProfilePageProps) {
  const { id } = use(params);
  const menteeProfile = getMenteeWithUser(id);
  const pendingRequest = getPendingRequestFromMentee(id, currentUser.id);

  if (!menteeProfile) {
    return (
      <div className="space-y-6">
        <Link
          href="/mentor/requests"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Requests
        </Link>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-4">
              <UserX className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="mt-4 font-semibold">Mentee Not Found</h3>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              This mentee profile doesn&apos;t exist or has been removed.
            </p>
            <Button asChild className="mt-4">
              <Link href="/mentor/requests">Back to Requests</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/mentor/requests"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Requests
      </Link>

      {/* LinkedIn-style pending request banner */}
      {pendingRequest && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <h3 className="font-semibold text-primary">
                  {menteeProfile.user.firstName} has sent you a mentorship
                  request
                </h3>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    Requested {formatDate(pendingRequest.createdAt)}
                  </span>
                </div>
                <div className="rounded-lg bg-background/80 p-3">
                  <div className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Their message
                  </div>
                  <p className="text-sm">{pendingRequest.message}</p>
                </div>
              </div>
              <div className="flex gap-2 sm:flex-shrink-0">
                <Button
                  variant="outline"
                  className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </Button>
                <Button className="gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Accept
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shared profile view component - read-only for mentors */}
      <MenteeProfileView profile={menteeProfile} />
    </div>
  );
}
