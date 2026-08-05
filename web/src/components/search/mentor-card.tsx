import Link from "next/link";
import {
  Award,
  Briefcase,
  Building2,
  MapPin,
  Sparkles,
  UserRound,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

interface MentorCardProps {
  mentor: PublicMentorProfile;
  currentUserId?: Id<"users">;
  hasMenteeProfile: boolean;
  latestRequestStatus: RequestStatus | null;
  latestRequestStatusLoading?: boolean;
}

export function MentorCard({
  mentor,
  currentUserId,
  hasMenteeProfile,
  latestRequestStatus,
  latestRequestStatusLoading = false,
}: MentorCardProps) {
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
    <Card className="flex flex-col transition-shadow hover:shadow-[0_20px_50px_rgba(0,15,51,0.05)]">
      <CardHeader className="border-b border-border/50 pb-3">
        <div className="flex items-start gap-3 overflow-hidden">
          <Avatar>
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
            <CardTitle className="text-base">
              <Link
                href={profileHref}
                className="line-clamp-1 hover:underline focus-visible:underline"
              >
                {mentor.name}
              </Link>
            </CardTitle>
            <CardDescription className="line-clamp-2">
              {mentor.title || "ACS OBA mentor"}
            </CardDescription>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1.5">
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
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 pt-0">
        {mentor.bio && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {mentor.bio}
          </p>
        )}

        {mentorBadges.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {mentorBadges.slice(0, 3).map((badge, index) => (
              <Badge
                key={`${badge}-${index}`}
                variant="outline"
                className="border-secondary bg-secondary/50 text-secondary-foreground"
              >
                <Award className="size-3" />
                {badge}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {profile.expertise.slice(0, 3).map((skill, index) => (
            <Badge
              key={`${skill}-${index}`}
              variant="secondary"
              className="text-xs"
            >
              {skill}
            </Badge>
          ))}
          {profile.expertise.length > 3 && (
            <Badge
              variant="secondary"
              className="text-xs text-muted-foreground"
            >
              +{profile.expertise.length - 3}
            </Badge>
          )}
        </div>

        {matchedInterests.length > 0 && (
          <div className="rounded-lg bg-secondary/60 px-3 py-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-secondary-foreground">
              <Sparkles className="size-3.5" />
              Why this mentor matches
            </p>
            <p className="mt-1 line-clamp-2 text-xs text-secondary-foreground/80">
              Shared interests: {matchedInterests.slice(0, 3).join(", ")}
            </p>
          </div>
        )}

        <div className="mt-auto grid gap-1.5 text-xs text-muted-foreground">
          {mentor.company && (
            <span className="flex items-center gap-1.5">
              <Building2 className="size-3.5 shrink-0" />
              <span className="truncate">{mentor.company}</span>
            </span>
          )}
          {mentor.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">{mentor.location}</span>
            </span>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
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
        </div>

        <SendRequestDialog
          mentor={mentor}
          currentUserId={currentUserId}
          hasMenteeProfile={hasMenteeProfile}
          latestStatus={latestRequestStatus}
          latestStatusLoading={latestRequestStatusLoading}
          buttonClassName="mt-2 w-full"
        />
      </CardContent>
    </Card>
  );
}
