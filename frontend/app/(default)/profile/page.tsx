"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ProfileView } from "@/components/profile/profile-view";
import { currentUser, getUserWithProfiles } from "@/lib/dummy-data";
import type { UserRole } from "@/lib/domain/user";

function ProfileContent() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role") as UserRole | null;
  const userIdParam = searchParams.get("userId");

  const userWithProfiles = getUserWithProfiles(userIdParam ?? currentUser.id);

  const initialRole: UserRole =
    roleParam && (roleParam === "mentee" || roleParam === "mentor") ? roleParam : "mentee";

  if (!userWithProfiles) {
    return null;
  }

  return (
    <div className="space-y-6">
      <ProfileView
        user={userWithProfiles}
        initialRole={initialRole}
      />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="space-y-6">Loading profile...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
