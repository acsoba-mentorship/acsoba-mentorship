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
  const isAvailable = user.mentorProfile?.isAvailable;

  return (
    <div>
      <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 -mt-8 h-48 bg-linear-to-br from-primary to-[#001A4D]">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
          <Avatar className="size-24 ring-4 ring-background bg-background">
            <AvatarImage src={user.profilePictureUrl || undefined} />
            <AvatarFallback className="text-2xl bg-primary/10 text-primary">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="pt-16 text-center">
        <h1 className="text-2xl font-bold">{user.name}</h1>
        <p className="mt-1 text-muted-foreground">{user.title}</p>
        <p className="mt-1 text-muted-foreground">{user.phoneNumber}</p>
        {user.location && (
          <p className="mt-1 flex items-center justify-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5" />
            {user.location}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {hasMentee && <Badge variant="secondary">Mentee</Badge>}
          {hasMentor && <Badge>Mentor</Badge>}
          {isAvailable && (
            <Badge className="border-0 bg-emerald-50 text-emerald-700">
              Available
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
