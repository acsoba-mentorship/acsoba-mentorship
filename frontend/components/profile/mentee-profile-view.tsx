"use client";

import { ProfileHeader } from "./profile-header";
import { PersonalSection } from "./personal-section";
import { ExperienceSection } from "./experience-section";
import { EducationSection } from "./education-section";
import { SkillsSection } from "./skills-section";
import { MenteeWithUser } from "@/lib/types";

interface MenteeProfileViewProps {
  profile: MenteeWithUser;
  /**
   * When true, shows edit buttons on each section.
   * Default is false (read-only view).
   */
  editable?: boolean;
  /**
   * Callback for when sections are edited.
   * Only called when editable is true.
   */
  onEditSection?: (section: "personal" | "experience" | "education" | "skills") => void;
}

/**
 * Shared mentee profile view component used by:
 * - Mentee's own profile page (editable)
 * - Mentor's view of mentee profile (read-only)
 * 
 * When adding new sections to the mentee profile, add them here
 * and they will automatically appear in both views.
 */
export function MenteeProfileView({
  profile,
  editable = false,
  onEditSection,
}: MenteeProfileViewProps) {
  const handleEdit = (section: "personal" | "experience" | "education" | "skills") => {
    if (editable && onEditSection) {
      onEditSection(section);
    }
  };

  return (
    <div className="space-y-6">
      <ProfileHeader user={profile.user} bio={profile.bio} />

      <PersonalSection
        phone={profile.user.phone}
        preferredMeetingFrequency={profile.preferredMeetingFrequency}
        onEdit={editable ? () => handleEdit("personal") : undefined}
      />

      <ExperienceSection
        experience={profile.experience}
        onEdit={editable ? () => handleEdit("experience") : undefined}
      />

      <EducationSection
        education={profile.education}
        currentLearning={profile.currentLearning}
        onEdit={editable ? () => handleEdit("education") : undefined}
      />

      <SkillsSection
        title="Interests & Goals"
        interests={profile.interests}
        goals={profile.goals}
        skillLevel={profile.skillLevel}
        onEdit={editable ? () => handleEdit("skills") : undefined}
      />
    </div>
  );
}
