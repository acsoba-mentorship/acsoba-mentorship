import Link from "next/link";
import {
  Award,
  Briefcase,
  Building2,
  MapPin,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AVAILABLE, UNAVAILABLE } from "@/lib/constants";
import { getInitials } from "@/lib/utils";
import {
  getMentorMatchPercentage,
  type PublicMentorProfile,
} from "@/lib/types";
import type { Id } from "../../../convex/_generated/dataModel";
import type { RequestStatus } from "@/components/requests/types";
import { SendRequestDialog } from "@/components/requests/send-request-dialog";

interface MentorListItemProps {
  mentor: PublicMentorProfile;
  currentUserId?: Id<"users">;
  hasMenteeProfile: boolean;
  latestRequestStatus: RequestStatus | null;
  latestRequestStatusLoading?: boolean;
}

export function MentorListItem({
  mentor,
  currentUserId,
  hasMenteeProfile,
  latestRequestStatus,
  latestRequestStatusLoading = false,
}: MentorListItemProps) {
  const profile = mentor.mentorProfile;
  if (!profile) return null;

  const isAnonymous = mentor.username === null;
  const profileHref = isAnonymous
    ? `/profile/id/${mentor.mentorId}`
    : `/profile/${mentor.username}`;
  const matchPercentage = getMentorMatchPercentage(mentor.matchScore);
  const matchedInterests = mentor.matchedInterests ?? [];
  const mentorBadges = mentor.badges ?? [];

  return (
    <Card className="transition-shadow hover:shadow-[0_20px_50px_rgba(0,15,51,0.05)]">
      <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row">
        <Avatar className="size-12 shrink-0">
          <AvatarImage
            src={
              !isAnonymous && mentor.profilePictureUrl
                ? mentor.profilePictureUrl
                : undefined
            }
            alt={mentor.name}
          />
          <AvatarFallback className="bg-primary/10 text-primary">
            {getInitials(mentor.name)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="font-medium">
                <Link
                  href={profileHref}
                  className="hover:underline focus-visible:underline"
                >
                  {mentor.name}
                </Link>
              </p>
              <p className="text-sm text-muted-foreground">
                {mentor.title || "ACS OBA mentor"}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-1.5">
              <Badge
                className={
                  profile.isAvailable
                    ? "border-0 bg-emerald-50 text-emerald-700"
                    : "border-0 bg-muted text-muted-foreground"
                }
              >
                {profile.isAvailable ? AVAILABLE : UNAVAILABLE}
              </Badge>
              <Badge
                variant="secondary"
                className="border-0 bg-secondary text-secondary-foreground"
              >
                <Sparkles className="size-3" />
                {matchPercentage}% match
              </Badge>
            </div>
          </div>

          {mentor.bio && (
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
              {mentor.bio}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-1.5">
            {mentorBadges.map((badge, index) => (
              <Badge
                key={`${badge}-${index}`}
                variant="outline"
                className="border-secondary bg-secondary/50 text-secondary-foreground"
              >
                <Award className="size-3" />
                {badge}
              </Badge>
            ))}

            {profile.expertise.map((skill, index) => (
              <Badge
                key={`${skill}-${index}`}
                variant="secondary"
                className="text-xs"
              >
                {skill}
              </Badge>
            ))}
          </div>

          {matchedInterests.length > 0 && (
            <div className="mt-3 rounded-lg bg-secondary/60 px-3 py-2">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-secondary-foreground">
                <Sparkles className="size-3.5" />
                Why this mentor matches
              </p>
              <p className="mt-1 text-xs text-secondary-foreground/80">
                Shared interests: {matchedInterests.join(", ")}
              </p>
            </div>
          )}

          <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 xl:grid-cols-4">
            {mentor.company && (
              <span className="flex min-w-0 items-center gap-1.5">
                <Building2 className="size-3.5 shrink-0" />
                <span className="truncate">{mentor.company}</span>
              </span>
            )}
            {mentor.location && (
              <span className="flex min-w-0 items-center gap-1.5">
                <MapPin className="size-3.5 shrink-0" />
                <span className="truncate">{mentor.location}</span>
              </span>
            )}
            {mentor.ageGroup && (
              <span className="flex items-center gap-1.5">
                <UserRound className="size-3.5" />
                {mentor.ageGroup}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Briefcase className="size-3.5" />
              {profile.yearsOfExperience}yr exp
            </span>
          </div>

          <div className="mt-4 flex justify-stretch sm:justify-end">
            <SendRequestDialog
              mentor={mentor}
              currentUserId={currentUserId}
              hasMenteeProfile={hasMenteeProfile}
              latestStatus={latestRequestStatus}
              latestStatusLoading={latestRequestStatusLoading}
              buttonClassName="w-full sm:w-auto"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
