 "use client";

import { ProfileHeader } from "./profile-header";
import { PersonalSection } from "./personal-section";
import { ExperienceSection } from "./experience-section";
import { EducationSection } from "./education-section";
import { SkillsSection } from "./skills-section";
import { SettingsSection } from "./settings-section";
import type { UserWithProfiles } from "@/lib/types";

interface MentorProfileViewProps {
  user: UserWithProfiles;
  /**
   * When true, shows edit buttons on each section.
   * Default is false (read-only view).
   */
  editable?: boolean;
  /**
   * Callback for when sections are edited.
   * Only called when editable is true.
   */
  onEditSection?: (
    section: "personal" | "settings" | "experience" | "education" | "skills"
  ) => void;
}

/**
 * Shared mentor profile view component used by:
 * - Mentor's own profile page (editable)
 * - Other views of the mentor profile (read-only)
 *
 * When adding new sections to the mentor profile, add them here
 * and they will automatically appear in all mentor views.
 */
export function MentorProfileView({
  user,
  editable = false,
  onEditSection,
}: MentorProfileViewProps) {
  const profile = user.mentorProfile;
  if (!profile) {
    return null;
  }

  const handleEdit = (
    section: "personal" | "settings" | "experience" | "education" | "skills"
  ) => {
    if (editable && onEditSection) {
      onEditSection(section);
    }
  };

  return (
    <div className="space-y-6">
      <ProfileHeader
        user={user}
        bio={profile.bio}
        isVerifiedMentor={user.isVerifiedMentor}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <PersonalSection
          phone={user.phone}
          linkedInUrl={profile.linkedInUrl}
          availability={profile.availability}
          onEdit={editable ? () => handleEdit("personal") : undefined}
        />

        <SettingsSection
          maxMentees={profile.maxMentees}
          currentMenteeCount={profile.currentMenteeCount}
          onEdit={editable ? () => handleEdit("settings") : undefined}
        />
      </div>

      <ExperienceSection
        experience={profile.experience}
        yearsOfExperience={profile.yearsOfExperience}
        onEdit={editable ? () => handleEdit("experience") : undefined}
      />

      <EducationSection
        education={profile.education}
        certifications={profile.certifications}
        onEdit={editable ? () => handleEdit("education") : undefined}
      />

      <SkillsSection
        title="Areas of Expertise"
        skills={profile.expertise}
        onEdit={editable ? () => handleEdit("skills") : undefined}
      />
    </div>
  );
}

