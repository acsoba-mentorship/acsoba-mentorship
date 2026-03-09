"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Pencil,
} from "lucide-react";
import { AVAILABLE, UNAVAILABLE } from "@/lib/constants";
import type { User } from "@/lib/types";
import { ProfileSectionCard } from "./profile-section-card";
import { ProfileEditDialog } from "./profile-edit-dialog";
import { MentorDetailsForm } from "./forms/mentor-details-form";
import { MentorExpertiseForm } from "./forms/mentor-expertise-form";

interface MentorSidebarProps {
  user: User;
  isOwnProfile?: boolean;
}

export function MentorSidebar({ user, isOwnProfile = false }: MentorSidebarProps) {
  const profile = user?.mentorProfile;
  const [mentorshipDetailsOpen, setMentorshipDetailsOpen] = useState(false);
  const [expertiseOpen, setExpertiseOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Mentor Details */}
      <ProfileSectionCard
        title="Mentorship Details"
        showEdit={isOwnProfile}
        editTrigger={
          <ProfileEditDialog
            open={mentorshipDetailsOpen}
            onOpenChange={setMentorshipDetailsOpen}
            trigger={
              <Button variant="ghost" size="icon" className="size-8" aria-label="Edit Mentorship Details">
                <Pencil className="size-3.5" />
              </Button>
            }
            title="Edit Mentorship Details"
            description="Update availability, max mentees, and years of experience."
          >
            <MentorDetailsForm
              user={user}
              onSuccess={() => setMentorshipDetailsOpen(false)}
            />
          </ProfileEditDialog>
        }
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Briefcase className="size-3.5" />
              Experience
            </span>
            <span className="text-sm font-medium">
              {profile?.yearsOfExperience != null
                ? `${profile.yearsOfExperience} year${profile.yearsOfExperience === 1 ? "" : "s"}`
                : "No experience set yet"}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="size-3.5" />
              Max Mentees
            </span>
            <span className="text-sm font-medium">
              {profile?.maxMentees 
              ? `${profile?.maxMentees}` 
              : "No max mentees set yet"}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              {profile?.isAvailable ? (
                <CircleCheck className="size-3.5" />
              ) : (
                <CircleX className="size-3.5" />
              )}
              Availability
            </span>
            <Badge
              variant={profile?.isAvailable ? "default" : "secondary"}
              className="text-xs"
            >
              {profile?.isAvailable ? AVAILABLE : UNAVAILABLE}
            </Badge>
          </div>
        </div>
      </ProfileSectionCard>

      {/* Expertise & Industries */}
      <ProfileSectionCard
        title="Expertise & Industries"
        showEdit={isOwnProfile}
        editTrigger={
          <ProfileEditDialog
            open={expertiseOpen}
            onOpenChange={setExpertiseOpen}
            trigger={
              <Button variant="ghost" size="icon" className="size-8" aria-label="Edit Expertise & Industries">
                <Pencil className="size-3.5" />
              </Button>
            }
            title="Edit Expertise & Industries"
            description="Add your areas of expertise and industries."
          >
            <MentorExpertiseForm
              user={user}
              onSuccess={() => setExpertiseOpen(false)}
            />
          </ProfileEditDialog>
        }
      >
        {profile && (profile.expertise.length > 0 || profile.industries.length > 0) ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Code className="size-3.5 text-muted-foreground" />
                <span className="text-sm font-semibold">Expertise</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profile.expertise.length > 0 ? (
                  profile.expertise.map((expertise) => (
                    <Badge key={expertise} variant="secondary" className="text-xs">
                      {expertise}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">No expertise added yet.</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building className="size-3.5 text-muted-foreground" />
                <span className="text-sm font-semibold">Industries</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profile.industries.length > 0 ? (
                  profile.industries.map((industry) => (
                    <Badge key={industry} variant="secondary" className="text-xs">
                      {industry}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">No industries added yet.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No expertise or industries added yet.</p>
        )}
      </ProfileSectionCard>

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
