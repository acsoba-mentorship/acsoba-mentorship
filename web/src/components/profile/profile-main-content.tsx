"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Target,
  Sparkles,
  GraduationCap,
  Briefcase,
  Pencil,
  Plus,
} from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { PublicUserProfile } from "@/lib/types";
import { ProfileSectionCard } from "./profile-section-card";
import { ProfileEditDialog } from "./profile-edit-dialog";
import { AboutSectionForm } from "./forms/about-section-form";
import { GoalsSectionForm } from "./forms/goals-section-form";
import { InterestsSectionForm } from "./forms/interests-section-form";
import { EducationForm } from "./forms/education-form";
import { ExperienceForm } from "./forms/experience-form";
import { formatDateUTC } from "@/lib/utils";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";

interface ProfileMainContentProps {
  user: PublicUserProfile;
  isOwnProfile?: boolean;
}

export function ProfileMainContent({
  user,
  isOwnProfile = false,
}: ProfileMainContentProps) {
  const mentee = user.menteeProfile;
  const education = user.education ?? [];
  const experience = user.experience ?? [];

  const [aboutOpen, setAboutOpen] = useState(false);
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [interestsOpen, setInterestsOpen] = useState(false);
  const [educationAddOpen, setEducationAddOpen] = useState(false);
  const [educationEditOpen, setEducationEditOpen] = useState(false);
  const [educationEditIndex, setEducationEditIndex] = useState<number | null>(null);
  const [educationDeleteIndex, setEducationDeleteIndex] = useState<number | null>(null);
  const [experienceAddOpen, setExperienceAddOpen] = useState(false);
  const [experienceEditOpen, setExperienceEditOpen] = useState(false);
  const [experienceEditIndex, setExperienceEditIndex] = useState<number | null>(null);
  const [experienceDeleteIndex, setExperienceDeleteIndex] = useState<number | null>(null);

  const deleteEducation = useMutation(api.users.deleteEducation);
  const deleteExperience = useMutation(api.users.deleteExperience);

  const handleDeleteEducation = async () => {
    if (educationDeleteIndex === null) return;
    await deleteEducation({ index: educationDeleteIndex });
    setEducationDeleteIndex(null);
    setEducationEditOpen(false);
    setEducationEditIndex(null);
  };

  const handleDeleteExperience = async () => {
    if (experienceDeleteIndex === null) return;
    await deleteExperience({ index: experienceDeleteIndex });
    setExperienceDeleteIndex(null);
    setExperienceEditOpen(false);
    setExperienceEditIndex(null);
  };

  return (
    <div className="space-y-5">
      {/* About */}
      <ProfileSectionCard
        title="About"
        showEdit={isOwnProfile}
        editTrigger={
          <ProfileEditDialog
            open={aboutOpen}
            onOpenChange={setAboutOpen}
            trigger={
              <Button variant="ghost" size="icon" className="size-8" aria-label="Edit About">
                <Pencil className="size-3.5" />
              </Button>
            }
            title="Edit About"
            description="Share a brief summary about yourself."
          >
            <AboutSectionForm
              user={user}
              onSuccess={() => setAboutOpen(false)}
            />
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

      {mentee ? (
        <>
          {/* Goals */}
          <ProfileSectionCard
            title="Goals"
            icon={<Target className="size-3.5 text-muted-foreground" />}
            showEdit={isOwnProfile}
            editTrigger={
              <ProfileEditDialog
                open={goalsOpen}
                onOpenChange={setGoalsOpen}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label="Edit Goals"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                }
                title="Edit Goals"
                description="Describe your mentee goals."
              >
                <GoalsSectionForm
                  user={user}
                  onSuccess={() => setGoalsOpen(false)}
                />
              </ProfileEditDialog>
            }
          >
            {mentee.goals ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {mentee.goals}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No goals added yet.
              </p>
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
                open={interestsOpen}
                onOpenChange={setInterestsOpen}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label="Edit Interests"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                }
                title="Edit Interests"
                description="Add areas you want to develop."
              >
                <InterestsSectionForm
                  user={user}
                  onSuccess={() => setInterestsOpen(false)}
                />
              </ProfileEditDialog>
            }
          >
            {user.interests.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {user.interests.map((interest) => (
                  <Badge key={interest} variant="secondary" className="text-xs">
                    {interest}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No interests added yet.
              </p>
            )}
          </ProfileSectionCard>
        </>
      ) : null}

      {/* Education */}
      <ProfileSectionCard
        title="Education"
        icon={<GraduationCap className="size-3.5 text-muted-foreground" />}
        showEdit={isOwnProfile}
        addTrigger={
          <ProfileEditDialog
            open={educationAddOpen}
            onOpenChange={setEducationAddOpen}
            trigger={
              <Button variant="ghost" size="icon" className="size-8" aria-label="Add education">
                <Plus className="size-3.5" />
              </Button>
            }
            title="Add education"
            description="Add a school or institution."
          >
            <EducationForm onSuccess={() => setEducationAddOpen(false)} />
          </ProfileEditDialog>
        }
      >
        {education.length > 0 ? (
          <ul className="space-y-4">
            {education.map((entry, i) => (
              <li key={i} className="flex items-start justify-between gap-2 rounded-lg bg-muted/40 p-3">
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-semibold">{entry.institution}</p>
                  {(entry.degree || entry.fieldOfStudy) && (
                    <p className="text-muted-foreground">
                      {[entry.degree, entry.fieldOfStudy].filter(Boolean).join(", ")}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDateUTC(entry.startDate)} - {entry.endDate != null ? formatDateUTC(entry.endDate) : "Present"}
                  </p>
                  {entry.description && (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground/80">{entry.description}</p>
                  )}
                </div>
                {isOwnProfile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0"
                    aria-label={`Edit ${entry.institution}`}
                    onClick={() => {
                      setEducationEditIndex(i);
                      setEducationEditOpen(true);
                    }}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground italic">No education added yet.</p>
        )}
      </ProfileSectionCard>
      {isOwnProfile && (
        <DeleteConfirmDialog
          open={educationDeleteIndex !== null}
          onOpenChange={(open) => !open && setEducationDeleteIndex(null)}
          title="Delete education"
          description="Are you sure you want to delete this education entry? This action cannot be undone."
          onConfirm={handleDeleteEducation}
        />
      )}
      {isOwnProfile && educationEditIndex !== null && education[educationEditIndex] && (
        <ProfileEditDialog
          open={educationEditOpen}
          onOpenChange={(open) => {
            setEducationEditOpen(open);
            if (!open) setEducationEditIndex(null);
          }}
          title="Edit education"
          description="Update this education entry."
        >
          <EducationForm
            editIndex={educationEditIndex}
            initialEntry={{
              institution: education[educationEditIndex].institution,
              degree: education[educationEditIndex].degree ?? "",
              fieldOfStudy: education[educationEditIndex].fieldOfStudy ?? "",
              startDate: education[educationEditIndex].startDate,
              ...(education[educationEditIndex].endDate != null
                ? { endDate: education[educationEditIndex].endDate }
                : {}),
              description: education[educationEditIndex].description,
            }}
            onSuccess={() => {
              setEducationEditOpen(false);
              setEducationEditIndex(null);
            }}
            onDelete={() => setEducationDeleteIndex(educationEditIndex)}
          />
        </ProfileEditDialog>
      )}

      {/* Experience */}
      <ProfileSectionCard
        title="Experience"
        icon={<Briefcase className="size-3.5 text-muted-foreground" />}
        showEdit={isOwnProfile}
        addTrigger={
          <ProfileEditDialog
            open={experienceAddOpen}
            onOpenChange={setExperienceAddOpen}
            trigger={
              <Button variant="ghost" size="icon" className="size-8" aria-label="Add experience">
                <Plus className="size-3.5" />
              </Button>
            }
            title="Add experience"
            description="Add a position or role."
          >
            <ExperienceForm onSuccess={() => setExperienceAddOpen(false)} />
          </ProfileEditDialog>
        }
      >
        {experience.length > 0 ? (
          <ul className="space-y-4">
            {experience.map((entry, i) => (
              <li key={i} className="flex items-start justify-between gap-2 rounded-lg bg-muted/40 p-3">
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-semibold">{entry.company}</p>
                  <p className="text-muted-foreground">{entry.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDateUTC(entry.startDate)} – {entry.endDate != null ? formatDateUTC(entry.endDate) : "Present"}
                  </p>
                  {entry.description && (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground/80 whitespace-pre-wrap">{entry.description}</p>
                  )}
                </div>
                {isOwnProfile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0"
                    aria-label={`Edit ${entry.company}`}
                    onClick={() => {
                      setExperienceEditIndex(i);
                      setExperienceEditOpen(true);
                    }}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground italic">No experience added yet.</p>
        )}
      </ProfileSectionCard>
      {isOwnProfile && (
        <DeleteConfirmDialog
          open={experienceDeleteIndex !== null}
          onOpenChange={(open) => !open && setExperienceDeleteIndex(null)}
          title="Delete experience"
          description="Are you sure you want to delete this experience entry? This action cannot be undone."
          onConfirm={handleDeleteExperience}
        />
      )}
      {isOwnProfile && experienceEditIndex !== null && experience[experienceEditIndex] && (
        <ProfileEditDialog
          open={experienceEditOpen}
          onOpenChange={(open) => {
            setExperienceEditOpen(open);
            if (!open) setExperienceEditIndex(null);
          }}
          title="Edit experience"
          description="Update this experience entry."
        >
          <ExperienceForm
            editIndex={experienceEditIndex}
            initialEntry={{
              company: experience[experienceEditIndex].company,
              title: experience[experienceEditIndex].title,
              startDate: experience[experienceEditIndex].startDate,
              ...(experience[experienceEditIndex].endDate != null
                ? { endDate: experience[experienceEditIndex].endDate }
                : {}),
              description: experience[experienceEditIndex].description,
            }}
            onSuccess={() => {
              setExperienceEditOpen(false);
              setExperienceEditIndex(null);
            }}
            onDelete={() => setExperienceDeleteIndex(experienceEditIndex)}
          />
        </ProfileEditDialog>
      )}
    </div>
  );
}
