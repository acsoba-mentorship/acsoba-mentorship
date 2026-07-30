"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useCurrentUser } from "@/app/CurrentUserProvider";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileMainContent } from "@/components/profile/profile-main-content";
import { MentorSidebar } from "@/components/profile/mentor-sidebar";

function ProfileByUsernameContent() {
  const params = useParams<{ username?: string }>();
  const username = params?.username ?? "";
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { currentUser } = useCurrentUser();

  const viewedUser = useQuery(
    api.users.getUserByUsername,
    isAuthenticated && username ? { username } : "skip"
  );

  const loading =
    isLoading ||
    (isAuthenticated && currentUser === undefined) ||
    (isAuthenticated && username && viewedUser === undefined);

  if (loading) {
    return <ProfileSkeleton />;
  }

  // TODO: Create generic 404 page for this case
  if (!viewedUser) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-48" />
        <p className="text-sm text-muted-foreground">
          Profile not found for the username: <span className="font-medium">@{username}</span>.
        </p>
      </div>
    );
  }

  const isOwnProfile = currentUser?._id === viewedUser.userId;

  return (
    <div className="space-y-6">
      <ProfileHeader user={viewedUser} />
      <Separator />

      <div
        className={
          viewedUser.mentorProfile
            ? "grid gap-6 lg:grid-cols-[1fr_320px]"
            : "grid gap-6"
        }
      >
        <ProfileMainContent
          user={viewedUser}
          isOwnProfile={isOwnProfile}
        />
        {viewedUser.mentorProfile ? (
          <MentorSidebar
            user={viewedUser}
            isOwnProfile={isOwnProfile}
          />
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

export default function ProfileByUsernamePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileByUsernameContent />
    </Suspense>
  );
}
