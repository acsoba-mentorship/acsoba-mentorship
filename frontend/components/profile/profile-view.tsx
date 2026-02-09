 "use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProfileHeader } from "./profile-header";
import { MenteeProfileView } from "./mentee-profile-view";
import { MentorProfileView } from "./mentor-profile-view";
import type { UserWithProfiles } from "@/lib/types";
import type { UserRole } from "@/lib/domain/user";
import { getActiveRoles } from "@/lib/domain/user";

interface ProfileViewProps {
  user: UserWithProfiles;
  /**
   * Whether the viewer is the same as the profile owner.
   * Controls whether edit controls are shown.
   * Defaults to false (read-only).
   */
  isOwnProfile?: boolean;
  /**
   * Optionally force an initial active role tab when the user has multiple roles.
   * If not provided, the first available role is used.
   */
  initialRole?: UserRole;
}

export function ProfileView({
  user,
  isOwnProfile = false,
  initialRole,
}: ProfileViewProps) {
  const roles = getActiveRoles(user);
  const hasMentee = roles.includes("mentee");
  const hasMentor = roles.includes("mentor");

  const [activeRole, setActiveRole] = useState<UserRole | undefined>(
    initialRole ?? roles[0]
  );

  const showMentee = activeRole === "mentee" || (!activeRole && hasMentee);
  const showMentor = activeRole === "mentor" || (!activeRole && hasMentor && !hasMentee);

  const renderRoleSwitcher = () => {
    if (!hasMentor || !hasMentee) {
      return null;
    }

    return (
      <div className="inline-flex items-center gap-2 rounded-full border bg-muted p-1 text-xs">
        <Button
          type="button"
          size="sm"
          variant={activeRole === "mentee" ? "default" : "ghost"}
          className="h-7 px-3 text-xs"
          onClick={() => setActiveRole("mentee")}
        >
          Mentee
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeRole === "mentor" ? "default" : "ghost"}
          className="h-7 px-3 text-xs"
          onClick={() => setActiveRole("mentor")}
        >
          Mentor
        </Button>
      </div>
    );
  };

  const renderEmptyState = () => {
    if (!hasMentee && !hasMentor) {
      return (
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold">Profile</h1>
            <p className="mt-1 text-muted-foreground">
              You don&apos;t have a mentee or mentor profile set up yet.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            In the MVP, profiles are created as part of the mentee and mentor onboarding
            flows. Once you complete one of those flows, your profile will appear here.
          </p>
        </div>
      );
    }

    if (hasMentee && !user.menteeProfile) {
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Mentee profile</h2>
          <p className="text-muted-foreground">
            You haven&apos;t set up your mentee profile yet.
          </p>
        </div>
      );
    }

    if (hasMentor && !user.mentorProfile) {
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Mentor profile</h2>
          <p className="text-muted-foreground">
            You haven&apos;t set up your mentor profile yet.
          </p>
        </div>
      );
    }

    return null;
  };

  const renderMenteeProfile = () => {
    if (!user.menteeProfile) return null;

    return (
      <div className="space-y-6">
        <MenteeProfileView user={user} editable={isOwnProfile} />
      </div>
    );
  };

  const renderMentorProfile = () => {
    if (!user.mentorProfile) return null;

    return (
      <div className="space-y-6">
        <MentorProfileView user={user} editable={isOwnProfile} />
      </div>
    );
  };

  const emptyState = renderEmptyState();

  if (emptyState) {
    return (
      <div className="space-y-6">
        <ProfileHeader user={user} bio="" isVerifiedMentor={user.isVerifiedMentor} />
        {emptyState}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        {renderRoleSwitcher()}
      </div>

      {showMentee && renderMenteeProfile()}
      {showMentor && renderMentorProfile()}
    </div>
  );
}

