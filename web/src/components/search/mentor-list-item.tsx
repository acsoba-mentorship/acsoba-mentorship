import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Briefcase } from "lucide-react";
import type { MockUser } from "@/lib/types";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface MentorListItemProps {
  mentor: MockUser;
}

export function MentorListItem({ mentor }: MentorListItemProps) {
  const profile = mentor.mentorProfile;
  if (!profile) return null;

  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-6">
        <Avatar className="size-12">
          <AvatarImage src={mentor.profilePictureUrl || undefined} />
          <AvatarFallback>{getInitials(mentor.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">{mentor.name}</p>
              <p className="text-sm text-muted-foreground">{mentor.title}</p>
            </div>
            <Badge variant={profile.isAvailable ? "default" : "secondary"}>
              {profile.isAvailable ? "Available" : "Unavailable"}
            </Badge>
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {mentor.bio}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {profile.expertise.map((skill) => (
              <Badge key={skill} variant="outline" className="text-xs">
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
            <Button size="sm" disabled={!profile.isAvailable}>
              {profile.isAvailable ? "Send Request" : "Not Available"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
