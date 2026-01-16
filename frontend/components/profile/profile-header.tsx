import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User } from "@/lib/types";
import { CheckCircle, MapPin, Mail } from "lucide-react";

interface ProfileHeaderProps {
  user: User;
  bio: string;
  isVerifiedMentor?: boolean;
}

export function ProfileHeader({ user, bio, isVerifiedMentor }: ProfileHeaderProps) {
  const initials = `${user.firstName[0]}${user.lastName[0]}`;

  return (
    <div className="rounded-lg border bg-white p-6 dark:bg-gray-900">
      <div className="flex flex-col gap-6 sm:flex-row">
        <Avatar className="h-24 w-24 border-2 border-gray-200 dark:border-gray-700">
          <AvatarImage src={user.avatarUrl} alt={`${user.firstName} ${user.lastName}`} />
          <AvatarFallback className="text-2xl font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">
              {user.firstName} {user.lastName}
            </h1>
            {isVerifiedMentor && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Verified Mentor
              </Badge>
            )}
          </div>

          {user.title && (
            <p className="text-lg text-gray-600 dark:text-gray-400">{user.title}</p>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
            {user.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {user.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              {user.email}
            </span>
          </div>

          <p className="text-gray-700 dark:text-gray-300">{bio}</p>
        </div>
      </div>
    </div>
  );
}
