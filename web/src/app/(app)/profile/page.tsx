"use client";

import { Suspense } from "react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileMainContent } from "@/components/profile/profile-main-content";
import { MentorSidebar } from "@/components/profile/mentor-sidebar";
import { RoleEnrollmentCard } from "@/components/profile/role-enrollment-card";
import { useConvexAuth } from "convex/react";
import { useCurrentUser } from "@/app/CurrentUserProvider";
import type { PublicUserProfile } from "@/lib/types";

function ProfileContent() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { currentUser } = useCurrentUser();

  const loading = isLoading || (isAuthenticated && currentUser === undefined);

  if (loading) {
    return <ProfileSkeleton />;
  }

  const user = currentUser ?? null;

  if (!user) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-48" />
        <p className="text-sm text-muted-foreground">
          No profile available. Please sign in to view your profile.
        </p>
      </div>
    );
  }

  const publicUser: PublicUserProfile = {
    userId: user._id,
    username: user.username,
    name: user.name,
    title: user.title,
    bio: user.bio,
    location: user.location,
    profilePictureUrl: user.profilePictureUrl,
    email: user.email,
    phoneNumber: user.phoneNumber,
    education: user.education,
    experience: user.experience,
    interests: user.interests ?? [],
    industries:
      (user.mentorProfile
        ? user.mentorProfile.industries
        : user.menteeProfile?.industries) ??
      user.industries ??
      [],
    menteeProfile: user.menteeProfile,
    mentorProfile: user.mentorProfile,
  };

  return (
    <div className="space-y-6">
      <ProfileHeader user={publicUser} />
      <RoleEnrollmentCard user={publicUser} />
      <Separator />

      <div
        className={
          publicUser.mentorProfile
            ? "grid gap-6 lg:grid-cols-[1fr_320px]"
            : "grid gap-6"
        }
      >
        <ProfileMainContent user={publicUser} isOwnProfile={true} />
        {publicUser.mentorProfile ? (
          <MentorSidebar user={publicUser} isOwnProfile={true} />
        ) : null}
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Skeleton className="size-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <Separator />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileContent />
    </Suspense>
  );
}
