"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProfileHeader } from "@/components/profile/profile-header";
import { PersonalSection } from "@/components/profile/personal-section";
import { ExperienceSection } from "@/components/profile/experience-section";
import { EducationSection } from "@/components/profile/education-section";
import { SkillsSection } from "@/components/profile/skills-section";
import { SettingsSection } from "@/components/profile/settings-section";
import { currentUser, getMentorWithUser } from "@/lib/dummy-data";

export default function MentorProfilePage() {
  const mentorProfile = getMentorWithUser(currentUser.id);

  if (!mentorProfile) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Mentor Profile</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            You haven&apos;t set up your mentor profile yet.
          </p>
        </div>
        <Button>Create Mentor Profile</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mentor Profile</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            View and manage your mentor profile
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/mentor">← Back to Dashboard</Link>
        </Button>
      </div>

      <ProfileHeader
        user={mentorProfile.user}
        bio={mentorProfile.bio}
        isVerifiedMentor={mentorProfile.user.isVerifiedMentor}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <PersonalSection
          phone={mentorProfile.user.phone}
          linkedInUrl={mentorProfile.linkedInUrl}
          availability={mentorProfile.availability}
          onEdit={() => {
            // Future: Open edit modal
          }}
        />

        <SettingsSection
          maxMentees={mentorProfile.maxMentees}
          currentMenteeCount={mentorProfile.currentMenteeCount}
          onEdit={() => {
            // Future: Open edit modal
          }}
        />
      </div>

      <ExperienceSection
        experience={mentorProfile.experience}
        yearsOfExperience={mentorProfile.yearsOfExperience}
        onEdit={() => {
          // Future: Open edit modal
        }}
      />

      <EducationSection
        education={mentorProfile.education}
        certifications={mentorProfile.certifications}
        onEdit={() => {
          // Future: Open edit modal
        }}
      />

      <SkillsSection
        title="Areas of Expertise"
        skills={mentorProfile.expertise}
        onEdit={() => {
          // Future: Open edit modal
        }}
      />
    </div>
  );
}
