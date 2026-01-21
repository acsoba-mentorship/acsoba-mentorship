"use client";

import { Button } from "@/components/ui/button";
import { MenteeProfileView } from "@/components/profile/mentee-profile-view";
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

  const handleEditSection = (section: "personal" | "experience" | "education" | "skills") => {
    // Future: Open edit modal for the specific section
    console.log(`Edit ${section} section`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mentee Profile</h1>
        <p className="mt-1 text-muted-foreground">
          View and manage your mentee profile
        </p>
      </div>

      <MenteeProfileView
        profile={menteeProfile}
        editable
        onEditSection={handleEditSection}
      />
    </div>
  );
}
