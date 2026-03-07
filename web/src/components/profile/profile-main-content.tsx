"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Target,
  Sparkles,
  GraduationCap,
  Briefcase,
  Pencil,
} from "lucide-react";
import type { User } from "@/lib/types";
import { ProfileSectionCard } from "./profile-section-card";
import { ProfileEditDialog } from "./profile-edit-dialog";

interface ProfileMainContentProps {
  user: User;
  isOwnProfile?: boolean;
}

export function ProfileMainContent({
  user,
  isOwnProfile = false,
}: ProfileMainContentProps) {
  const mentee = user.menteeProfile;
  const education = user.education ?? [];
  const experience = user.experience ?? [];

  return (
    <div className="space-y-4">
      {/* About */}
      <ProfileSectionCard
        title="About"
        showEdit={isOwnProfile}
        editTrigger={
          <ProfileEditDialog
            trigger={
              <Button variant="ghost" size="icon" className="size-8" aria-label="Edit About">
                <Pencil className="size-3.5" />
              </Button>
            }
            title="Edit About"
            description="Share a brief summary about yourself."
          >
            <p className="text-sm text-muted-foreground italic">Edit form coming in Phase 5.</p>
          </ProfileEditDialog>
        }
      >
        {user.bio ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {user.bio}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">No about section added yet.</p>
        )}
      </ProfileSectionCard>

      {/* Goals */}
      <ProfileSectionCard
        title="Goals"
        icon={<Target className="size-3.5 text-muted-foreground" />}
        showEdit={isOwnProfile}
        editTrigger={
          <ProfileEditDialog
            trigger={
              <Button variant="ghost" size="icon" className="size-8" aria-label="Edit Goals">
                <Pencil className="size-3.5" />
              </Button>
            }
            title="Edit Goals"
            description="Describe your mentee goals."
          >
            <p className="text-sm text-muted-foreground italic">Edit form coming in Phase 5.</p>
          </ProfileEditDialog>
        }
      >
        {mentee?.goals ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {mentee.goals}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">No goals added yet.</p>
        )}
      </ProfileSectionCard>

      {/* Interests */}
      <ProfileSectionCard
        title="Interests"
        description="Areas looking to develop."
        icon={<Sparkles className="size-3.5 text-muted-foreground" />}
        showEdit={isOwnProfile}
        editTrigger={
          <ProfileEditDialog
            trigger={
              <Button variant="ghost" size="icon" className="size-8" aria-label="Edit Interests">
                <Pencil className="size-3.5" />
              </Button>
            }
            title="Edit Interests"
            description="Add areas you want to develop."
          >
            <p className="text-sm text-muted-foreground italic">Edit form coming in Phase 5.</p>
          </ProfileEditDialog>
        }
      >
        {mentee && mentee.interests.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {mentee.interests.map((interest) => (
              <Badge key={interest} variant="outline" className="text-xs">
                {interest}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No interests added yet.</p>
        )}
      </ProfileSectionCard>

      {/* Education */}
      <ProfileSectionCard
        title="Education"
        icon={<GraduationCap className="size-3.5 text-muted-foreground" />}
        showEdit={isOwnProfile}
        editTrigger={
          <ProfileEditDialog
            trigger={
              <Button variant="ghost" size="icon" className="size-8" aria-label="Edit Education">
                <Pencil className="size-3.5" />
              </Button>
            }
            title="Edit Education"
            description="Add your education history."
          >
            <p className="text-sm text-muted-foreground italic">Edit form coming in Phase 6.</p>
          </ProfileEditDialog>
        }
      >
        {education.length > 0 ? (
          <ul className="space-y-3">
            {education.map((entry, i) => (
              <li key={i} className="text-sm">
                <p className="font-medium">{entry.institution}</p>
                <p className="text-muted-foreground">
                  {entry.degree} in {entry.fieldOfStudy}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground italic">No education added yet.</p>
        )}
      </ProfileSectionCard>

      {/* Experience */}
      <ProfileSectionCard
        title="Experience"
        icon={<Briefcase className="size-3.5 text-muted-foreground" />}
        showEdit={isOwnProfile}
        editTrigger={
          <ProfileEditDialog
            trigger={
              <Button variant="ghost" size="icon" className="size-8" aria-label="Edit Experience">
                <Pencil className="size-3.5" />
              </Button>
            }
            title="Edit Experience"
            description="Add your work experience."
          >
            <p className="text-sm text-muted-foreground italic">Edit form coming in Phase 6.</p>
          </ProfileEditDialog>
        }
      >
        {experience.length > 0 ? (
          <ul className="space-y-3">
            {experience.map((entry, i) => (
              <li key={i} className="text-sm">
                <p className="font-medium">{entry.company}</p>
                <p className="text-muted-foreground">{entry.title}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground italic">No experience added yet.</p>
        )}
      </ProfileSectionCard>
    </div>
  );
}
