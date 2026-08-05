"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { FunctionReturnType } from "convex/server";
import { useQuery } from "convex/react";
import {
  Calendar,
  CalendarPlus,
  History,
  Mail,
  Phone,
  Search,
  Users,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScheduleMeetingDialog } from "@/components/mentorships/meeting-scheduler";
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

function MentorshipStatusBadge({
  status,
}: {
  status: MentorMentorship["status"] | MenteeMentorship["status"];
}) {
  const styles: Record<typeof status, { label: string; className: string }> = {
    active: {
      label: "Active",
      className: "border-0 bg-emerald-50 text-emerald-700",
    },
    completed: {
      label: "Completed",
      className: "border-0 bg-slate-100 text-slate-700",
    },
    cancelled: {
      label: "Cancelled",
      className: "border-0 bg-red-50 text-red-700",
    },
  };
  const style = styles[status];

  return <Badge className={style.className}>{style.label}</Badge>;
}

function ActiveMentorshipCard({
  name,
  initials,
  title,
  profilePictureUrl,
  profileHref,
  workspaceHref,
  mentorshipId,
  startedAt,
  tags,
  tagsLabel,
  email,
  phoneNumber,
  canManageMeetings = false,
}: {
  name: string;
  initials: string;
  title: string;
  profilePictureUrl?: string | null;
  profileHref: string;
  workspaceHref: string;
  mentorshipId: MentorMentorship["_id"] | MenteeMentorship["_id"];
  startedAt: number;
  tags: string[];
  tagsLabel: string;
  email?: string | null;
  phoneNumber?: string | null;
  canManageMeetings?: boolean;
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

        <div className="flex flex-wrap gap-2 border-t border-border/50 pt-4">
          <Button asChild size="sm">
            <Link href={workspaceHref}>Open Workspace</Link>
          </Button>

          <Button asChild variant="outline" size="sm">
            <Link href={profileHref}>View Profile</Link>
          </Button>

          {canManageMeetings && (
            <ScheduleMeetingDialog
              mentorshipId={mentorshipId}
              participantName={name}
            >
              <Button type="button" variant="outline" size="sm">
                <CalendarPlus className="size-4" />
                Schedule Meeting
              </Button>
            </ScheduleMeetingDialog>
          )}
        </div>

      </CardContent>
    </Card>
  );
}

function MentorshipHistoryCard({
  name,
  initials,
  title,
  profilePictureUrl,
  profileHref,
  startedAt,
  endedAt,
  status,
  tags,
  tagsLabel,
}: {
  name: string;
  initials: string;
  title: string;
  profilePictureUrl?: string | null;
  profileHref: string;
  startedAt: number;
  endedAt?: number | null;
  status: MentorMentorship["status"] | MenteeMentorship["status"];
  tags: string[];
  tagsLabel: string;
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

          <MentorshipStatusBadge status={status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="size-4" />
            Started {formatDate(startedAt)}
          </div>

          {endedAt && (
            <div className="flex items-center gap-2">
              <History className="size-4" />
              Ended {formatDate(endedAt)}
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

function MentorshipHistorySearchEmptyState({ hasQuery }: { hasQuery: boolean }) {
  return (
    <MentorshipEmptyState
      title={hasQuery ? "No matching mentorships" : "No mentorship history yet"}
      description={
        hasQuery
          ? "Try a different search term."
          : "Mentorships that have ended will appear here."
      }
    />
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
          workspaceHref={`/mentor/mentorships/${mentorship._id}`}
          mentorshipId={mentorship._id}
          startedAt={mentorship.startDate}
          tags={mentorship.interests}
          tagsLabel="Mentee interests"
          email={mentorship.menteeEmail}
          phoneNumber={mentorship.menteePhoneNumber}
          canManageMeetings
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
          workspaceHref={`/mentorships/${mentorship._id}`}
          mentorshipId={mentorship._id}
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

export function MentorshipHistoryForMentor() {
  const { currentUser } = useCurrentUser();
  const [query, setQuery] = useState("");

  const history = useQuery(
    api.mentorships.historyByMentor,
    currentUser?._id && currentUser.mentorProfile
      ? { mentorId: currentUser._id }
      : "skip"
  );

  const filtered = useMemo(() => {
    if (!history) return [];
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return history;

    return history.filter((mentorship: MentorMentorship) => {
      const searchable = [
        mentorship.menteeName,
        mentorship.menteeTitle,
        ...mentorship.interests,
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(normalizedQuery);
    });
  }, [history, query]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by mentee name, title, or interest..."
          className="pl-9"
        />
      </div>

      {history === undefined || currentUser === undefined ? (
        <MentorshipLoadingState />
      ) : filtered.length === 0 ? (
        <MentorshipHistorySearchEmptyState hasQuery={query.trim().length > 0} />
      ) : (
        <div className="space-y-4">
          {filtered.map((mentorship: MentorMentorship) => (
            <MentorshipHistoryCard
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
              endedAt={mentorship.endDate}
              status={mentorship.status}
              tags={mentorship.interests}
              tagsLabel="Mentee interests"
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function MentorshipHistoryForMentee() {
  const { currentUser } = useCurrentUser();
  const [query, setQuery] = useState("");

  const history = useQuery(
    api.mentorships.historyByMentee,
    currentUser?._id && currentUser.menteeProfile
      ? { menteeId: currentUser._id }
      : "skip"
  );

  const filtered = useMemo(() => {
    if (!history) return [];
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return history;

    return history.filter((mentorship: MenteeMentorship) => {
      const searchable = [
        mentorship.mentorName,
        mentorship.mentorTitle,
        ...mentorship.expertise,
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(normalizedQuery);
    });
  }, [history, query]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by mentor name, title, or expertise..."
          className="pl-9"
        />
      </div>

      {history === undefined || currentUser === undefined ? (
        <MentorshipLoadingState />
      ) : filtered.length === 0 ? (
        <MentorshipHistorySearchEmptyState hasQuery={query.trim().length > 0} />
      ) : (
        <div className="space-y-4">
          {filtered.map((mentorship: MenteeMentorship) => (
            <MentorshipHistoryCard
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
              endedAt={mentorship.endDate}
              status={mentorship.status}
              tags={mentorship.expertise}
              tagsLabel="Mentor expertise"
            />
          ))}
        </div>
      )}
    </div>
  );
}