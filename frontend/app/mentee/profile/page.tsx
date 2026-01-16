"use client";

import { Button } from "@/components/ui/button";
import { ProfileHeader } from "@/components/profile/profile-header";
import { PersonalSection } from "@/components/profile/personal-section";
import { ExperienceSection } from "@/components/profile/experience-section";
import { EducationSection } from "@/components/profile/education-section";
import { SkillsSection } from "@/components/profile/skills-section";
import { currentUser, getMenteeWithUser } from "@/lib/dummy-data";

export default function MenteeProfilePage() {
  const menteeProfile = getMenteeWithUser(currentUser.id);

  if (!menteeProfile) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Mentee Profile</h1>
          <p className="mt-2 text-muted-foreground">
            You haven&apos;t set up your mentee profile yet.
          </p>
        </div>
        <Button>Create Mentee Profile</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mentee Profile</h1>
        <p className="mt-1 text-muted-foreground">
          View and manage your mentee profile
        </p>
      </div>

      <ProfileHeader
        user={menteeProfile.user}
        bio={menteeProfile.bio}
      />

      <PersonalSection
        phone={menteeProfile.user.phone}
        preferredMeetingFrequency={menteeProfile.preferredMeetingFrequency}
        onEdit={() => {
          // Future: Open edit modal
        }}
      />

      <ExperienceSection
        experience={menteeProfile.experience}
        onEdit={() => {
          // Future: Open edit modal
        }}
      />

      <EducationSection
        education={menteeProfile.education}
        currentLearning={menteeProfile.currentLearning}
        onEdit={() => {
          // Future: Open edit modal
        }}
      />

      <SkillsSection
        title="Interests & Goals"
        interests={menteeProfile.interests}
        goals={menteeProfile.goals}
        skillLevel={menteeProfile.skillLevel}
        onEdit={() => {
          // Future: Open edit modal
        }}
      />
    </div>
  );
}
