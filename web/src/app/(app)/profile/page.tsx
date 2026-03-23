"use client";

import { Suspense } from "react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileMainContent } from "@/components/profile/profile-main-content";
import { MentorSidebar } from "@/components/profile/mentor-sidebar";
import { useConvexAuth } from "convex/react";
import { useCurrentUser } from "@/app/CurrentUserProvider";

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

  return (
    <div className="space-y-6">
      <ProfileHeader user={user} />
      <Separator />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <ProfileMainContent user={user} isOwnProfile={true} />
        <MentorSidebar user={user} isOwnProfile={true} />
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
