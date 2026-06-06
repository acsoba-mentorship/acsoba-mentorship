import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Briefcase } from "lucide-react";
import { AVAILABLE, UNAVAILABLE } from "@/lib/constants";
import { getInitials } from "@/lib/utils";
import type { PublicMentorProfile } from "@/lib/types";
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
  const profileHref = mentor.username
    ? `/profile/${mentor.username}`
    : `/profile/id/${mentor.mentorId}`;

  return (
    <Card className="flex flex-col transition-shadow hover:shadow-[0_20px_50px_rgba(0,15,51,0.05)]">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-start gap-3 overflow-hidden">
          <Avatar>
            <AvatarImage src={mentor.profilePictureUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">{getInitials(mentor.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base">
              <Link
                href={profileHref}
                className="hover:underline focus-visible:underline line-clamp-1"
              >
                {mentor.name}
              </Link>
            </CardTitle>
            <CardDescription className="line-clamp-2">
              {mentor.title}
            </CardDescription>
          </div>
          <Badge className={profile.isAvailable ? "border-0 bg-emerald-50 text-emerald-700" : "border-0 bg-muted text-muted-foreground"}>
            {profile.isAvailable ? AVAILABLE : UNAVAILABLE}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 pt-0">
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {mentor.bio}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {profile.expertise.slice(0, 3).map((skill) => (
            <Badge key={skill} variant="secondary" className="text-xs">
              {skill}
            </Badge>
          ))}
          {profile.expertise.length > 3 && (
            <Badge variant="secondary" className="text-xs text-muted-foreground">
              +{profile.expertise.length - 3}
            </Badge>
          )}
        </div>
        <div className="mt-auto flex items-center gap-4 text-xs text-muted-foreground">
          {mentor.location && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3" />
              {mentor.location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Briefcase className="size-3" />
            {profile.yearsOfExperience}yr exp
          </span>
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
