"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { useCurrentUser } from "@/app/CurrentUserProvider";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileMainContent } from "@/components/profile/profile-main-content";
import { MentorSidebar } from "@/components/profile/mentor-sidebar";

function ProfileByIdContent() {
  const params = useParams<{ userId?: string }>();
  const userId = params?.userId as Id<"users"> | undefined;
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { currentUser } = useCurrentUser();

  const viewedUser = useQuery(
    api.users.getUserById,
    isAuthenticated && userId ? { userId } : "skip"
  );

  const loading =
    isLoading ||
    (isAuthenticated && currentUser === undefined) ||
    (isAuthenticated && userId && viewedUser === undefined);

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!viewedUser) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-48" />
        <p className="text-sm text-muted-foreground">Profile not found.</p>
      </div>
    );
  }

  const isOwnProfile = currentUser?._id === viewedUser.userId;

  return (
    <div className="space-y-6">
      <ProfileHeader user={viewedUser} />
      <Separator />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <ProfileMainContent user={viewedUser} isOwnProfile={isOwnProfile} />
        <MentorSidebar user={viewedUser} isOwnProfile={isOwnProfile} />
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

export default function ProfileByIdPage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileByIdContent />
    </Suspense>
  );
}
