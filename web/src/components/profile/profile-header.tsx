import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, Mail } from "lucide-react";
import { getInitials } from "@/lib/utils";
import type { MockUser } from "@/lib/types";

interface ProfileHeaderProps {
  user: MockUser;
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const hasMentor = !!user.mentorProfile;
  const hasMentee = !!user.menteeProfile;

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
        <p className="mt-1 text-muted-foreground">{user.title}</p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground sm:justify-start">
          {user.location && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" />
              {user.location}
            </span>
          )}
          {user.email && (
            <span className="flex items-center gap-1">
              <Mail className="size-3.5" />
              {user.email}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
