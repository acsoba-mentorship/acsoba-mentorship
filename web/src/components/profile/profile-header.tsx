import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { getInitials } from "@/lib/utils";
import type { PublicUserProfile } from "@/lib/types";

interface ProfileHeaderProps {
  user: PublicUserProfile;
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const hasMentor = !!user.mentorProfile;
  const hasMentee = !!user.menteeProfile;
  const username = user.username

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <Avatar className="size-20">
        <AvatarImage src={user.profilePictureUrl || undefined} />
        <AvatarFallback className="text-xl">
          {getInitials(user.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 text-center sm:text-left">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          <h1 className="text-2xl font-bold">{user.name}</h1>
          {hasMentee && <Badge variant="secondary">Mentee</Badge>}
          {hasMentor && <Badge>Mentor</Badge>}
        </div>
        {username && <p className="mt-1 text-sm text-muted-foreground">@{username}</p>}
        <p className="mt-1 text-muted-foreground">{user.title}</p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground sm:justify-start">
          {user.location && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" />
              {user.location}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
