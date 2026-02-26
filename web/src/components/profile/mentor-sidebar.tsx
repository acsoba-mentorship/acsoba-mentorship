import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Briefcase,
  Users,
  CircleCheck,
  CircleX,
  Code,
  Building,
  GraduationCap,
} from "lucide-react";
import type { MockUser } from "@/lib/types";

interface MentorSidebarProps {
  user: MockUser;
  isOwnProfile?: boolean;
}

export function MentorSidebar({ user, isOwnProfile }: MentorSidebarProps) {
  const profile = user?.mentorProfile;

  if (!profile) {
    return (
      <Card className="justify-center">
        <CardContent className="flex flex-col items-center text-center mb-4">
          <div className="rounded-full bg-muted p-3">
            <GraduationCap className="size-6 text-muted-foreground" />
          </div>
          <p className="mt-3 font-medium">Become a Mentor</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Share your expertise and guide the next generation of professionals.
          </p>
          {isOwnProfile && (
            <Button size="sm" className="mt-4">
              Set Up Mentor Profile
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mentor Details */}
      <Card>
        <CardHeader>
          <CardTitle className="font-semibold">
            Mentorship Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Briefcase className="size-3.5" />
              Experience
            </span>
            <span className="text-sm font-medium">
              {profile.yearsOfExperience} years
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="size-3.5" />
              Max Mentees
            </span>
            <span className="text-sm font-medium">{profile.maxMentees}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              {profile.isAvailable ? (
                <CircleCheck className="size-3.5" />
              ) : (
                <CircleX className="size-3.5" />
              )}
              Availability
            </span>
            <Badge
              variant={profile.isAvailable ? "default" : "secondary"}
              className="text-xs"
            >
              {profile.isAvailable ? "Available" : "Unavailable"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Expertise & Industries */}
      <Card>
        <CardContent className="space-y-8">
          {profile.expertise.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Code className="size-3.5 text-muted-foreground" />
                <span className="text-sm font-semibold">Expertise</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {profile.expertise.map((expertise) => (
                  <Badge
                    key={expertise}
                    variant="secondary"
                    className="text-xs"
                  >
                    {expertise}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {profile.industries.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building className="size-3.5 text-muted-foreground" />
                <span className="text-sm font-semibold">Industries</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {profile.industries.map((industry) => (
                  <Badge
                    key={industry}
                    variant="secondary"
                    className="text-xs"
                  >
                    {industry}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CTA */}
      {isOwnProfile && (
        <Card>
          <CardContent className="flex flex-col items-center py-6 text-center">
            <GraduationCap className="size-5 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">Mentor Panel</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Manage requests, mentorships, and your mentor profile.
            </p>
            <Button asChild size="sm" variant="outline" className="mt-3">
              <Link href="/mentor">Go to Mentor Panel</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
