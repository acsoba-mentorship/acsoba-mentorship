import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Briefcase } from "lucide-react";
import { AVAILABLE, UNAVAILABLE } from "@/lib/constants";
import { getInitials } from "@/lib/utils";
import type { PublicMentorProfile } from "@/lib/types";
import type { Id } from "../../../convex/_generated/dataModel";
import type { RequestStatus } from "@/components/requests/types";
import { SendRequestDialog } from "@/components/requests/send-request-dialog";

interface MentorListItemProps {
  mentor: PublicMentorProfile;
  currentUserId?: Id<"users">;
  hasMenteeProfile: boolean;
  latestRequestStatus: RequestStatus | null;
}

export function MentorListItem({
  mentor,
  currentUserId,
  hasMenteeProfile,
  latestRequestStatus,
}: MentorListItemProps) {
  const profile = mentor.mentorProfile;
  if (!profile) return null;
  const profileHref = mentor.username
    ? `/profile/${mentor.username}`
    : `/profile/id/${mentor.mentorId}`;

  return (
    <Card className="transition-shadow hover:shadow-[0_20px_50px_rgba(0,15,51,0.05)]">
      <CardContent className="flex items-start gap-4 p-6">
        <Avatar className="size-12">
          <AvatarImage src={mentor.profilePictureUrl || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary">{getInitials(mentor.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">
                <Link
                  href={profileHref}
                  className="hover:underline focus-visible:underline"
                >
                  {mentor.name}
                </Link>
              </p>
              <p className="text-sm text-muted-foreground">{mentor.title}</p>
            </div>
            <Badge className={profile.isAvailable ? "border-0 bg-emerald-50 text-emerald-700" : "border-0 bg-muted text-muted-foreground"}>
              {profile.isAvailable ? AVAILABLE : UNAVAILABLE}
            </Badge>
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {mentor.bio}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {profile.expertise.map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
