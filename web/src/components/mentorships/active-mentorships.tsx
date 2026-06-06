"use client";

import Link from "next/link";
import type { FunctionReturnType } from "convex/server";
import { useQuery } from "convex/react";
import { Calendar, Mail, Phone, Users } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { useCurrentUser } from "@/app/CurrentUserProvider";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";

type MentorMentorship = FunctionReturnType<
  typeof api.mentorships.activeByMentor
>[number];

type MenteeMentorship = FunctionReturnType<
  typeof api.mentorships.activeByMentee
>[number];

function MentorshipLoadingState() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index}>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Skeleton className="size-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full rounded-lg" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MentorshipEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="rounded-full bg-primary/10 p-4">
          <Users className="size-8 text-primary/40" />
        </div>
        <h3 className="mt-4 font-semibold">{title}</h3>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

function ActiveMentorshipCard({
  name,
  initials,
  title,
  profilePictureUrl,
  profileHref,
  startedAt,
  tags,
  tagsLabel,
  email,
  phoneNumber,
}: {
  name: string;
  initials: string;
  title: string;
  profilePictureUrl?: string | null;
  profileHref: string;
  startedAt: number;
  tags: string[];
  tagsLabel: string;
  email?: string | null;
  phoneNumber?: string | null;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="size-12">
              {profilePictureUrl && (
                <AvatarImage src={profilePictureUrl} alt={name} />
              )}
              <AvatarFallback className="bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div>
              <CardTitle className="text-lg">{name}</CardTitle>
              <CardDescription>{title}</CardDescription>
            </div>
          </div>

          <Badge className="border-0 bg-emerald-50 text-emerald-700">
            Active
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="size-4" />
            Started {formatDate(startedAt)}
          </div>

          {email && (
            <div className="flex items-center gap-2">
              <Mail className="size-4" />
              {email}
            </div>
          )}

          {phoneNumber && (
            <div className="flex items-center gap-2">
              <Phone className="size-4" />
              {phoneNumber}
            </div>
          )}
        </div>

        {tags.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">
              {tagsLabel}
            </p>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-border/50 pt-4">
          <Button asChild variant="outline" size="sm">
            <Link href={profileHref}>View Profile</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ActiveMentorshipsForMentor() {
  const { currentUser } = useCurrentUser();

  const mentorships = useQuery(
    api.mentorships.activeByMentor,
    currentUser?._id && currentUser.mentorProfile
      ? { mentorId: currentUser._id }
      : "skip"
  );

  if (mentorships === undefined || currentUser === undefined) {
    return <MentorshipLoadingState />;
  }

  if (mentorships.length === 0) {
    return (
      <MentorshipEmptyState
        title="No active mentorships"
        description="Your active mentorships will appear here once you accept requests from mentees."
      />
    );
  }

  return (
    <div className="space-y-4">
      {mentorships.map((mentorship: MentorMentorship) => (
        <ActiveMentorshipCard
          key={mentorship._id}
          name={mentorship.menteeName}
          initials={mentorship.menteeInitials}
          title={mentorship.menteeTitle}
          profilePictureUrl={mentorship.menteeProfilePictureUrl}
          profileHref={
            mentorship.menteeUsername
              ? `/profile/${mentorship.menteeUsername}`
              : `/profile/id/${mentorship.menteeId}`
          }
          startedAt={mentorship.startDate}
          tags={mentorship.interests}
          tagsLabel="Mentee interests"
          email={mentorship.menteeEmail}
          phoneNumber={mentorship.menteePhoneNumber}
        />
      ))}
    </div>
  );
}

export function ActiveMentorshipsForMentee() {
  const { currentUser } = useCurrentUser();

  const mentorships = useQuery(
    api.mentorships.activeByMentee,
    currentUser?._id && currentUser.menteeProfile
      ? { menteeId: currentUser._id }
      : "skip"
  );

  if (mentorships === undefined || currentUser === undefined) {
    return <MentorshipLoadingState />;
  }

  if (mentorships.length === 0) {
    return (
      <MentorshipEmptyState
        title="No active mentorships"
        description="Your active mentorships will appear here once a mentor accepts your request."
      />
    );
  }

  return (
    <div className="space-y-4">
      {mentorships.map((mentorship: MenteeMentorship) => (
        <ActiveMentorshipCard
          key={mentorship._id}
          name={mentorship.mentorName}
          initials={mentorship.mentorInitials}
          title={mentorship.mentorTitle}
          profilePictureUrl={mentorship.mentorProfilePictureUrl}
          profileHref={
            mentorship.mentorUsername
              ? `/profile/${mentorship.mentorUsername}`
              : `/profile/id/${mentorship.mentorId}`
          }
          startedAt={mentorship.startDate}
          tags={mentorship.expertise}
          tagsLabel="Mentor expertise"
          email={mentorship.mentorEmail}
          phoneNumber={mentorship.mentorPhoneNumber}
        />
      ))}
    </div>
  );
}