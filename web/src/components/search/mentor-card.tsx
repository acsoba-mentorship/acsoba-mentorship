import { Button } from "@/components/ui/button";
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
import { getInitials } from "@/lib/utils";
import type { MockUser } from "@/lib/types";

interface MentorCardProps {
  mentor: MockUser;
}

export function MentorCard({ mentor }: MentorCardProps) {
  const profile = mentor.mentorProfile;
  if (!profile) return null;

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Avatar>
            <AvatarImage src={mentor.profilePictureUrl || undefined} />
            <AvatarFallback>{getInitials(mentor.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base">{mentor.name}</CardTitle>
            <CardDescription className="line-clamp-1">
              {mentor.title}
            </CardDescription>
          </div>
          <Badge variant={profile.isAvailable ? "default" : "secondary"}>
            {profile.isAvailable ? "Available" : "Unavailable"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 pt-0">
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {mentor.bio}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {profile.expertise.slice(0, 3).map((skill) => (
            <Badge key={skill} variant="outline" className="text-xs">
              {skill}
            </Badge>
          ))}
          {profile.expertise.length > 3 && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
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
        <Button size="sm" className="mt-2 w-full" disabled={!profile.isAvailable}>
          {profile.isAvailable ? "Send Request" : "Not Available"}
        </Button>
      </CardContent>
    </Card>
  );
}
